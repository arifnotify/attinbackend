import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type LocationDocument = Location & Document;

@Schema({ _id: false })
class TranslatedText {
  @Prop({ required: true, type: String })
  en: string;

  @Prop({ required: true, type: String })
  bn: string;
}

@Schema({
  timestamps: true,
})
export class Location {
  @Prop({
    required: true,
    type: TranslatedText,
  })
  division: TranslatedText;

  @Prop({
    required: true,
    type: TranslatedText,
  })
  district: TranslatedText;

  @Prop({
    default: 0,
  })
  deliveryCharge: number;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const LocationSchema = SchemaFactory.createForClass(Location);