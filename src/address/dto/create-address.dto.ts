import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateAddressDto {
  @IsNotEmpty()
  @IsString()
  fullName: string;

  @IsNotEmpty()
  @IsString()
  phoneNumber: string;

  // গ্রামের নাম বা এলাকার নাম
  @IsNotEmpty()
  @IsString()
  areaOrVillage: string;

  // মসজিদের পাশে, বাজারের সামনে ইত্যাদি
  @IsNotEmpty()
  @IsString()
  landmark: string;

  // Optional অতিরিক্ত নির্দেশনা
  @IsOptional()
  @IsString()
  directionNote?: string;

  // Pin Drop Location
  @IsNotEmpty()
  @IsNumber()
  latitude: number;

  @IsNotEmpty()
  @IsNumber()
  longitude: number;

  @IsOptional()
  @IsString()
  label?: string; // Home, Office, Other

  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}