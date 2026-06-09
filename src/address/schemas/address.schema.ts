import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type AddressDocument = Address & Document;

@Schema({
  timestamps: true,
})
export class Address {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  })
  user: Types.ObjectId;

  @Prop({
    required: true,
    trim: true,
  })
  fullName: string;

  @Prop({
    required: true,
    trim: true,
  })
  phoneNumber: string;

  // গ্রামের নাম / এলাকার নাম
  @Prop({
    required: true,
    trim: true,
  })
  areaOrVillage: string;

  // মসজিদ, বাজার, স্কুল ইত্যাদি
  @Prop({
    required: true,
    trim: true,
  })
  landmark: string;

  // অতিরিক্ত নির্দেশনা
  @Prop({
    default: '',
    trim: true,
  })
  directionNote: string;

  // GPS Location
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

  // Home / Office / Other
  @Prop({
    default: 'Home',
    trim: true,
  })
  label: string;

  @Prop({
    default: false,
  })
  isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);