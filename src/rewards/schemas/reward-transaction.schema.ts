import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { HydratedDocument, Types } from 'mongoose';

export type RewardTransactionDocument =
  HydratedDocument<RewardTransaction>;

export enum RewardTransactionType {
  EARN = 'earn',

  REDEEM = 'redeem',

  RETURN = 'return',

  EXPIRE = 'expire',

  MANUAL_ADD = 'manual_add',

  MANUAL_REMOVE = 'manual_remove',
}

@Schema({
  timestamps: true,
})
export class RewardTransaction {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId;

  @Prop({
    required: true,
  })
  amount: number;

  @Prop({
    enum: RewardTransactionType,
    required: true,
  })
  type: RewardTransactionType;

  @Prop({
    default: '',
  })
  description: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
  })
  order?: Types.ObjectId;

  @Prop()
  expireAt?: Date;
}

export const RewardTransactionSchema =
  SchemaFactory.createForClass(RewardTransaction);
