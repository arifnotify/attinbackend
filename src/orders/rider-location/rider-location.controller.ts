<<<<<<< HEAD
import { Body, Controller, Get, Param, Put } from '@nestjs/common';
=======
import {
  Body,
  Controller,
  Get,
  Param,
  Put,
} from '@nestjs/common';

>>>>>>> 7f5b71835b76e7b1fbdac9ee8193748be4d04c07
import { RiderLocationService } from './rider-location.service';

@Controller('rider-location')
export class RiderLocationController {
<<<<<<< HEAD
  constructor(private readonly service: RiderLocationService) {}

  @Put()
  updateLocation(@Body() body: any) {
    return this.service.updateLocation(body.riderId, body.lat, body.lng);
  }

  @Get(':riderId')
  getLocation(@Param('riderId') riderId: string) {
=======
  constructor(
    private readonly service: RiderLocationService,
  ) {}

  @Put()
  updateLocation(@Body() body: any) {
    return this.service.updateLocation(
      body.riderId,
      body.lat,
      body.lng,
    );
  }

  @Get(':riderId')
  getLocation(
    @Param('riderId') riderId: string,
  ) {
>>>>>>> 7f5b71835b76e7b1fbdac9ee8193748be4d04c07
    return this.service.getLocation(riderId);
  }
}
