import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Country, CountryDocument } from './schemas/country.schema';

import { CreateCountryDto } from './dto/create-country.dto';

import { UpdateCountryDto } from './dto/update-country.dto';

@Injectable()
export class CountryService {

  constructor(
    @InjectModel(Country.name)
    private readonly countryModel:
      Model<CountryDocument>,
  ) {}


  // =========================
  // CREATE COUNTRY
  // =========================

  async create(
    createCountryDto: CreateCountryDto,
  ) {

    const country =
      await this.countryModel.create(
        createCountryDto,
      );

    return country;
  }


  // =========================
  // GET ALL COUNTRIES
  // =========================

  async findAll() {

    return this.countryModel
      .find()
      .sort({
        name: 1,
      })
      .lean();
  }


  // =========================
  // GET SINGLE COUNTRY
  // =========================

  async findOne(
    id: string,
  ) {

    const country =
      await this.countryModel
        .findById(id)
        .lean();

    if (!country) {
      throw new NotFoundException(
        'Country not found',
      );
    }

    return country;
  }


  // =========================
  // UPDATE COUNTRY
  // =========================

  async update(
    id: string,
    updateCountryDto: UpdateCountryDto,
  ) {

    const country =
      await this.countryModel
        .findByIdAndUpdate(
          id,
          updateCountryDto,
          {
            new: true,
            runValidators: true,
          },
        )
        .lean();

    if (!country) {
      throw new NotFoundException(
        'Country not found',
      );
    }

    return country;
  }


  // =========================
  // DELETE COUNTRY
  // =========================

  async remove(
    id: string,
  ) {

    const country =
      await this.countryModel
        .findByIdAndDelete(id);

    if (!country) {
      throw new NotFoundException(
        'Country not found',
      );
    }

    return {
      success: true,
      message:
        'Country deleted successfully',
    };
  }
}