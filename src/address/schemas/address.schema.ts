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
  })
  user: Types.ObjectId;

  @Prop({
    required: true,
  })
  fullName: string;

  @Prop({
    required: true,
  })
  phoneNumber: string;

  @Prop({
    required: true,
  })
  division: string;

  @Prop({
    required: true,
  })
  district: string;

  @Prop({
    required: true,
  })
  area: string;

  @Prop({
    required: true,
  })
  addressLine: string;

  @Prop({
    default: false,
  })
  isDefault: boolean;
}

export const AddressSchema = SchemaFactory.createForClass(Address);
