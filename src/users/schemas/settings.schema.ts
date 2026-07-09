import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type SettingDocument =
  Setting & Document;

@Schema({
  timestamps: true,
})
export class Setting {
  @Prop({
    default: 10000,
  })
  premiumAmount: number;

  @Prop({
    default: 50000,
  })
  vipAmount: number;
}

export const SettingSchema = SchemaFactory.createForClass(Setting);
