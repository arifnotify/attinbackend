import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { LocationsService } from './locations.service';

import { CreateLocationDto } from './dto/create-location.dto';
import { UpdateLocationDto } from './dto/update-location.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('locations')
export class LocationsController {
  constructor(
    private readonly locationsService: LocationsService,
  ) {}

  // CREATE
  @UseGuards(JwtAuthGuard)
  @Post()
  createLocation(
    @Body()
    createLocationDto: CreateLocationDto,
  ) {
    return this.locationsService.createLocation(
      createLocationDto,
    );
  }

  // GET ALL
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
    return this.locationsService.getDistrictsByDivision(
      division,
    );
  }

  // DELIVERY CHARGE
  @Get('delivery-charge/:district')
  getDeliveryCharge(
    @Param('district')
    district: string,
  ) {
    return this.locationsService.getDeliveryCharge(
      district,
    );
  }

  // GET SINGLE
  @Get(':id')
  getLocationById(
    @Param('id')
    id: string,
  ) {
    return this.locationsService.getLocationById(
      id,
    );
  }

  // UPDATE
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateLocation(
    @Param('id')
    id: string,

    @Body()
    updateLocationDto: UpdateLocationDto,
  ) {
    return this.locationsService.updateLocation(
      id,
      updateLocationDto,
    );
  }

  // DELETE
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteLocation(
    @Param('id')
    id: string,
  ) {
    return this.locationsService.deleteLocation(
      id,
    );
  }
}