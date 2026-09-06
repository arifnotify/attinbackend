import {
  IsNotEmpty,
  IsString,
  Length,
  Matches,
} from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty()
  @IsString()
  @Length(11, 11, {
    message: 'Phone number must be exactly 11 digits',
  })
  @Matches(/^01[3-9]\d{8}$/, {
    message: 'Invalid Bangladesh phone number',
  })
  phone: string;
}
