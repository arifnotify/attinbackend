import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { AddressService } from './address.service';

import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@UseGuards(JwtAuthGuard)
@Controller('address')
export class AddressController {
  constructor(private readonly addressService: AddressService) {}

  // Create Address
  @Post()
  async create(@Req() req: any, @Body() dto: CreateAddressDto) {
    return this.addressService.createAddress(req.user.userId, dto);
  }

  // Get All User Addresses
  @Get()
  async findAll(@Req() req: any) {
    return this.addressService.getUserAddresses(req.user.userId);
  }

  // Get Single Address
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.addressService.getSingleAddress(id);
  }

  // Update Address
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addressService.updateAddress(id, dto);
  }

  // Delete Address
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.addressService.deleteAddress(id);
  }

  // Set Default Address
  @Patch(':id/default')
  async setDefault(@Req() req: any, @Param('id') id: string) {
    return this.addressService.setDefaultAddress(req.user.userId, id);
  }
}
