import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, Types } from 'mongoose';

export type CouponDocument = HydratedDocument<Coupon>;

@Schema({
  timestamps: true,
})
export class Coupon {
  @Prop({
    required: true,
    unique: true,
  })
  code: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  user: Types.ObjectId;

  @Prop({
    required: true,
  })
  discountAmount: number;

  @Prop({
    default: false,
  })
  isUsed: boolean;

  @Prop()
  usedAt: Date;

  @Prop({
    required: true,
  })
  expiresAt: Date;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
