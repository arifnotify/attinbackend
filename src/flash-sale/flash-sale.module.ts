import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { FlashSale, FlashSaleSchema } from './schemas/flash-sale.schema';

import { Product, ProductSchema } from '../products/schemas/product.schema';

import { FlashSaleController } from './flash-sale.controller';

import { FlashSaleService } from './flash-sale.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: FlashSale.name,
        schema: FlashSaleSchema,
      },

      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
  ],

  controllers: [FlashSaleController],

  providers: [FlashSaleService],
})
export class FlashSaleModule {}