import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RewardSettingsDocument = HydratedDocument<RewardSettings>;

@Schema({
  timestamps: true,
})
export class RewardSettings {
  @Prop({ default: 2, min: 0, max: 100 })
  regularPercentage: number;

  @Prop({ default: 5, min: 0, max: 100 })
  premiumPercentage: number;

  @Prop({ default: 8, min: 0, max: 100 })
  vipPercentage: number;

  @Prop({ default: 100, min: 1 })
  perAmount: number;

  @Prop({ default: 50, min: 0 })
  minimumRedeem: number;

  @Prop({ default: 300, min: 0 })
  maximumRedeem: number;

  @Prop({ default: 365, min: 1 })
  expireDays: number;

  @Prop({ default: true })
  isActive: boolean;
}

export const RewardSettingsSchema =
  SchemaFactory.createForClass(RewardSettings);