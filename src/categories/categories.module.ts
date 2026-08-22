import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Category, CategorySchema } from './schemas/category.schema';

import { CategoriesController } from './categories.controller';

import { CategoriesService } from './categories.service';

import { ProductsModule } from '../products/products.module';
// 🔥 ADD THIS
import { RedisModule } from '../redis/redis.module';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Category.name,
        schema: CategorySchema,
      },
      {
        name: Product.name,
        schema: ProductSchema,
      },
    ]),
    // ✅ IMPORTANT FIX
    RedisModule,

    SocketModule,

    ProductsModule,
  ],

  controllers: [CategoriesController],

  providers: [CategoriesService],

  exports: [CategoriesService],
})
export class CategoriesModule {}
