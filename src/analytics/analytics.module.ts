import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from '../users/schemas/user.schema';

import { Order, OrderSchema } from '../orders/schemas/order.schema';

import { Product, ProductSchema } from '../products/schemas/product.schema';

import { AnalyticsController } from './analytics.controller';

import { AnalyticsService } from './analytics.service';

// 🔥 ADD THIS
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },

      {
        name: Order.name,
        schema: OrderSchema,
      },

      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),

    // ✅ IMPORTANT FIX
    RedisModule,
  ],

  controllers: [AnalyticsController],

  providers: [AnalyticsService],
})
export class AnalyticsModule {}
