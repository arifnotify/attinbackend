import { Body, Controller, Get, Param, Put } from '@nestjs/common';

import { RiderLocationService } from './rider-location.service';

@Controller('rider-location')
export class RiderLocationController {
  constructor(private readonly service: RiderLocationService) {}

  @Put()
  updateLocation(@Body() body: any) {
    return this.service.updateLocation(body.riderId, body.lat, body.lng);
  }

  @Get(':riderId')
  getLocation(@Param('riderId') riderId: string) {
    return this.service.getLocation(riderId);
  }
}
