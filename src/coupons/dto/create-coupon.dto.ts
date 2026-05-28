import { IsDateString, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateCouponDto {
  @IsNotEmpty()
  @IsString()
  code: string;

  @IsNotEmpty()
  @IsString()
  type: string;

  @IsNotEmpty()
  @IsNumber()
  discount: number;

  @IsNumber()
  minimumOrderAmount: number;

  @IsDateString()
  expireDate: Date;
}
