import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { HealthController } from './health/health.controller';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { AdminModule } from './admin/admin.module';
import { RedisModule } from './redis/redis.module';
import { UploadModule } from './upload/upload.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { BannersModule } from './banners/banners.module';
import { FlashSaleModule } from './flash-sale/flash-sale.module';
import { ScheduleModule } from '@nestjs/schedule';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { AddressModule } from './address/address.module';
import { CouponsModule } from './coupons/coupons.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
    }),

    // Schedule Module
    ScheduleModule.forRoot(),

    AuthModule,

    UsersModule,

    AdminModule,

    RedisModule,

    UploadModule,

    ProductsModule,

    CategoriesModule,

    BannersModule,

    FlashSaleModule,

    CartModule,

    OrdersModule,

    AddressModule,

    CouponsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
