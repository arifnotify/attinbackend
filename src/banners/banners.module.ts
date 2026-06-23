import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Banner, BannerSchema } from './schemas/banner.schema';

import { BannersController } from './banners.controller';

import { BannersService } from './banners.service';
// 🔥 ADD THIS
import { RedisModule } from '../redis/redis.module';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Banner.name,
        schema: BannerSchema,
      },
    ]),
    // ✅ IMPORTANT FIX
    RedisModule,

    SocketModule,
  ],

  controllers: [BannersController],

  providers: [BannersService],
})
export class BannersModule {}
