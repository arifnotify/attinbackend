import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type LocationDocument = Location & Document;

@Schema({
  timestamps: true,
})
export class Location {
  @Prop({
    required: true,
  })
  division: string;

  @Prop({
    required: true,
  })
  district: string;

  @Prop({
    default: 0,
  })
  deliveryCharge: number;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const LocationSchema = SchemaFactory.createForClass(Location);
