import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({
    required: true,
    unique: true,
  })
  phone: string;

  // Temporary OTP
  @Prop()
  otp?: string;

  // OTP expire time
  @Prop()
  otpExpiresAt?: Date;

  // User verified or not
  @Prop({ default: false })
  isVerified: boolean;
}

export const UserSchema = SchemaFactory.createForClass(User);