import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsNotEmpty,
  IsString,
} from 'class-validator';

export class CreateFlashSaleDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsArray()
  products: {
    product: string;
    salePrice: number;
  }[];

  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;

  @IsBoolean()
  isActive: boolean;
}
