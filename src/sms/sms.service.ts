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
    const apiToken =
      process.env.RHSMS_API_TOKEN;

    if (!apiToken) {
      throw new BadRequestException(
        'RHSMS_API_TOKEN is missing',
      );
    }

    // Convert 8801XXXXXXXXX -> 01XXXXXXXXX
    const formattedPhone = phone.startsWith('880')
      ? `0${phone.substring(3)}`
      : phone;

    const message = `Your Sooqxy OTP Code is ${otp}`;

    try {
      const response = await firstValueFrom(
        this.httpService.post(
          'https://rhsmsbd.top/api/v1/send',
          new URLSearchParams({
            api_token: apiToken,
            phone: formattedPhone,
            message,
          }).toString(),
          {
            headers: {
              'Content-Type':
                'application/x-www-form-urlencoded',
            },
          },
        ),
      );

      console.log(
        'SMS Response:',
        response.data,
      );

      if (
        response.data?.status !==
        'success'
      ) {
        throw new Error(
          response.data?.message ||
            'SMS sending failed',
        );
      }

      return response.data;
    } catch (error) {
      console.error(
        'SMS Error:',
        error?.response?.data ||
          error?.message ||
          error,
      );

      throw new BadRequestException(
        error?.response?.data?.message ||
          'Failed to send OTP',
      );
    }
  }
}
