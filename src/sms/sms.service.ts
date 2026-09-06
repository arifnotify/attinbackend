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
    const apiKey =
      process.env.MIMSMS_API_KEY;

    const userName =
      process.env.MIMSMS_USERNAME;

    const senderName =
      process.env.MIMSMS_SENDER_NAME;

    if (!apiKey) {
      throw new BadRequestException(
        'MIMSMS_API_KEY is missing',
      );
    }

    if (!userName) {
      throw new BadRequestException(
        'MIMSMS_USERNAME is missing',
      );
    }

    if (!senderName) {
      throw new BadRequestException(
        'MIMSMS_SENDER_NAME is missing',
      );
    }

    // =========================================================
    // Convert Bangladesh 11 digit number to MiMSMS format
    //
    // 01894691666
    //       ↓
    // 8801894691666
    // =========================================================

    let formattedPhone =
      String(phone)
        .trim()
        .replace(/\s+/g, '');

    if (formattedPhone.startsWith('+')) {
      formattedPhone =
        formattedPhone.substring(1);
    }

    if (formattedPhone.startsWith('01')) {
      formattedPhone =
        `88${formattedPhone}`;
    }

    // Final validation
    if (!/^8801[3-9]\d{8}$/.test(
      formattedPhone,
    )) {
      throw new BadRequestException(
        'Invalid Bangladesh mobile number',
      );
    }

    const message =
      `Sooqxy OTP: ${otp}. Valid for 5 minutes.`;

    try {
      const response =
        await firstValueFrom(
          this.httpService.post(
            'https://api.mimsms.com/api/V2/SMS',
            {
              apiKey,
              userName,
              senderName,
              transactionType: 'T',
              mobileNumber:
                formattedPhone,
              message,
            },
            {
              headers: {
                'Content-Type':
                  'application/json',
              },
              timeout: 15000,
            },
          ),
        );

      console.log(
        'MiMSMS Response:',
        response.data,
      );

      // =======================================================
      // Check MiMSMS response
      // =======================================================
      if (
        response.data?.statusCode !==
          '200' ||
        response.data?.status !==
          'Success'
      ) {
        throw new Error(
          response.data
            ?.responseResult ||
            'SMS sending failed',
        );
      }

      return {
        success: true,
        message:
          'OTP sent successfully',
        transactionId:
          response.data?.trxnId,
        data: response.data,
      };
    } catch (error) {
      console.error(
        'MiMSMS SMS Error:',
        error?.response?.data ||
          error?.message ||
          error,
      );

      throw new BadRequestException(
        error?.response?.data
          ?.responseResult ||
          error?.response?.data
            ?.message ||
          error?.message ||
          'Failed to send OTP',
      );
    }
  }
}
