import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  discountPrice: number;

  @IsOptional()
  @IsNumber()
  flashDiscountPrice: number;

  @IsOptional()
  @IsNumber()
  stock: number;

  @IsOptional()
  @IsArray()
  images: string[];

  @IsOptional()
  @IsString()
  category: string;

  @IsNotEmpty()
  @IsString()
  unit: string;

  @IsOptional()
  @IsString()
  brand: string;

  @IsOptional()
  @IsString()
  location: string;

  @IsOptional()
  @IsBoolean()
  isFlashSale: boolean;

  // NEW
  @IsOptional()
  @IsString()
  productType: string; // fresh | regular

  // NEW
  @IsOptional()
  @IsDateString()
  expiryDate: Date;
}