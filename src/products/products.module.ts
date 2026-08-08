import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Product, ProductSchema } from './schemas/product.schema';

import {
  Category,
  CategorySchema,
} from '../categories/schemas/category.schema';

import { ProductsController } from './products.controller';

import { ProductsService } from './products.service';

import { RedisModule } from '../redis/redis.module';
import { SocketModule } from 'src/socket/socket.module';
import { Country, CountrySchema } from 'src/country/schemas/country.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Product.name,
        schema: ProductSchema,
      },

      {
        name: Category.name,
        schema: CategorySchema,
      },

      // =========================
      // COUNTRY
      // =========================

      {
        name: Country.name,
        schema: CountrySchema,
      },
    ]),

    RedisModule,
    SocketModule,
  ],

  controllers: [ProductsController],

  providers: [ProductsService],

  exports: [ProductsService],
})
export class ProductsModule {}
