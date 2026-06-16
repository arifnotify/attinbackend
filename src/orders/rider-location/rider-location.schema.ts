import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type RiderLocationDocument = RiderLocation & Document;

@Schema({
  timestamps: true,
})
export class RiderLocation {
  // =========================
  // RIDER ID
  // =========================
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  riderId: Types.ObjectId;

  // =========================
  // LIVE LATITUDE
  // =========================
  @Prop({
    type: Number,
    required: true,
  })
  lat: number;

  // =========================
  // LIVE LONGITUDE
  // =========================
  @Prop({
    type: Number,
    required: true,
  })
  lng: number;

  // =========================
  // LAST UPDATE TIME
  // =========================
  @Prop({
    type: Date,
    default: Date.now,
  })
  lastUpdated: Date;
}

export const RiderLocationSchema =
  SchemaFactory.createForClass(RiderLocation);