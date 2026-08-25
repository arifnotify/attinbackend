import { Injectable, BadRequestException } from '@nestjs/common';
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
    const apiKey =
      process.env.SMS_BD_API_KEY;

    const senderId =
      process.env.SMS_BD_SENDER_ID;

    console.log(
      'SMS_BD_API_KEY =',
      apiKey,
    );

    console.log(
      'SMS_BD_SENDER_ID =',
      senderId,
    );

    const message =
      `Your Sooqxy OTP Code is ${otp}`;

    try {
      const params: any = {
        api_key: apiKey,
        msg: message,
        to: phone,
      };

      // sender_id শুধু থাকলে পাঠাবে
      if (
        senderId &&
        senderId.trim() !== ''
      ) {
        params.sender_id =
          senderId;
      }

      const response =
        await firstValueFrom(
          this.httpService.post(
            'https://api.sms.net.bd/sendsms',
            null,
            {
              params,
            },
          ),
        );

      const data =
        response.data;

      console.log(
        'SMS Response:',
        data,
      );

      if (data.error !== 0) {
        throw new BadRequestException(
          data.msg ||
            'SMS sending failed',
        );
      }

      return data;
    } catch (error) {
      console.error(
        'SMS Error:',
        error?.response?.data ||
          error,
      );

      throw new BadRequestException(
        'Failed to send OTP',
      );
    }
  }
}