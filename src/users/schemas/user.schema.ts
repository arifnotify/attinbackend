import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type UserDocument = User & Document;

export enum CustomerType {
  REGULAR = 'regular',
  PREMIUM = 'premium',
  VIP = 'vip',
}

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    unique: true,
  })
  phone: string;

  @Prop({
    default: true,
  })
  isActive: boolean;

  // BLOCK SYSTEM
  @Prop({
    default: false,
  })
  isBlocked: boolean;

  @Prop({
    default: '',
  })
  blockReason: string;

  // ===========================
  // CUSTOMER TYPE
  // ===========================
  @Prop({
    type: String,
    enum: CustomerType,
    default: CustomerType.REGULAR,
  })
  customerType: CustomerType;

  // ===========================
  // TOTAL SPENT
  // ===========================
  @Prop({
    default: 0,
  })
  totalSpent: number;

  // ===========================
  // TOTAL ORDERS
  // ===========================
  @Prop({
    default: 0,
  })
  totalOrders: number;

  // ===========================
  // TOTAL REWARD EARNED
  // ===========================
  @Prop({
    default: 0,
  })
  totalRewardEarned: number;

  // ===========================
  // TOTAL REWARD USED
  // ===========================
  @Prop({
    default: 0,
  })
  totalRewardUsed: number;
}

export const UserSchema = SchemaFactory.createForClass(User);
