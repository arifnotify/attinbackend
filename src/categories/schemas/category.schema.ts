import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

import { Document, Types } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({
  timestamps: true,
})
export class Category {
  @Prop({
    type: {
      en: {
        type: String,
        required: true,
        trim: true,
      },

      bn: {
        type: String,
        required: true,
        trim: true,
      },
    },

    required: true,
  })
  name: {
    en: string;
    bn: string;
  };

  @Prop()
  image: string;

  // Parent Category
  @Prop({
    type: Types.ObjectId,
    ref: 'Category',
    default: null,
  })
  parentCategory: Types.ObjectId;

  // ⭐ NEW
  @Prop({
    default: 0,
  })
  sortOrder: number;

  @Prop({
    default: true,
  })
  isActive: boolean;
  

  // ⭐ Home Screen Control
  @Prop({
    default:false,
  })
  showOnHome:boolean;

}

export const CategorySchema =
  SchemaFactory.createForClass(Category);

// English name unique
CategorySchema.index(
  { 'name.en': 1 },
  { unique: true },
);

// Bangla name unique
CategorySchema.index(
  { 'name.bn': 1 },
  { unique: true },
);

// ⭐ NEW
CategorySchema.index({
  sortOrder: 1,
});
