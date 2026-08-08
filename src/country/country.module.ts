import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import { Country, CountrySchema } from './schemas/country.schema';

import { CountryController } from './country.controller';

import { CountryService } from './country.service';

@Module({
  imports: [

    MongooseModule.forFeature([
      {
        name: Country.name,
        schema: CountrySchema,
      },
    ]),

  ],

  controllers: [CountryController],

  providers: [CountryService],

  exports: [CountryService],
})
export class CountryModule {}
