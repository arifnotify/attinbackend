import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({
  timestamps: true,
})
export class Product {
  @Prop({
    required: true,
  })
  title: string;

  @Prop({
    required: true,
  })
  description: string;

  @Prop({
    required: true,
  })
  price: number;

  @Prop({
    default: 0,
  })
  discountPrice: number;

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

  @Prop()
  category: string;

  @Prop()
  brand: string;

  @Prop()
  location: string;

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
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// SEARCH INDEX
ProductSchema.index({
  title: 'text',
  description: 'text',
});
