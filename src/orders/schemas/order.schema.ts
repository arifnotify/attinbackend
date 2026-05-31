import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type OrderDocument = Order & Document;

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
    enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'],
    default: 'Pending',
  })
  orderStatus: string;

  @Prop({
    default: false,
  })
  isPaid: boolean;
}

export const OrderSchema =
  SchemaFactory.createForClass(Order);
