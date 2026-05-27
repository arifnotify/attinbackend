import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateOrderStatusDto {
  @IsNotEmpty()
  @IsString()
  orderStatus: string;
}
