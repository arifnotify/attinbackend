import { IsNotEmpty, IsNumber } from 'class-validator';

export class AddToCartDto {
  @IsNotEmpty()
  productId: string;

  @IsNumber()
  quantity: number;
}
