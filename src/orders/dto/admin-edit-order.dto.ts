import {
  IsArray,
  IsString,
  IsNumber,
  IsOptional,
  ValidateNested,
  IsObject,
  IsNotEmpty,
} from 'class-validator';
import { Type } from 'class-transformer';

// Language Title DTO
class MultiLanguageTextDto {
  @IsString()
  @IsNotEmpty()
  en: string;

  @IsString()
  @IsNotEmpty()
  bn: string;
}

// Item DTO
class ItemDto {
  @IsString()
  product: string;

  @IsNumber()
  quantity: number;

  @IsNumber()
  price: number;

  // en & bn validation
  @IsOptional()
  @IsObject()
  @ValidateNested()
  @Type(() => MultiLanguageTextDto)
  productName?: MultiLanguageTextDto;

  // unit validation
  @IsOptional()
  @IsString()
  unit?: string;

  @IsOptional()
  @IsString()
  productImage?: string;
}

// Main DTO
export class AdminEditOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}
