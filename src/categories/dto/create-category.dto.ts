import { Type } from 'class-transformer';

import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsNumber,
} from 'class-validator';

// =========================
// CATEGORY NAME DTO
// =========================
class CategoryNameDto {
  @IsNotEmpty()
  @IsString()
  en: string;

  @IsNotEmpty()
  @IsString()
  bn: string;
}

// =========================
// CREATE CATEGORY DTO
// =========================
export class CreateCategoryDto {
  @ValidateNested()
  @Type(() => CategoryNameDto)
  name: CategoryNameDto;

  @IsOptional()
  @IsString()
  image: string;

  @IsOptional()
  @IsString()
  parentCategory: string;

  @IsOptional()
  @IsBoolean()
  isActive: boolean;

  // ⭐ NEW
  @IsOptional()
  @IsNumber()
  sortOrder: number;

  // ⭐ NEW
 @IsOptional()
 @IsBoolean()
 showOnHome:boolean;
}
