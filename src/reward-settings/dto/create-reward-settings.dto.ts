import { IsBoolean, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class CreateRewardSettingsDto {

  // ===========================
  // CUSTOMER LEVEL CONTROL
  // ===========================

  // কত টাকা খরচ করলে Premium হবে
  @IsNumber()
  @Min(0)
  premiumAmount: number;


  // কত টাকা খরচ করলে VIP হবে
  @IsNumber()
  @Min(0)
  vipAmount: number;



  // ===========================
  // REWARD PERCENTAGE
  // ===========================

  @IsNumber()
  @Min(0)
  @Max(100)
  regularPercentage: number;



  @IsNumber()
  @Min(0)
  @Max(100)
  premiumPercentage: number;



  @IsNumber()
  @Min(0)
  @Max(100)
  vipPercentage: number;



  // ===========================
  // REWARD RULE
  // ===========================

  @IsNumber()
  @Min(1)
  perAmount: number;



  @IsNumber()
  @Min(0)
  minimumRedeem: number;



  @IsNumber()
  @Min(0)
  maximumRedeem: number;



  @IsNumber()
  @Min(1)
  expireDays: number;



  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

}