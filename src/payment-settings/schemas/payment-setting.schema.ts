import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type PaymentSettingDocument = PaymentSetting & Document;

@Schema({
  timestamps: true,
})
export class PaymentSetting {
  @Prop({
    default: true,
  })
  codEnabled: boolean;

  @Prop({
    default: true,
  })
  sslcommerzEnabled: boolean;

}

export const PaymentSettingSchema =
  SchemaFactory.createForClass(PaymentSetting);
