import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

import { Admin, AdminSchema } from './schemas/admin.schema';

import { AuthModule } from '../auth/auth.module'; // ⭐ ADD THIS

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Admin.name,
        schema: AdminSchema,
      },
    ]),

    AuthModule, // ⭐ THIS FIXES JwtService ERROR
  ],

  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
