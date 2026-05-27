import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Order, OrderSchema } from './schemas/order.schema';

import { Cart, CartSchema } from '../cart/schemas/cart.schema';

import { OrdersController } from './orders.controller';

import { OrdersService } from './orders.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Order.name,
        schema: OrderSchema,
      },

      {
        name: Cart.name,
        schema: CartSchema,
      },
    ]),
  ],

  controllers: [OrdersController],

  providers: [OrdersService],
})
export class OrdersModule {}
