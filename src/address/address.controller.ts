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

import { AddressService } from './address.service';

import { CreateAddressDto } from './dto/create-address.dto';

import { UpdateAddressDto } from './dto/update-address.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('address')
export class AddressController {
  constructor(private addressService: AddressService) {}

  // CREATE ADDRESS
  @UseGuards(JwtAuthGuard)
  @Post()
  createAddress(
    @Req() req: any,

    @Body()
    createAddressDto: CreateAddressDto,
  ) {
    return this.addressService.createAddress(req.user.userId, createAddressDto);
  }

  // USER ADDRESSES
  @UseGuards(JwtAuthGuard)
  @Get()
  getUserAddresses(@Req() req: any) {
    return this.addressService.getUserAddresses(req.user.userId);
  }

  // SINGLE ADDRESS
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getSingleAddress(@Param('id') id: string) {
    return this.addressService.getSingleAddress(id);
  }

  // UPDATE ADDRESS
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateAddress(
    @Param('id') id: string,

    @Body()
    updateAddressDto: UpdateAddressDto,
  ) {
    return this.addressService.updateAddress(id, updateAddressDto);
  }

  // DELETE ADDRESS
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteAddress(@Param('id') id: string) {
    return this.addressService.deleteAddress(id);
  }
}
