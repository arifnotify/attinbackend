import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Payment, PaymentSchema } from './schemas/payment.schema';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Cart, CartSchema } from '../cart/schemas/cart.schema'; // 1. Cart Schema যুক্ত করা হলো
import { PaymentsController } from './payments.controller';
import { PaymentsService } from './payments.service';
import { CodProvider } from './providers/cod.provider';
import { SSLCommerzProvider } from './providers/sslcommerz.provider';
import { OrdersModule } from '../orders/orders.module';
import { RewardsModule } from 'src/rewards/rewards.module'; // 2. RewardsModule যুক্ত করা হলো
import { UsersModule } from 'src/users/users.module';     // 3. UsersModule যুক্ত করা হলো
import { CartModule } from 'src/cart/cart.module';         // 4. CartModule যুক্ত করা হলো
import { SocketModule } from '../socket/socket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Payment.name,
        schema: PaymentSchema,
      },
      {
        name: Order.name,
        schema: OrderSchema,
      },
      {
        name: Cart.name, // Mongoose এ CartModel রেজিস্টার করা হলো
        schema: CartSchema,
      },
    ]),

    forwardRef(() => OrdersModule),
    RewardsModule,
    UsersModule,
    forwardRef(() => CartModule), // Circular dependency এড়াতে forwardRef
    SocketModule,
  ],

  controllers: [PaymentsController],

  providers: [PaymentsService, CodProvider, SSLCommerzProvider],

  exports: [PaymentsService],
})
export class PaymentsModule {}
