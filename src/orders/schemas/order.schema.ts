import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

import { OrderStatus } from '../enums/order-status.enum';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  user: Types.ObjectId;

  @Prop()
  customerPhone: string;

  @Prop({
    required: true,
  })
  shippingAddress: string;

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

  @Prop({
    required: true,
  })
  totalAmount: number;

  @Prop({
    default: 'COD',
  })
  paymentMethod: string;

  @Prop({
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
  })
  orderStatus: OrderStatus;

  @Prop({
    default: false,
  })
  isPaid: boolean;

  // =========================
  // TRACKING
  // =========================

  @Prop({
    default: false,
  })
  trackingEnabled: boolean;

  @Prop({
    type: Number,
    default: null,
  })
  riderLat: number;

  @Prop({
    type: Number,
    default: null,
  })
  riderLng: number;

  @Prop({
    type: Date,
    default: null,
  })
  lastLocationUpdate: Date;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
