import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RiderLocation, RiderLocationSchema } from './rider-location.schema';
import { RiderLocationController } from './rider-location.controller';
import { RiderLocationService } from './rider-location.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RiderLocation.name,
        schema: RiderLocationSchema,
      },
    ]),
  ],

  controllers: [RiderLocationController],
  providers: [RiderLocationService],

  exports: [RiderLocationService],
})
export class RiderLocationModule {}
