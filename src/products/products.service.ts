import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Product, ProductDocument } from './schemas/product.schema';

import { CreateProductDto } from './dto/create-product.dto';

import { UpdateProductDto } from './dto/update-product.dto';

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
}
