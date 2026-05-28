import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

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
    enum: ['percentage', 'fixed'],
    required: true,
  })
  type: string;

  @Prop({
    required: true,
  })
  discount: number;

  @Prop({
    default: 0,
  })
  minimumOrderAmount: number;

  @Prop({
    required: true,
  })
  expireDate: Date;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    default: 0,
  })
  usageCount: number;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
