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
import { PaymentSettingsModule } from 'src/payment-settings/payment-settings.module';
import { SocketGateway } from 'src/socket/socket.gateway';
import {
  PaymentSetting,
  PaymentSettingSchema,
} from 'src/payment-settings/schemas/payment-setting.schema';

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
      {
        name: PaymentSetting.name,
        schema: PaymentSettingSchema,
      },
    ]),

    RedisModule,

    // ✅ FIX
    forwardRef(() => PaymentsModule),

    RewardsModule,
    UsersModule,
    CartModule,
    PaymentSettingsModule,
  ],

  controllers: [OrdersController],

  providers: [OrdersService, SocketGateway],

  exports: [OrdersService],
})
export class OrdersModule {}
