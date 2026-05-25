import {
  IsNotEmpty,
  Length,
} from 'class-validator';

export class SendOtpDto {
  @IsNotEmpty()

  @Length(11, 11)
  phone: string;
}
