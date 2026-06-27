import { IsBoolean, IsNumber } from 'class-validator';

export class CreateRewardSettingsDto {
  @IsNumber()
  regularPercentage: number;

  @IsNumber()
  premiumPercentage: number;

  @IsNumber()
  vipPercentage: number;

  @IsNumber()
  perAmount: number;

  @IsNumber()
  minimumRedeem: number;

  @IsNumber()
  maximumRedeem: number;

  @IsNumber()
  expireDays: number;

  @IsBoolean()
  isActive: boolean;
}
