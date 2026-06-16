import { IsNotEmpty, IsString, MinLength } from 'class-validator';

export class CreateRiderDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  @MinLength(6)
  password: string;
}