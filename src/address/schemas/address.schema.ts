import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({
  timestamps: true,
})
export class Address {

  // =========================
  // USER REFERENCE
  // =========================
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  // =========================
  // BASIC INFO
  // =========================
  @Prop({ required: true, trim: true })
  fullName: string;

  @Prop({ required: true, trim: true })
  phoneNumber: string;

  @Prop({ required: true, trim: true })
  areaOrVillage: string;

  @Prop({ required: true, trim: true })
  landmark: string;

  @Prop({ default: '', trim: true })
  directionNote: string;

  // =========================
  // GPS LOCATION (IMPORTANT FOR RIDER MAP)
  // =========================
  @Prop({
    required: true,
    min: -90,
    max: 90,
  })
  latitude: number;

  @Prop({
    required: true,
    min: -180,
    max: 180,
  })
  longitude: number;

  // =========================
  // GOOGLE MAP READY URL (NEW)
  // =========================
  @Prop()
  googleMapUrl: string;

  // =========================
  // LABEL (HOME / OFFICE)
  // =========================
  @Prop({ default: 'Home' })
  label: string;

  @Prop({ default: false })
  isDefault: boolean;

  // =========================
  // NEW: TRACKING SUPPORT (IMPORTANT)
  // =========================
  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isDeleted: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);