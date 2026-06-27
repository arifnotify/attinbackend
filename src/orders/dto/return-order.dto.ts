import { IsNumber, Min } from 'class-validator';

export class ReturnOrderDto {
  @IsNumber()
  @Min(1)
  returnAmount: number;
}