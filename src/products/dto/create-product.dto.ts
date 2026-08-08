import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsMongoId,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

class TranslationDto {
  @IsNotEmpty()
  @IsString()
  en: string;

  @IsNotEmpty()
  @IsString()
  bn: string;
}

export class CreateProductDto {
  @ValidateNested()
  @Type(() => TranslationDto)
  title: TranslationDto;

  @ValidateNested()
  @Type(() => TranslationDto)
  description: TranslationDto;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  discountPrice: number;

  @IsOptional()
  @IsString()
  youtubeVideoUrl?: string;

  @IsOptional()
  @IsNumber()
  flashSalePrice: number;

  @IsOptional()
  @IsNumber()
  stock: number;

  @IsOptional()
  @IsArray()
  images: string[];

  @IsNotEmpty()
  @IsMongoId()
  category: string;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  brand: string;

  @IsOptional()
  @IsMongoId()
  country?: string;

  @IsArray()
  @IsMongoId({
    each: true,
  })
  locations: string[];

  @IsOptional()
  @IsBoolean()
  isFlashSale: boolean;

 // ⭐ নতুন যোগ করুন
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsString()
  productType: string;

  @IsOptional()
  @IsBoolean()
  isFeatured?: boolean;
  
  @IsOptional()
  @IsNumber()
  homePriority?: number;

  @IsOptional()
  @IsDateString()
  expiryDate: Date;
}
