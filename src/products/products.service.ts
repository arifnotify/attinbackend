import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

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
    private productModel: Model<ProductDocument>,

    private redisService: RedisService,
  ) {}

  // =========================
  // CREATE PRODUCT
  // =========================
  async create(createProductDto: CreateProductDto) {
    const product = await this.productModel.create(createProductDto);

    // CLEAR CACHE
    await this.redisService.del('all_products');

    return product;
  }

  // =========================
  // GET ALL PRODUCTS (CACHE FIXED)
  // =========================
  async findAll(search?: string) {
    const cacheKey = 'all_products';

    // GET CACHE
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      console.log('🔥 FROM REDIS');

      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }

    console.log('🟢 FROM MONGODB');

    const query: any = {
      isActive: true,
    };

    if (search) {
      query.title = {
        $regex: search,
        $options: 'i',
      };
    }

    const formattedProducts = Product.map((product) => {
      const data: any = product.toObject();

      if (data.productType === 'fresh') {
        data.freshText = getFreshTime(data.createdAt);
      }

      if (data.productType === 'regular' && data.expiryDate) {
        data.expiryText = `Expiry: ${formatExpiryDate(data.expiryDate)}`;
      }

      return data;
    });

    // SAVE CACHE (SAFE)
await this.redisService.set(
      cacheKey,
      JSON.stringify(formattedProducts),
      300,
    );

    return formattedProducts;
  }

  // =========================
  // SINGLE PRODUCT
  // =========================
  async findOne(id: string) {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const data: any = product.toObject();

    if (data.productType === 'fresh') {
      data.freshText = getFreshTime(data.createdAt);
    }

    if (data.productType === 'regular' && data.expiryDate) {
      data.expiryText = `Expiry: ${formatExpiryDate(data.expiryDate)}`;
    }

    return data;
  }

  // =========================
  // UPDATE PRODUCT
  // =========================
  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productModel.findByIdAndUpdate(
      id,
      updateProductDto,
      { new: true },
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // CLEAR CACHE
    await this.redisService.del('all_products');

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

    // CLEAR CACHE
    await this.redisService.del('all_products');

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  // =========================
  // CATEGORY PRODUCTS
  // =========================
  async findByCategory(category: string) {
    return this.productModel.find({
      category,
      isActive: true,
    });
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

    const filter: any = {};

    if (keyword) {
      filter.$text = {
        $search: keyword,
      };
    }

    if (category) {
      filter.category = category;
    }

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
    const skip = (currentPage - 1) * perPage;

    let sortOption = {};

    switch (sort) {
      case 'lowToHigh':
        sortOption = { price: 1 };
        break;

      case 'highToLow':
        sortOption = { price: -1 };
        break;

      case 'newest':
      default:
        sortOption = {
          createdAt: -1,
        };
    }

    const products = await this.productModel
      .find(filter)
      .populate('category')
      .sort(sortOption)
      .skip(skip)
      .limit(perPage);

    const total = await this.productModel.countDocuments(filter);

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
