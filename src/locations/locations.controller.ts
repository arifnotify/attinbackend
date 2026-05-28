import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { LocationsService } from './locations.service';

import { CreateLocationDto } from './dto/create-location.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('locations')
export class LocationsController {
  constructor(private locationsService: LocationsService) {}

  // CREATE LOCATION
  @UseGuards(JwtAuthGuard)
  @Post()
  createLocation(
    @Body()
    createLocationDto: CreateLocationDto,
  ) {
    return this.locationsService.createLocation(createLocationDto);
  }

  // GET ALL LOCATIONS
  @Get()
  getAllLocations() {
    return this.locationsService.getAllLocations();
  }

  // GET DISTRICTS
  @Get('division/:division')
  getDistrictsByDivision(
    @Param('division')
    division: string,
  ) {
    return this.locationsService.getDistrictsByDivision(division);
  }

  // DELIVERY CHARGE
  @Get('delivery-charge/:district')
  getDeliveryCharge(
    @Param('district')
    district: string,
  ) {
    return this.locationsService.getDeliveryCharge(district);
  }

  // UPDATE DELIVERY CHARGE
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateDeliveryCharge(
    @Param('id') id: string,

    @Body('deliveryCharge')
    deliveryCharge: number,
  ) {
    return this.locationsService.updateDeliveryCharge(id, deliveryCharge);
  }
}
