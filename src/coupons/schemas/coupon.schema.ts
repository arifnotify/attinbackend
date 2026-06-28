import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type CouponDocument = HydratedDocument<Coupon>;

@Schema({
  timestamps: true,
})
export class Coupon {
  // =========================
  // COUPON CODE
  // =========================
  @Prop({
    required: true,
    unique: true,
  })
  code: string;

  // =========================
  // USER
  // =========================
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId;

  // =========================
  // ORDER (FOR PURCHASE COUPON - DAY 22)
  // =========================
  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    default: null,
  })
  order: Types.ObjectId | null;

  // =========================
  // DISCOUNT INFO
  // =========================
  @Prop({
    required: true,
  })
  discountAmount: number;

  // =========================
  // STATUS
  // =========================
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

export const CouponSchema =
  SchemaFactory.createForClass(Coupon);

// =========================
// INDEXES (PERFORMANCE FIX)
// =========================

// fast lookup for validation
CouponSchema.index({ code: 1, user: 1 });

// user active coupons
CouponSchema.index({
  user: 1,
  isActive: 1,
  isUsed: 1,
});

// order-based uniqueness (prevents duplicate purchase coupons)
CouponSchema.index({
  user: 1,
  order: 1,
});
