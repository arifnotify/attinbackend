import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type BannerDocument = Banner & Document;

@Schema({
  timestamps: true,
})
export class Banner {

  @Prop({
    required: true,
  })
  title: string;

  @Prop({
    required: true,
  })
  image: string;

  // 🔥 Banner কোথায় যাবে
  @Prop({
    enum: ['none', 'product', 'flashSale', 'category'],
    default: 'none',
  })
  linkType: string;

  // 🔥 Product / FlashSale / Category ID
  @Prop({
    type: Types.ObjectId,
    default: null,
  })
  linkId: Types.ObjectId;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const BannerSchema =
  SchemaFactory.createForClass(Banner);
