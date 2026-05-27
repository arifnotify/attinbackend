import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Types } from 'mongoose';

export type CartDocument = Cart & Document;

@Schema({
  timestamps: true,
})
export class Cart {
  @Prop({
    type: Types.ObjectId,
    ref: 'User',
  })
  user: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
  })
  product: Types.ObjectId;

  @Prop({
    default: 1,
  })
  quantity: number;

  @Prop({
    required: true,
  })
  price: number;

  @Prop({
    required: true,
  })
  totalPrice: number;
}

export const CartSchema = SchemaFactory.createForClass(Cart);
