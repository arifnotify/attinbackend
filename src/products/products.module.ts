import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Product, ProductSchema } from './schemas/product.schema';

import { ProductsController } from './products.controller';

import { ProductsService } from './products.service';

// 🔥 ADD THIS
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),

    // ✅ IMPORTANT FIX
    RedisModule,
  ],

  controllers: [ProductsController],

  providers: [ProductsService],

  exports: [ProductsService],
})
export class ProductsModule {}
