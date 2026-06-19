import { IsNotEmpty, IsMongoId } from 'class-validator';

export class CreateOrderDto {
  @IsNotEmpty()
  @IsMongoId()
  shippingAddress: string;
}