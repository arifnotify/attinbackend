import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RiderLocationDocument =
  RiderLocation & Document;

@Schema({ timestamps: true })
export class RiderLocation {
  @Prop({
    type: Types.ObjectId,
    ref: 'Rider',
    required: true,
    unique: true,
  })
  riderId: Types.ObjectId;

  @Prop({
    type: Number,
    required: true,
  })
  lat: number;

  @Prop({
    type: Number,
    required: true,
  })
  lng: number;

  @Prop({
    default: Date.now,
  })
  updatedAt: Date;
}

export const RiderLocationSchema = SchemaFactory.createForClass(RiderLocation);
