import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Address, AddressDocument } from './schemas/address.schema';

import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

import { RedisService } from '../redis/redis.service';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name)
    private readonly addressModel: Model<AddressDocument>,

    private readonly redisService: RedisService,

    private readonly socketGateway: SocketGateway,
  ) {}

  // =========================
  // CREATE ADDRESS
  // =========================
  async createAddress(userId: string, createAddressDto: CreateAddressDto) {
    const totalAddresses = await this.addressModel.countDocuments({
        user: userId,
      });

    // First address => default
    if (createAddressDto.isDefault || totalAddresses === 0) {
      await this.addressModel.updateMany(
        {
          user: userId,
        },
        {
          isDefault: false,
        },
      );

      createAddressDto.isDefault = true;
    }

    const address = await this.addressModel.create({
      ...createAddressDto,
      user: userId,
      });

    // Clear Cache
    await this.redisService.del(`addresses:${userId}`);

    // SOCKET EVENT
    this.socketGateway.emitAddressUpdated(userId);

    return address;
  }

  // =========================
  // GET USER ADDRESSES
  // =========================
  async getUserAddresses(userId: string) {
    const cacheKey = `addresses:${userId}`;

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }

    const addresses = await this.addressModel
        .find({
          user: userId,
        })
        .sort({
          isDefault: -1,
          createdAt: -1,
        });

    await this.redisService.set(cacheKey, JSON.stringify(addresses), 300);

    return addresses;
  }

  // =========================
  // GET SINGLE ADDRESS
  // =========================
  async getSingleAddress(id: string) {
    const address = await this.addressModel.findById(id);

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return {
      ...address.toObject(),

      googleMapUrl:
        `https://www.google.com/maps/search/?api=1&query=` +
        `${address.latitude},${address.longitude}`,
    };
  }

  // =========================
  // UPDATE ADDRESS
  // =========================
  async updateAddress(id: string, updateAddressDto: UpdateAddressDto) {
    const address = await this.addressModel.findById(id);

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (updateAddressDto.isDefault) {
      await this.addressModel.updateMany(
        {
          user: address.user,
        },
        {
          isDefault: false,
        },
      );
    }

    const updatedAddress = await this.addressModel.findByIdAndUpdate(
      id,
      updateAddressDto,
      {
        new: true,
      },
    );

    await this.redisService.del(`addresses:${address.user}`);

    // SOCKET EVENT
    this.socketGateway.emitAddressUpdated(address.user.toString());

    return updatedAddress;
  }

  // =========================
  // SET DEFAULT ADDRESS
  // =========================
  async setDefaultAddress(userId: string, addressId: string) {
    const address = await this.addressModel.findOne({
      _id: addressId,
      user: userId,
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.addressModel.updateMany(
      {
        user: userId,
      },
      {
        isDefault: false,
      },
    );

    await this.addressModel.findByIdAndUpdate(addressId, {
      isDefault: true,
    });

    await this.redisService.del(`addresses:${userId}`);

    // SOCKET EVENT
    this.socketGateway.emitAddressUpdated(userId);

    return {
      success: true,
      message: 'Default address updated successfully',
    };
  }

  // =========================
  // DELETE ADDRESS
  // =========================
  async deleteAddress(id: string) {
    const address = await this.addressModel.findById(id);

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.addressModel.findByIdAndDelete(id);

    await this.redisService.del(`addresses:${address.user}`);

    // SOCKET EVENT
    this.socketGateway.emitAddressUpdated(address.user.toString(),);

    return {
      success: true,
      message: 'Address deleted successfully',
    };
  }

  // =========================
  // GET DEFAULT ADDRESS
  // =========================
  async getDefaultAddress(userId: string) {
    return this.addressModel.findOne({
      user: userId,
      isDefault: true,
    });
  }
}
