import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Location, LocationDocument } from './schemas/location.schema';

import { CreateLocationDto } from './dto/create-location.dto';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name)
    private locationModel: Model<LocationDocument>,
  ) {}

  // CREATE LOCATION
  async createLocation(createLocationDto: CreateLocationDto) {
    return this.locationModel.create(createLocationDto);
  }

  // GET ALL LOCATIONS
  async getAllLocations() {
    return this.locationModel
      .find({
        isActive: true,
      })
      .sort({
        division: 1,
      });
  }

  // GET DISTRICTS BY DIVISION
  async getDistrictsByDivision(division: string) {
    return this.locationModel.find({
      division,
      isActive: true,
    });
  }

  // GET DELIVERY CHARGE
  async getDeliveryCharge(district: string) {
    const location = await this.locationModel.findOne({
      district,
      isActive: true,
    });

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return {
      district: location.district,

      deliveryCharge: location.deliveryCharge,
    };
  }

  // UPDATE DELIVERY CHARGE
  async updateDeliveryCharge(id: string, deliveryCharge: number) {
    const location = await this.locationModel.findByIdAndUpdate(
      id,
      {
        deliveryCharge,
      },
      {
        new: true,
      },
    );

    if (!location) {
      throw new NotFoundException('Location not found');
    }

    return location;
  }
}
