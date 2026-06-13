import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { FlashSale, FlashSaleDocument } from './schemas/flash-sale.schema';

import { Product, ProductDocument } from '../products/schemas/product.schema';

import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';

import { RedisService } from '../redis/redis.service';
import { UpdateFlashSaleDto } from './dto/update-flash-sale.dto';

@Injectable()
export class FlashSaleService {
  constructor(
    @InjectModel(FlashSale.name)
    private flashSaleModel: Model<FlashSaleDocument>,

    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,

    private redisService: RedisService,
  ) {}

  // =========================
  // CREATE FLASH SALE
  // =========================
  async createFlashSale(createFlashSaleDto: CreateFlashSaleDto) {
    const flashProducts: any[] = [];

    for (const item of createFlashSaleDto.products) {
      const product = await this.productModel.findById(item.product);

      if (!product) {
        throw new NotFoundException('Product not found');
      }

      // MARK FLASH SALE
      product.isFlashSale = true;
      product.flashSalePrice = item.salePrice;

      await product.save();

      flashProducts.push({
        product: product._id,
        oldPrice: product.price,
        salePrice: item.salePrice,
      });
    }

    const flashSale = await this.flashSaleModel.create({
      title: createFlashSaleDto.title,
      products: flashProducts,
      startTime: createFlashSaleDto.startTime,
      endTime: createFlashSaleDto.endTime,
      isActive: createFlashSaleDto.isActive,
    });

    // 🧠 CLEAR CACHE
    await this.redisService.del('flash_sales_active');
    await this.redisService.del('flash_sales_all');

    return flashSale;
  }

  // =========================
  // GET ACTIVE FLASH SALES (CACHED)
  // =========================
async getActiveFlashSales() {
  console.log('🟡 BYPASS CACHE TEST');

  const now = new Date();

  const flashSales = await this.flashSaleModel
    .find({
      isActive: true,
      startTime: { $lte: now },
        endTime: { $gte: now },
    })
    .populate('products.product');

  console.log('RESULT:', flashSales);

  return flashSales;
}

  // =========================
  // GET ALL FLASH SALES (CACHED)
  // =========================
  async getAllFlashSales() {
    const cacheKey = 'flash_sales_all';

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }

    const flashSales = await this.flashSaleModel
      .find()
      .populate('products.product')
      .sort({ createdAt: -1 });

    await this.redisService.set(cacheKey, JSON.stringify(flashSales), 300);

    return flashSales;
  }

  // =========================
  // EXPIRE FLASH SALES
  // =========================
  async expireFlashSales() {
    const now = new Date();

    const expiredSales = await this.flashSaleModel.find({
      endTime: { $lt: now },
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

    // 🧠 CLEAR CACHE
    await this.redisService.del('flash_sales_active');
    await this.redisService.del('flash_sales_all');

    return {
      success: true,
      message: 'Expired sales updated',
    };
  }

  // =========================
  // DELETE FLASH SALE
  // =========================
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

    // 🧠 CLEAR CACHE
    await this.redisService.del('flash_sales_active');
    await this.redisService.del('flash_sales_all');

    return {
      success: true,
      message: 'Flash sale deleted successfully',
    };
  }

  //...................
  async getFlashSaleById(id: string) {
    return this.flashSaleModel.findById(id).populate('products.product');
  }

  // update flash sale
  async updateFlashSale(id: string, dto: UpdateFlashSaleDto) {
    return this.flashSaleModel.findByIdAndUpdate(id, dto, {
      new: true,
    });
  }
}
