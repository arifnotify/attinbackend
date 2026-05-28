import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Cart, CartSchema } from './schemas/cart.schema';

import { Product, ProductSchema } from '../products/schemas/product.schema';

import { CartController } from './cart.controller';

import { CartService } from './cart.service';

// 🔥 ADD THIS
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Cart.name,
        schema: CartSchema,
      },

      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),

    // ✅ IMPORTANT FIX
    RedisModule,
  ],

  controllers: [CartController],

  providers: [CartService],
})
export class CartModule {}
