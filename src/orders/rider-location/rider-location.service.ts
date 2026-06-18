import { Injectable, BadRequestException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { RiderLocation, RiderLocationDocument } from './rider-location.schema';

@Injectable()
export class RiderLocationService {
  constructor(
    @InjectModel(RiderLocation.name)
    private riderLocationModel: Model<RiderLocationDocument>,
  ) {}

  async updateLocation(riderId: string, lat: number, lng: number) {
    if (!Types.ObjectId.isValid(riderId)) {
      throw new BadRequestException('Invalid Rider Id');
    }

    const objectId = new Types.ObjectId(riderId);

    return this.riderLocationModel.findOneAndUpdate(
      {
        riderId: objectId,
      },
      {
        riderId: objectId,
        lat,
        lng,
        updatedAt: new Date(),
      },
      {
        upsert: true,
        returnDocument: 'after',
      },
    );
  }

  async getLocation(riderId: string) {
    if (!Types.ObjectId.isValid(riderId)) {
      throw new BadRequestException('Invalid Rider Id');
    }

    return this.riderLocationModel.findOne({
      riderId: new Types.ObjectId(riderId),
    });
  }
}
