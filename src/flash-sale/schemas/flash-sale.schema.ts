import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Types } from 'mongoose';

export type FlashSaleDocument = FlashSale & Document;

@Schema({
  timestamps: true,
})
export class FlashSale {
  @Prop({
    type: Types.ObjectId,
    ref: 'Product',
  })
  product: Types.ObjectId;

  @Prop({
    required: true,
  })
  oldPrice: number;

  @Prop({
    required: true,
  })
  flashPrice: number;

  @Prop({
    required: true,
  })
  startTime: Date;

  @Prop({
    required: true,
  })
  endTime: Date;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const FlashSaleSchema = SchemaFactory.createForClass(FlashSale);
