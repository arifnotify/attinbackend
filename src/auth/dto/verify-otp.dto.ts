import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class VerifyOtpDto {
  @IsNotEmpty()
  @IsString()
  @Length(11, 11, {
    message: 'Phone number must be exactly 11 digits',
  })
  @Matches(/^01[3-9]\d{8}$/, {
    message: 'Invalid Bangladesh phone number',
  })
  phone: string;

  @IsNotEmpty()
  @IsString()
  @Length(6, 6, {
    message: 'OTP must be exactly 6 digits',
  })
  @Matches(/^\d{6}$/, {
    message: 'OTP must contain exactly 6 digits',
  })
  otp: string;
}
