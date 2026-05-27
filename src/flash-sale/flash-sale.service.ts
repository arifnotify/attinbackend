import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { FlashSale, FlashSaleDocument } from './schemas/flash-sale.schema';

import { Product, ProductDocument } from '../products/schemas/product.schema';

import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';
import { Cron } from '@nestjs/schedule';

@Injectable()
export class FlashSaleService {
  constructor(
    @InjectModel(FlashSale.name)
    private flashSaleModel: Model<FlashSaleDocument>,

    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  // CREATE FLASH SALE
  async create(createFlashSaleDto: CreateFlashSaleDto) {
    const product = await this.productModel.findById(
      createFlashSaleDto.product,
    );

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // save old price
    const oldPrice = product.price;

    // update product flash sale
    product.price = createFlashSaleDto.flashPrice;

    product.isFlashSale = true;

    await product.save();

    // create flash sale
    return this.flashSaleModel.create({
      product: product._id,

      oldPrice,

      flashPrice: createFlashSaleDto.flashPrice,

      startTime: createFlashSaleDto.startTime,

      endTime: createFlashSaleDto.endTime,
    });
  }

  // GET ACTIVE FLASH SALES
  async findAll() {
    const now = new Date();

    return this.flashSaleModel
      .find({
        startTime: { $lte: now },
        endTime: { $gte: now },
        isActive: true,
      })
      .populate('product');
  }

  // AUTO RESTORE PRICE
  async restoreExpiredFlashSales() {
    const now = new Date();

    const expiredSales = await this.flashSaleModel.find({
      endTime: { $lt: now },
      isActive: true,
    });

    for (const sale of expiredSales) {
      const product = await this.productModel.findById(sale.product);

      if (product) {
        // restore old price
        product.price = sale.oldPrice;

        product.isFlashSale = false;

        await product.save();
      }

      // deactivate flash sale
      sale.isActive = false;

      await sale.save();
    }

    return {
      success: true,
      message: 'Expired flash sales restored',
    };
  }
  // RUN EVERY MINUTE
  @Cron('* * * * *')
  async handleFlashSaleRestore() {
    console.log('Checking expired flash sales...');

    await this.restoreExpiredFlashSales();
  }
}
