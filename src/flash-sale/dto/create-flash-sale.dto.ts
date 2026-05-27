import { IsDateString, IsNotEmpty, IsNumber } from 'class-validator';

export class CreateFlashSaleDto {
  @IsNotEmpty()
  product: string;

  @IsNumber()
  flashPrice: number;

  @IsDateString()
  startTime: Date;

  @IsDateString()
  endTime: Date;
}
