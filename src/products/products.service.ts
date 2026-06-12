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

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private readonly productModel: Model<ProductDocument>,

    private readonly redisService: RedisService,
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

    return product;
  }

  // =========================
  // DELETE PRODUCT
  // =========================
  async remove(id: string) {
    const product =
      await this.productModel.findByIdAndDelete(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    await this.redisService.del('all_products');

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  // =========================
  // CATEGORY PRODUCTS
  // =========================
async findByCategory(categoryId: string) {
  return this.productModel
    .find({
      category: categoryId,   // 🔥 IMPORTANT CHANGE
      isActive: true,
    })
    .populate('category')
    .sort({ createdAt: -1 });
}

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

    if (keyword) {
      filter.$text = { $search: keyword };
    }

    if (category) {
      filter.category = new Types.ObjectId(category);
    }

    if (minPrice || maxPrice) {
      filter.price = {};

      if (minPrice)
        filter.price.$gte = Number(minPrice);

      if (maxPrice)
        filter.price.$lte = Number(maxPrice);
    }

    const currentPage = Number(page);
    const perPage = Number(limit);
    const skip =
      (currentPage - 1) * perPage;

    let sortOption: any = { createdAt: -1 };

    if (sort === 'lowToHigh') {
      sortOption = { price: 1 };
    } else if (sort === 'highToLow') {
      sortOption = { price: -1 };
    }

    const products = await this.productModel
      .find(filter)
      .populate('category')
      .sort(sortOption)
      .skip(skip)
      .limit(perPage);

    const total =
      await this.productModel.countDocuments(filter);

    return {
      products,
      pagination: {
        total,
        currentPage,
        totalPages: Math.ceil(total / perPage),
        perPage,
      },
    };
  }
}