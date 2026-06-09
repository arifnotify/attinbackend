import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class UpdateAddressDto {
  @IsOptional()
  @IsString()
  fullName?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  // গ্রামের নাম / এলাকার নাম
  @IsOptional()
  @IsString()
  areaOrVillage?: string;

  // মসজিদ, বাজার, স্কুল ইত্যাদি
  @IsOptional()
  @IsString()
  landmark?: string;

  // অতিরিক্ত নির্দেশনা
  @IsOptional()
  @IsString()
  directionNote?: string;

  // GPS Location
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @IsOptional()
  @IsNumber()
  longitude?: number;

  // Home / Office / Other
  @IsOptional()
  @IsString()
  label?: string;

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}