import { IsNotEmpty, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @Length(11, 11)
  phone: string;

  @IsNotEmpty()
  @Length(4, 4)
  otp: string;
}
