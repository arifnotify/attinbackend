import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type CountryDocument = Country & Document;

@Schema({
  timestamps: true,
})
export class Country {
  // =========================
  // COUNTRY NAME
  // =========================

  @Prop({
    required: true,
    unique: true,
    trim: true,
  })
  name: string;


  // =========================
  // COUNTRY CODE
  // =========================

  @Prop({
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
  })
  code: string;


  // =========================
  // FLAG IMAGE URL
  // =========================

  @Prop({
    required: true,
    trim: true,
  })
  flag: string;
}

export const CountrySchema = SchemaFactory.createForClass(Country);
