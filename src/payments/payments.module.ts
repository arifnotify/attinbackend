import { Module, forwardRef } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Payment, PaymentSchema } from './schemas/payment.schema';

import { Order, OrderSchema } from '../orders/schemas/order.schema';

import { PaymentsController } from './payments.controller';

import { PaymentsService } from './payments.service';

import { CodProvider } from './providers/cod.provider';

import { SSLCommerzProvider } from './providers/sslcommerz.provider';

import { OrdersModule } from '../orders/orders.module';

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
    ]),

    forwardRef(() => OrdersModule),
  ],

  controllers: [PaymentsController],

  providers: [PaymentsService, CodProvider, SSLCommerzProvider],

  exports: [PaymentsService],
})
export class PaymentsModule {}
