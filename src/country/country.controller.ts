import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { CountryService } from './country.service';

import { CreateCountryDto } from './dto/create-country.dto';

import { UpdateCountryDto } from './dto/update-country.dto';

@Controller('countries')
export class CountryController {
  constructor(private readonly countryService: CountryService) {}

  // =========================
  // CREATE
  // =========================

  @Post()
  create(
    @Body()
    createCountryDto: CreateCountryDto,
  ) {
    return this.countryService.create(createCountryDto);
  }


  // =========================
  // GET ALL
  // =========================

  @Get()
  findAll() {

    return this.countryService.findAll();
  }


  // =========================
  // GET ONE
  // =========================

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {

    return this.countryService.findOne(
      id,
    );
  }


  // =========================
  // UPDATE
  // =========================

  @Patch(':id')
  update(
    @Param('id') id: string,

    @Body()
    updateCountryDto: UpdateCountryDto,
  ) {
    return this.countryService.update(id, updateCountryDto);
  }


  // =========================
  // DELETE
  // =========================

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.countryService.remove(
      id,
    );
  }
}