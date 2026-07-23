import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { PaymentMethod } from '../enums/payment-method.enum';
import { PaymentStatus } from '../enums/payment-status.enum';

export type PaymentDocument = Payment & Document;

@Schema({
  timestamps: true,
})
export class Payment {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Order',
    required: false, // 🎯 পেমেন্ট আগে তৈরি হওয়ার কারণে এটি সাময়িকভাবে অপশনাল করা হলো
  })
  order: Types.ObjectId;

  @Prop({
    required: true,
  })
  amount: number;

  @Prop({
    enum: Object.values(PaymentMethod),
  })
  paymentMethod: PaymentMethod;

  @Prop({
    enum: Object.values(PaymentStatus),
    default: PaymentStatus.PENDING,
  })
  paymentStatus: PaymentStatus;

  @Prop()
  transactionId?: string;

  @Prop()
  paymentUrl?: string;
}

export const PaymentSchema = SchemaFactory.createForClass(Payment);