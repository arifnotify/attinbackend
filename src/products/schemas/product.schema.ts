import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({
  timestamps: true,
})
export class Product {
  static map(arg0: (product: any) => any) {
    throw new Error('Method not implemented.');
  }

  @Prop({
    type: {
      en: { type: String, required: true },
      bn: { type: String, required: true },
    },
    required: true,
  })
  title: {
    en: string;
    bn: string;
  };

  @Prop({
    type: {
      en: { type: String, required: true },
      bn: { type: String, required: true },
    },
    required: true,
  })
  description: {
    en: string;
    bn: string;
  };

  @Prop()
  youtubeVideoUrl: string;

  @Prop({
    required: true,
  })
  price: number;

  @Prop({
    default: 0,
  })
  discountPrice: number;

  @Prop({
    type: Types.ObjectId,
    ref: 'Country',
    required: false,
  })
  country?: Types.ObjectId;

  @Prop({
    default: 0,
  })
  flashSalePrice: number;

  @Prop({
    default: 0,
  })
  stock: number;

  @Prop({
    default: [],
  })
  images: string[];

  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Types.ObjectId;

  @Prop()
  brand: string;

@Prop({
  type: [
    {
      type: Types.ObjectId,
      ref: 'Location',
    },
  ],
  default: [],
})
locations: Types.ObjectId[];

  @Prop({
    default: 'pcs',
  })
  unit: string;

  @Prop({
    default: false,
  })
  isFlashSale: boolean;

  @Prop({
    default: true,
  })
  isActive: boolean;

  @Prop({
    default: 0,
  })
  totalSales: number;

  @Prop({
    default: 'regular',
  })
  productType: string;

  @Prop({
  default: false,
  })
  isFeatured: boolean;
  
  @Prop({
    default: 0,
  })
  homePriority: number;

  @Prop()
  expiryDate: Date;

  createdAt?: Date;
  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Search Index
ProductSchema.index({
  'title.en': 'text',
  'title.bn': 'text',
  'description.en': 'text',
  'description.bn': 'text',
});
