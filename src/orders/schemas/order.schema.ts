import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../enums/order-status.enum';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {

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
  // PRICING
  // =========================

  @Prop({ required: true })
  totalAmount: number;

  @Prop({ default: 0 })
  discountAmount: number; // reward + coupon combined

  @Prop({ default: 0 })
  rewardUsed: number;


  @Prop({ default: 0 })
  finalAmount: number;

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
  // DELIVERY + RETURN (NEW)
  // =========================

  @Prop({ default: 0 })
  returnedAmount: number;

  @Prop({ default: 0 })
  refundAmount: number;

  // =========================
  // REWARD SYSTEM (NEW)
  // =========================

  @Prop({ default: 0 })
  earnedReward: number;

}

export const OrderSchema = SchemaFactory.createForClass(Order);
