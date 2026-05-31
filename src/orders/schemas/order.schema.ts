import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

export enum OrderStatus {
  PENDING = 'Pending',
  PROCESSING = 'Processing',
  SHIPPED = 'Shipped',
  DELIVERED = 'Delivered',
  CANCELLED = 'Cancelled',
}

@Schema({
  timestamps: true,
})
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
  items: {
    product: Types.ObjectId;
    productName: string;
    productImage: string;
    quantity: number;
    price: number;
    totalPrice: number;
  }[];

  @Prop({
    required: true,
  })
  totalAmount: number;

  @Prop({
    default: 'COD',
  })
  paymentMethod: string;

  @Prop({
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  orderStatus: OrderStatus;

  @Prop({
    default: false,
  })
  isPaid: boolean;
}

export const OrderSchema =
  SchemaFactory.createForClass(Order);
