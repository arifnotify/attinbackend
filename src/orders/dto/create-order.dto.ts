import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsEnum,
} from 'class-validator';

import { PaymentMethod } from '../../payments/enums/payment-method.enum';

export class CreateOrderDto {

  @IsNotEmpty()
  @IsMongoId()
  shippingAddress: string;

  @IsOptional()
  @IsBoolean()
  useReward?: boolean;

  @IsOptional()
  @IsNumber()
  rewardAmount?: number;

  @IsOptional()
  @IsNumber()
  deliveryCharge?: number;

  // PAYMENT METHOD
  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}