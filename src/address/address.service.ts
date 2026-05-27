import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Address, AddressDocument } from './schemas/address.schema';

import { CreateAddressDto } from './dto/create-address.dto';

import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name)
    private addressModel: Model<AddressDocument>,
  ) {}

  // CREATE ADDRESS
  async createAddress(userId: string, createAddressDto: CreateAddressDto) {
    // remove old default
    if (createAddressDto.isDefault) {
      await this.addressModel.updateMany(
        {
          user: userId,
        },
        {
          isDefault: false,
        },
      );
    }

    const address = await this.addressModel.create({
      ...createAddressDto,
      user: userId,
    });

    return address;
  }

  // USER ADDRESSES
  async getUserAddresses(userId: string) {
    return this.addressModel
      .find({
        user: userId,
      })
      .sort({
        isDefault: -1,
        createdAt: -1,
      });
  }

  // SINGLE ADDRESS
  async getSingleAddress(id: string) {
    const address = await this.addressModel.findById(id);

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  // UPDATE ADDRESS
  async updateAddress(id: string, updateAddressDto: UpdateAddressDto) {
    const address = await this.addressModel.findById(id);

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // update default
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

    return updatedAddress;
  }

  // DELETE ADDRESS
  async deleteAddress(id: string) {
    const address = await this.addressModel.findById(id);

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    await this.addressModel.findByIdAndDelete(id);

    return {
      success: true,
      message: 'Address deleted successfully',
    };
  }
}
