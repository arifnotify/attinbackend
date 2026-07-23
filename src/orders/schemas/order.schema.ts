import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../enums/order-status.enum';
import { PaymentMethod } from 'src/payments/enums/payment-method.enum';

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
      // 🔴 Inline object style (en & bn)
      productName: {
        en: { type: String, default: '' },
        bn: { type: String, default: '' },
      },
      // 🔴 unit field
      unit: { type: String, default: 'pcs' },
      productImage: String,
      quantity: Number,
      price: Number,
      totalPrice: Number,
    },
  ])
  items: {
    product: Types.ObjectId;
    productName: {
      en: string;
      bn: string;
    };
    unit?: string;
    productImage: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }[];

  // =========================
  // PRICING BREAKDOWN
  // =========================
  @Prop({ default: 0 })
  subTotal: number;

  @Prop({ default: 0 })
  deliveryCharge: number;

  @Prop({ default: 0 })
  totalAmount: number;

  @Prop({ default: 0 })
  discountAmount: number;

  @Prop({ default: 0 })
  rewardUsed: number;

  @Prop({ default: 0 })
  finalAmount: number;

  // =========================
  // PAYMENT
  // =========================
  @Prop({
    enum: Object.values(PaymentMethod),
    default: PaymentMethod.COD,
  })
  paymentMethod: PaymentMethod;

  @Prop({
    type: Types.ObjectId,
    ref: 'Payment',
    default: null,
  })
  payment: Types.ObjectId | null;

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
