import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../enums/order-status.enum';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  // =========================
  // USER INFO
  // =========================
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
    required: true,
  })
  user: Types.ObjectId;

  @Prop()
  customerPhone: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Address',
    required: true,
  })
  shippingAddress: Types.ObjectId;

  // =========================
  // ITEMS
  // =========================
  @Prop([
    {
      product: {
        type: Types.ObjectId,
        ref: 'Product',
      },
      productName: String,
      productImage: String,
      quantity: Number,
      price: Number,
      totalPrice: Number,
    },
  ])
  items: any[];

  // =========================
  // PRICING BREAKDOWN (IMPORTANT FIX)
  // =========================

  @Prop({ default: 0 })
  subTotal: number; // cart total (without delivery)

  @Prop({ default: 0 })
  deliveryCharge: number;

  @Prop({ default: 0 })
  totalAmount: number; // subTotal + deliveryCharge

  @Prop({ default: 0 })
  discountAmount: number; // reward + coupon combined

  @Prop({ default: 0 })
  rewardUsed: number;

  @Prop({ default: 0 })
  finalAmount: number; // FINAL PAYABLE AMOUNT

  // =========================
  // PAYMENT
  // =========================
  @Prop({ default: 'COD' })
  paymentMethod: string;

  @Prop({
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
  orderStatus: OrderStatus;

  @Prop({ default: false })
  isPaid: boolean;

  // =========================
  // ORDER META
  // =========================
  @Prop({
    required: true,
    unique: true,
  })
  orderNumber: string;

  @Prop({
    type: Types.ObjectId,
    ref: 'Rider',
    default: null,
  })
  assignedRider: Types.ObjectId | null;

  @Prop({ default: false })
  trackingEnabled: boolean;

  // =========================
  // RETURN / REFUND
  // =========================
  @Prop({ default: 0 })
  returnedAmount: number;

  @Prop({ default: 0 })
  refundAmount: number;

  // =========================
  // REWARD SYSTEM
  // =========================
  @Prop({ default: 0 })
  earnedReward: number;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
