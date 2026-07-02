import { IsArray, IsString, IsNumber, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class ItemDto {
  @IsString()
  product: string;

  @IsNumber()
  quantity: number;
}

export class AdminEditOrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ItemDto)
  items: ItemDto[];
}