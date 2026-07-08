import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Product, ProductDocument } from './schemas/product.schema';

import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';

import { RedisService } from '../redis/redis.service';

import { formatExpiryDate } from 'src/common/utils/expiry.util';
import { getFreshTime } from 'src/common/utils/fresh-time.util';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    private readonly redisService: RedisService,

    private readonly socketGateway: SocketGateway,
  ) {}

  // =========================
  // CREATE PRODUCT
  // =========================
  async create(createProductDto: CreateProductDto) {
    const product = await this.productModel.create({
      ...createProductDto,
      category: new Types.ObjectId(createProductDto.category),
    });

    await this.redisService.del('all_products');

    // 🔥 SOCKET EVENT
    this.socketGateway.emitHomeUpdated();

    return product.populate('category');
  }

  // =========================
  // GET ALL PRODUCTS (CACHE)
  // =========================
async findAll(search?: string) {
  const cacheKey = 'all_products';

  const cached = await this.redisService.get(cacheKey);

  if (cached) {
    return typeof cached === 'string'
      ? JSON.parse(cached)
      : cached;
  }

  const query: any = {
    isActive: true,
  };

  if (search) {
    query.$or = [
      {
        'title.en': {
          $regex: search,
          $options: 'i',
        },
      },
      {
        'title.bn': {
          $regex: search,
          $options: 'i',
        },
      },
      {
        'description.en': {
          $regex: search,
          $options: 'i',
        },
      },
      {
        'description.bn': {
          $regex: search,
          $options: 'i',
        },
      },
    ];
  }

  const products = await this.productModel
    .find(query)
    .populate('category')
    .sort({ createdAt: -1 });

  const formatted = products.map((product) => {
    const data: any = product.toObject();

    if (data.productType === 'fresh') {
      data.freshText = getFreshTime(data.createdAt);
    }

    if (
      data.productType === 'regular' &&
      data.expiryDate
    ) {
      data.expiryText = `Exp: ${formatExpiryDate(
        data.expiryDate,
      )}`;
    }

    return data;
  });

  await this.redisService.set(
    cacheKey,
    JSON.stringify(formatted),
    300,
  );

  return formatted;
}

  // =========================
  // SINGLE PRODUCT
  // =========================
  async findOne(id: string) {
    const product = await this.productModel
      .findById(id)
      .populate('category');

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const data: any = product.toObject();

    if (data.productType === 'fresh') {
      data.freshText = getFreshTime(data.createdAt);
    }

    if (
      data.productType === 'regular' &&
      data.expiryDate
    ) {
      data.expiryText = `Expiry: ${formatExpiryDate(
        data.expiryDate,
      )}`;
    }

    return data;
  }

  // =========================
  // UPDATE PRODUCT
  // =========================
  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ) {
    const product = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, {
        new: true,
      })
      .populate('category');

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.redisService.del('all_products');
    await this.redisService.del('admin_products');

    // 🔥 SOCKET EVENT
    this.socketGateway.emitHomeUpdated();

    return product;
  }

  // =========================
  // DELETE PRODUCT
  // =========================
  async remove(id: string) {
    const product = await this.productModel.findByIdAndDelete(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.redisService.del('all_products');

    // 🔥 SOCKET EVENT
    this.socketGateway.emitHomeUpdated();

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  // =========================
  // CATEGORY PRODUCTS
  // =========================
  async findByCategory(categoryId: string) {
    const products = await this.productModel
      .find({
        category: new Types.ObjectId(categoryId),
        isActive: true,
      })
      .populate('category')
      .sort({ createdAt: -1 });

    return products.map((product) => {
      const data: any = product.toObject();

      if (data.productType === 'fresh') {
        data.freshText = getFreshTime(data.createdAt);
      }

      if (
        data.productType === 'regular' &&
        data.expiryDate
      ) {
        data.expiryText = `Expiry: ${formatExpiryDate(
          data.expiryDate,
        )}`;
      }

      return data;
    });
  }
  // =========================
  // SEARCH PRODUCTS
  // =========================
  // =========================
// SEARCH PRODUCTS
// =========================
async searchProducts(searchDto: SearchProductDto) {
  const {
    keyword,
    category,
    minPrice,
    maxPrice,
    sort,
    page = '1',
    limit = '10',
  } = searchDto;

  const filter: any = {
    isActive: true,
  };

  // SEARCH BY TITLE / DESCRIPTION / BRAND / LOCATION
  if (keyword) {
    filter.$or = [
      {
        'title.en': {
          $regex: keyword,
          $options: 'i',
        },
      },
      {
        'title.bn': {
          $regex: keyword,
          $options: 'i',
        },
      },
      {
        'description.en': {
          $regex: keyword,
          $options: 'i',
        },
      },
      {
        'description.bn': {
          $regex: keyword,
          $options: 'i',
        },
      },
      {
        brand: {
          $regex: keyword,
          $options: 'i',
        },
      },
      {
        location: {
          $regex: keyword,
          $options: 'i',
        },
      },
    ];
  }

  // CATEGORY FILTER
  if (category) {
    filter.category = new Types.ObjectId(category);
  }

  // PRICE FILTER
  if (minPrice || maxPrice) {
    filter.price = {};

    if (minPrice) {
      filter.price.$gte = Number(minPrice);
    }

    if (maxPrice) {
      filter.price.$lte = Number(maxPrice);
    }
  }

  const currentPage = Number(page);
  const perPage = Number(limit);

  const skip =
    (currentPage - 1) * perPage;

  // SORT
  let sortOption: any = {
    createdAt: -1,
  };

  if (sort === 'lowToHigh') {
    sortOption = {
      price: 1,
    };
  }

  if (sort === 'highToLow') {
    sortOption = {
      price: -1,
    };
  }

  const products =
    await this.productModel
      .find(filter)
      .populate('category')
      .sort(sortOption)
      .skip(skip)
      .limit(perPage);

  const total =
    await this.productModel.countDocuments(
      filter,
    );

  return {
    products,
    pagination: {
      total,
      currentPage,
      totalPages: Math.ceil(
        total / perPage,
      ),
      perPage,
    },
  };
}

// =========================
// ADMIN ALL PRODUCTS
// =========================

async findAllAdmin() {

  const products =
    await this.productModel
      .find()
      .populate('category')
      .sort({
        createdAt:-1,
      });


  return products;

}
}