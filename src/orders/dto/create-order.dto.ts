import {
  IsNotEmpty,
  IsMongoId,
  IsOptional,
  IsBoolean,
  IsNumber,
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

  // NEW
  @IsOptional()
  @IsNumber()
  deliveryCharge?: number;
}
