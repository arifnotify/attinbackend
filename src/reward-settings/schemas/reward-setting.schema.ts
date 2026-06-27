import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument } from 'mongoose';

export type RewardSettingsDocument = HydratedDocument<RewardSettings>;

@Schema({
  timestamps: true,
})
export class RewardSettings {
  // Regular Customer Reward %
  @Prop({
    default: 2,
  })
  regularPercentage: number;

  // Premium Customer Reward %
  @Prop({
    default: 5,
  })
  premiumPercentage: number;

  // VIP Customer Reward %
  @Prop({
    default: 8,
  })
  vipPercentage: number;

  // Every Amount
  @Prop({
    default: 100,
  })
  perAmount: number;

  // Minimum Redeem
  @Prop({
    default: 50,
  })
  minimumRedeem: number;

  // Maximum Redeem
  @Prop({
    default: 300,
  })
  maximumRedeem: number;

  // Reward Expire Days
  @Prop({
    default: 365,
  })
  expireDays: number;

  // Enable Reward System
  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const RewardSettingsSchema =
  SchemaFactory.createForClass(RewardSettings);
