import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Types } from 'mongoose';

export type FlashSaleDocument = FlashSale & Document;

@Schema({
  timestamps: true,
})
export class FlashSale {
  @Prop({
    required: true,
  })
  title: string;

  @Prop([
    {
      product: {
        type: Types.ObjectId,
        ref: 'Product',
      },

      oldPrice: Number,

      salePrice: Number,
    },
  ])
  products: any[];

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
