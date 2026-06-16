import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { OrderStatus } from '../enums/order-status.enum';

export type OrderDocument = Order & Document;

@Schema({ timestamps: true })
export class Order {
  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  user: Types.ObjectId;

  @Prop()
  customerPhone: string;

  @Prop({ required: true })
  shippingAddress: string;

  @Prop([
    {
      product: { type: Types.ObjectId, ref: 'Product' },
      productName: String,
      productImage: String,
      quantity: Number,
      price: Number,
      totalPrice: Number,
    },
  ])
  items: any[];

  @Prop({ required: true })
  totalAmount: number;

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
  // ORDER NUMBER (8 DIGIT)
  // =========================
  @Prop({ required: true, unique: true })
  orderNumber: string;

  // =========================
  // RIDER ASSIGN
  // =========================
  @Prop({ type: Types.ObjectId, ref: 'Rider', default: null })
  assignedRider: Types.ObjectId | null;

  // =========================
  // TRACKING
  // =========================
  @Prop({ default: false })
  trackingEnabled: boolean;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
