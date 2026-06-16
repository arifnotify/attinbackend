import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';

import { Order, OrderSchema } from './schemas/order.schema';
import {
  RiderLocation,
  RiderLocationSchema,
} from './rider-location/rider-location.schema';

import { Cart, CartSchema } from '../cart/schemas/cart.schema';
import { User, UserSchema } from '../users/schemas/user.schema';

import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },

      {
        name: RiderLocation.name,
        schema: RiderLocationSchema,
      },

      {
        name: Cart.name,
        schema: CartSchema,
      },

      {
        name: User.name,
        schema: UserSchema,
      },
    ]),

    RedisModule,
  ],

  controllers: [OrdersController],

  providers: [OrdersService],

  exports: [OrdersService],
})
export class OrdersModule {}