import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  ValidateNested,
} from 'class-validator';

class TranslatedTextDto {
  @IsNotEmpty()
  @IsString()
  en: string;

  @IsNotEmpty()
  @IsString()
  bn: string;
}

export class CreateLocationDto {
  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  division: TranslatedTextDto;

  @IsNotEmpty()
  @ValidateNested()
  @Type(() => TranslatedTextDto)
  district: TranslatedTextDto;

  @IsNumber()
  deliveryCharge: number;

  @IsBoolean()
  isActive: boolean;
}