import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class ApplyCouponDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsNumber()
  orderAmount: number;
}
