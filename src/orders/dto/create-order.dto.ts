import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsArray,
  IsNumber,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

class OrderItemDto {
  @IsNotEmpty()
  @IsString()
  product: string;

  @IsOptional()
  @IsString()
  productName?: string;

  @IsNotEmpty()
  @IsNumber()
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  price: number;

  @IsOptional()
  @IsNumber()
  totalPrice?: number;
}

export class CreateOrderDto {

  // 🏠 SHIPPING ADDRESS (required)
  @IsNotEmpty()
  @IsString()
  shippingAddress: string;

  // 💳 PAYMENT METHOD (optional default COD backend এ)
  @IsOptional()
  @IsString()
  paymentMethod?: string;

  // 🛒 ITEMS (optional because cart system is used)
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items?: OrderItemDto[];

  // 💰 TOTAL AMOUNT (optional, backend can calculate from cart)
  @IsOptional()
  @IsNumber()
  totalAmount?: number;
}
