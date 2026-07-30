import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Location, LocationDocument } from './schemas/location.schema';

import { CreateLocationDto } from './dto/create-location.dto';

import { UpdateLocationDto } from './dto/update-location.dto';

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
  // GET SINGLE
  async getLocationById(id: string) {
    const location = await this.locationModel.findById(id);

  if (!location) {
      throw new NotFoundException('Location not found');
  }

  return location;
}

// UPDATE
  async updateLocation(id: string, updateLocationDto: UpdateLocationDto) {
    const location = await this.locationModel.findByIdAndUpdate(
      id,
      updateLocationDto,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!location) {
    throw new NotFoundException('Location not found',);
  }

  return location;
}

// DELETE
  async deleteLocation(id: string) {
    const location = await this.locationModel.findByIdAndDelete(id);

    if (!location) {
      throw new NotFoundException('Location not found');
  }

  return {
    message: 'Location deleted successfully',
  };
}
}
