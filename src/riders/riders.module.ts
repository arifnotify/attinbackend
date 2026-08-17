import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { JwtModule } from '@nestjs/jwt';

import { RidersController } from './riders.controller';

import { RidersService } from './riders.service';

import { Rider, RiderSchema } from './schemas/rider.schema';

import { Order, OrderSchema } from '../orders/schemas/order.schema';

@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: {
        expiresIn: '30d',
      },
    }),

    MongooseModule.forFeature([
      {
        name: Rider.name,
        schema: RiderSchema,
      },

      {
        name: Order.name,
        schema: OrderSchema,
      },
    ]),
  ],

  controllers: [RidersController],

  providers: [RidersService],

  exports: [RidersService],
})
export class RidersModule {}
