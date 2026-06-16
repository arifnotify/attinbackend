import { IsNotEmpty, IsString } from 'class-validator';

export class LoginRiderDto {
  @IsNotEmpty()
  @IsString()
  phone: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}
