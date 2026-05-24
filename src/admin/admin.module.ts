import { Module } from '@nestjs/common';

import { AdminService } from './admin.service';

import { MongooseModule } from '@nestjs/mongoose';

import { Admin, AdminSchema } from './schemas/admin.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Admin.name,
        schema: AdminSchema,
      },
    ]),
  ],

  providers: [AdminService],

  exports: [AdminService],
})
export class AdminModule {}
