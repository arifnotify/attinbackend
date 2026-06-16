import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type RiderDocument = Rider & Document;

@Schema({ timestamps: true })
export class Rider {
  @Prop({
    required: true,
  })
  name: string;

  @Prop({
    required: true,
    unique: true,
  })
  phone: string;

  @Prop({
    required: true,
  })
  password: string;

  @Prop({
    default: 'rider',
  })
  role: string;

  @Prop({
    default: true,
  })
  isActive: boolean;
}

export const RiderSchema = SchemaFactory.createForClass(Rider);
