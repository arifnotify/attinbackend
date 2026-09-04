import {
  Injectable,
  BadRequestException,
} from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SmsService {
  constructor(
    private readonly httpService: HttpService,
  ) {}

  async sendOtp(
    phone: string,
    otp: string,
  ) {
    const apiKey = process.env.SMS_BD_API_KEY;
    const senderId = process.env.SMS_BD_SENDER_ID;

    if (!apiKey) {
      throw new BadRequestException(
        'SMS_BD_API_KEY is missing',
      );
    }

    if (!senderId) {
      throw new BadRequestException(
        'SMS_BD_SENDER_ID is missing',
      );
    }

    const formattedPhone = phone.startsWith('880')
      ? phone
      : `880${phone.replace(/^0/, '')}`;

    const message = `Your Sooqxy OTP is ${otp}`;

    try {
      const response = await firstValueFrom(
        this.httpService.get(
          'http://bulksmsbd.net/api/smsapi',
          {
            params: {
              api_key: apiKey,
              type: 'text',
              number: formattedPhone,
              senderid: senderId,
              message,
            },
          },
        ),
      );

      console.log(
        'SMS Response:',
        response.data,
      );

      return response.data;
    } catch (error) {
      console.error(
        'SMS Error:',
        error?.response?.data ||
          error?.message ||
          error,
      );

      throw new BadRequestException(
        'Failed to send OTP',
      );
    }
  }
}
