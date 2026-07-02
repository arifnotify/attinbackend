import { IsArray, IsString, IsNumber } from 'class-validator';

class ItemDto {
  @IsString()
  product: string;

  @IsNumber()
  quantity: number;
}

export class AdminEditOrderDto {
  @IsArray()
  items: ItemDto[];
}
