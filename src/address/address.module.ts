import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Address, AddressSchema } from './schemas/address.schema';

import { AddressController } from './address.controller';

import { AddressService } from './address.service';
// 🔥 ADD THIS
import { RedisModule } from '../redis/redis.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Address.name,
        schema: AddressSchema,
      },
    ]),
    // ✅ IMPORTANT FIX
    RedisModule,
  ],

  controllers: [AddressController],

  providers: [AddressService],
})
export class AddressModule {}
