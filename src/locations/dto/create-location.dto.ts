import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CreateLocationDto {
  @IsNotEmpty()
  @IsString()
  division: string;

  @IsNotEmpty()
  @IsString()
  district: string;

  @IsNumber()
  deliveryCharge: number;

  @IsBoolean()
  isActive: boolean;
}
