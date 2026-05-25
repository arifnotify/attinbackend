import {
  Prop,
  Schema,
  SchemaFactory,
} from '@nestjs/mongoose';

import { Document } from 'mongoose';

export type UserDocument =
  User & Document;

@Schema({
  timestamps: true,
})
export class User {
  @Prop({
    required: true,
    unique: true,
  })
  phone: string;

  @Prop({
    default: true,
  })
  isActive: boolean;

  // BLOCK SYSTEM
  @Prop({
    default: false,
  })
  isBlocked: boolean;

  @Prop({
    default: '',
  })
  blockReason: string;
}

export const UserSchema =
  SchemaFactory.createForClass(User);
