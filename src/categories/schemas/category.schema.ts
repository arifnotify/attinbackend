import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({
  timestamps: true,
})
export class Category {
  @Prop({
    required: true,
    unique: true,
  })
  name: string;

  @Prop()
  image: string;

  // Parent Category
  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    default: null,
  })
  parentCategory: Types.ObjectId;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
