import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type RewardTransactionDocument = HydratedDocument<RewardTransaction>;

export enum RewardTransactionType {
  EARN = 'EARN',
  REDEEM = 'REDEEM',
  DEDUCT = 'DEDUCT',
}

@Schema({ timestamps: true })
export class RewardTransaction {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop({ required: true })
  amount: number;

  @Prop({
    type: String,
    enum: RewardTransactionType,
    required: true,
  })
  type: RewardTransactionType;

  @Prop({ type: Types.ObjectId, ref: 'Order', required: false })
  order?: Types.ObjectId;

  @Prop()
  description: string;
}

export const RewardTransactionSchema =
  SchemaFactory.createForClass(RewardTransaction);
