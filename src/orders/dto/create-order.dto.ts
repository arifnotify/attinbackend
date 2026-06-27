import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsBoolean,
  IsNumber,
  IsString,
} from 'class-validator';

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
  @IsString()
  couponCode?: string;
}
