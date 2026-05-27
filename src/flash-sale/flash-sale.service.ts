import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { FlashSale, FlashSaleDocument } from './schemas/flash-sale.schema';

import { Product, ProductDocument } from '../products/schemas/product.schema';

import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';

@Injectable()
export class FlashSaleService {
  constructor(
    @InjectModel(FlashSale.name)
    private flashSaleModel: Model<FlashSaleDocument>,

    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  // CREATE FLASH SALE
  async createFlashSale(createFlashSaleDto: CreateFlashSaleDto) {
    const flashProducts = [];

    for (const item of createFlashSaleDto.products) {
      const product = await this.productModel.findById(item.product);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // update product
      product.isFlashSale = true;

      product.flashSalePrice = item.salePrice;

      await product.save();

      flashProducts.push({
        product: product._id,

        oldPrice: product.price,

        salePrice: item.salePrice,
      });
    }

    // create flash sale
    return this.flashSaleModel.create({
      title: createFlashSaleDto.title,

      products: flashProducts,

      startTime: createFlashSaleDto.startTime,

      endTime: createFlashSaleDto.endTime,

      isActive: createFlashSaleDto.isActive,
    });
  }

  // GET ACTIVE FLASH SALES
  async getActiveFlashSales() {
    const now = new Date();

    return this.flashSaleModel
      .find({
        isActive: true,

        startTime: {
          $lte: now,
        },

        endTime: {
          $gte: now,
        },
      })
      .populate('products.product');
  }

  // GET ALL FLASH SALES
  async getAllFlashSales() {
    return this.flashSaleModel.find().populate('products.product').sort({
      createdAt: -1,
    });
  }

  // EXPIRE FLASH SALES
  async expireFlashSales() {
    const now = new Date();

    const expiredSales = await this.flashSaleModel.find({
      endTime: {
        $lt: now,
      },

      isActive: true,
    });

    for (const sale of expiredSales) {
      for (const item of sale.products) {
        const product = await this.productModel.findById(item.product);

        if (product) {
          product.isFlashSale = false;

          product.flashSalePrice = 0;

          await product.save();
        }
      }

      sale.isActive = false;

      await sale.save();
    }

    return {
      success: true,
    };
  }

  // DELETE FLASH SALE
  async deleteFlashSale(id: string) {
    const flashSale = await this.flashSaleModel.findById(id);

    if (!flashSale) {
      throw new NotFoundException('Flash sale not found');
    }

    for (const item of flashSale.products) {
      const product = await this.productModel.findById(item.product);

      if (product) {
        product.isFlashSale = false;

        product.flashSalePrice = 0;

        await product.save();
      }
    }

    await this.flashSaleModel.findByIdAndDelete(id);

    return {
      success: true,
      message: 'Flash sale deleted',
    };
  }
}
