import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type RewardSettingsDocument =
  HydratedDocument<RewardSettings>;

@Schema({
  timestamps: true,
})
export class RewardSettings {


  // ===========================
  // CUSTOMER LEVEL CONTROL
  // ===========================

  // কত টাকা খরচ করলে Premium হবে
  @Prop({
    default: 10000,
    min: 0,
  })
  premiumAmount: number;


  // কত টাকা খরচ করলে VIP হবে
  @Prop({
    default: 50000,
    min: 0,
  })
  vipAmount: number;



  // ===========================
  // REWARD PERCENTAGE
  // ===========================

  @Prop({
    default: 2,
    min: 0,
    max: 100,
  })
  regularPercentage: number;



  @Prop({
    default: 5,
    min: 0,
    max: 100,
  })
  premiumPercentage: number;



  @Prop({
    default: 8,
    min: 0,
    max: 100,
  })
  vipPercentage: number;



  // ===========================
  // REWARD RULE
  // ===========================

  @Prop({
    default: 100,
    min: 1,
  })
  perAmount: number;



  @Prop({
    default: 50,
    min: 0,
  })
  minimumRedeem: number;



  @Prop({
    default: 300,
    min: 0,
  })
  maximumRedeem: number;



  @Prop({
    default: 365,
    min: 1,
  })
  expireDays: number;



  @Prop({
    default: true,
  })
  isActive: boolean;

}


export const RewardSettingsSchema =
  SchemaFactory.createForClass(RewardSettings);
