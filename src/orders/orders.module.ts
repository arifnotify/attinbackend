import { Module, forwardRef } from '@nestjs/common';
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

import { Address, AddressSchema } from '../address/schemas/address.schema';

import { Product, ProductSchema } from '../products/schemas/product.schema';

import { RedisModule } from '../redis/redis.module';
import { RewardsModule } from '../rewards/rewards.module';
import { UsersModule } from '../users/users.module';
import { CartModule } from '../cart/cart.module';
import { PaymentsModule } from '../payments/payments.module';
import { SocketGateway } from "../socket/socket.gateway";

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
      {
        name: Address.name,
        schema: AddressSchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),

    RedisModule,

    // ✅ FIX
    forwardRef(() => PaymentsModule),

    RewardsModule,
    UsersModule,
    CartModule,
  ],

  controllers: [OrdersController],

  providers: [OrdersService,
              SocketGateway,],

  exports: [OrdersService],
})
export class OrdersModule {}
