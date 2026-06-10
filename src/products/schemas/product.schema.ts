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

  // ✅ NEW
  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    required: true,
  })
  category: Types.ObjectId;

  @Prop()
  brand: string;

  @Prop()
  location: string;

  // NEW FIELD
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
  productType: string; // fresh | regular

  @Prop()
  expiryDate: Date;

  createdAt?: Date;

  updatedAt?: Date;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// SEARCH INDEX
ProductSchema.index({
  title: 'text',
  description: 'text',
});
