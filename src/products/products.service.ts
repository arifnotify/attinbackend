import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Product, ProductDocument } from './schemas/product.schema';

import { CreateProductDto } from './dto/create-product.dto';

import { UpdateProductDto } from './dto/update-product.dto';
import { SearchProductDto } from './dto/search-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  // CREATE PRODUCT
  async create(createProductDto: CreateProductDto) {
    return this.productModel.create(createProductDto);
  }

  // GET ALL PRODUCTS
  async findAll(search?: string) {
    const query: any = {
      isActive: true,
    };

    // search
    if (search) {
      query.title = {
        $regex: search,
        $options: 'i',
      };
    }

    return this.productModel.find(query).sort({
      createdAt: -1,
    });
  }

  // SINGLE PRODUCT
  async findOne(id: string) {
    const product = await this.productModel.findById(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // UPDATE PRODUCT
  async update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.productModel.findByIdAndUpdate(
      id,
      updateProductDto,
      {
        new: true,
      },
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  // DELETE PRODUCT
  async remove(id: string) {
    const product = await this.productModel.findByIdAndDelete(id);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return {
      success: true,
      message: 'Product deleted successfully',
    };
  }

  async findByCategory(category: string) {
    return this.productModel.find({
      category,
      isActive: true,
    });
  }

  // SEARCH PRODUCTS
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

    // FILTER OBJECT
  const filter: any = {};

    // SEARCH KEYWORD
    if (keyword) {
      filter.$text = {
        $search: keyword,
      };
    }

    // CATEGORY FILTER
    if (category) {
      filter.category = category;
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

    // PAGINATION
    const currentPage = Number(page);

    const perPage = Number(limit);

    const skip = (currentPage - 1) * perPage;

    // SORTING
    let sortOption = {};

    switch (sort) {
      case 'lowToHigh':
        sortOption = {
          price: 1,
        };
        break;

      case 'highToLow':
        sortOption = {
          price: -1,
        };
        break;

      case 'newest':
        sortOption = {
          createdAt: -1,
        };
        break;

      default:
        sortOption = {
          createdAt: -1,
        };
    }

    // PRODUCTS
    const products = await this.productModel
      .find(filter)
      .populate('category')
      .sort(sortOption)
      .skip(skip)
      .limit(perPage);

  // TOTAL PRODUCTS
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
