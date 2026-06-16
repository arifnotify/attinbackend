import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RiderLocation, RiderLocationSchema } from './rider-location.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RiderLocation.name,
        schema: RiderLocationSchema,
      },
    ]),
  ],

  providers: [],
  controllers: [],

  exports: [],
})
export class RiderLocationModule {}
