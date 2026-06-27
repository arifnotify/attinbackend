import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, Types } from 'mongoose';

export type RewardWalletDocument = HydratedDocument<RewardWallet>;

@Schema({
  timestamps: true,
})
export class RewardWallet {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  })
  user: Types.ObjectId;

  // Current Balance
  @Prop({
    default: 0,
  })
  balance: number;

  // Total Earned
  @Prop({
    default: 0,
  })
  totalEarned: number;

  // Total Used
  @Prop({
    default: 0,
  })
  totalUsed: number;

  // Total Deducted (Return Product)
  @Prop({
    default: 0,
  })
  totalDeducted: number;

  // Total Expired
  @Prop({
    default: 0,
  })
  totalExpired: number;
}

export const RewardWalletSchema = SchemaFactory.createForClass(RewardWallet);
