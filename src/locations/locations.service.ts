import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Location,
  LocationDocument,
} from './schemas/location.schema';
import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class LocationsService {
  constructor(
    @InjectModel(Location.name)
    private locationModel: Model<LocationDocument>,

    private readonly socketGateway: SocketGateway,
  ) {}

  // CREATE LOCATION
  async createLocation(
    createLocationDto: CreateLocationDto,
  ) {
    const location =
      await this.locationModel.create(
        createLocationDto,
      );

    this.socketGateway.emitLocationUpdated();

    return location;
  }

  // GET ALL LOCATIONS
  async getAllLocations() {
    return this.locationModel
      .find({
        isActive: true,
      })
      .sort({
        'division.en': 1,
      });
  }

  // GET DISTRICTS BY DIVISION (এখানে division.en বা division.bn দিয়ে সার্চ করতে পারেন)
  async getDistrictsByDivision(
    divisionName: string,
  ) {
    return this.locationModel.find({
      $or: [
        { 'division.en': divisionName },
        { 'division.bn': divisionName },
      ],
      isActive: true,
    });
  }

  // GET DELIVERY CHARGE (district.en বা district.bn দিয়ে সার্চ করতে পারেন)
  async getDeliveryCharge(
    districtName: string,
  ) {
    const location =
      await this.locationModel.findOne({
        $or: [
          { 'district.en': districtName },
          { 'district.bn': districtName },
        ],
        isActive: true,
      });

    if (!location) {
      throw new NotFoundException(
        'Location not found',
      );
    }

    return {
      district: location.district,
      deliveryCharge:
        location.deliveryCharge,
    };
  }

  // UPDATE DELIVERY CHARGE
  async updateDeliveryCharge(
    id: string,
    deliveryCharge: number,
  ) {
    const location =
      await this.locationModel.findByIdAndUpdate(
        id,
        {
          deliveryCharge,
        },
        {
          new: true,
        },
      );

    if (!location) {
      throw new NotFoundException(
        'Location not found',
      );
    }

    this.socketGateway.emitLocationUpdated();

    return location;
  }

  // GET SINGLE LOCATION
  async getLocationById(id: string) {
    const location =
      await this.locationModel.findById(id);

    if (!location) {
      throw new NotFoundException(
        'Location not found',
      );
    }

    return location;
  }

  // UPDATE LOCATION
  async updateLocation(
    id: string,
    updateLocationDto: UpdateLocationDto,
  ) {
    const location =
      await this.locationModel.findByIdAndUpdate(
        id,
        updateLocationDto,
        {
          new: true,
          runValidators: true,
        },
      );

    if (!location) {
      throw new NotFoundException(
        'Location not found',
      );
    }

    this.socketGateway.emitLocationUpdated();

    return location;
  }

  // DELETE LOCATION
  async deleteLocation(id: string) {
    const location =
      await this.locationModel.findByIdAndDelete(
        id,
      );

    if (!location) {
      throw new NotFoundException(
        'Location not found',
      );
    }

    this.socketGateway.emitLocationUpdated();

    return {
      message:
        'Location deleted successfully',
    };
  }
}