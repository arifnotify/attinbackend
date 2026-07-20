import { IsString, IsNumber, IsEnum } from 'class-validator';

import { PaymentMethod } from '../enums/payment-method.enum';

export class CreatePaymentDto {

 @IsString()
 orderId:string;

 @IsNumber()
 amount:number;

 @IsEnum(PaymentMethod)
 paymentMethod:
 PaymentMethod;
}
