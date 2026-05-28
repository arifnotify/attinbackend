import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Product, ProductDocument } from './schemas/product.schema';

import { CreateProductDto } from './dto/create-product.dto';

import { UpdateProductDto } from './dto/update-product.dto';

import { SearchProductDto } from './dto/search-product.dto';

import { RedisService } from '../redis/redis.service';

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

    // 🧠 CLEAR CACHE
    await this.redisService.del('all_products');

    return product;
  }

  // =========================
  // GET ALL PRODUCTS (WITH CACHE)
  // =========================
  async findAll(search?: string) {
    const cacheKey = 'all_products';

    // 🔥 CHECK CACHE FIRST
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return JSON.parse(cached as string);
    }

    const query: any = {
      isActive: true,
    };

    if (search) {
      query.title = {
        $regex: search,
        $options: 'i',
      };
    }

    const products = await this.productModel
      .find(query)
      .sort({ createdAt: -1 });

    // 💾 SAVE TO CACHE (5 min)
    await this.redisService.set(cacheKey, JSON.stringify(products), 300);

    return products;
  }

  // =========================
  // SINGLE PRODUCT
  // =========================
  async findOne(id: string) {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
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

    // 🧠 CLEAR CACHE
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

    // 🧠 CLEAR CACHE
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
      filter.$text = { $search: keyword };
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
        sortOption = { createdAt: -1 };
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
