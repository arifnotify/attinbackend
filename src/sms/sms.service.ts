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

  // =========================
  // SEND OTP
  // MiMSMS API v2.1
  // =========================

  async sendOtp(
    phone: string,
    otp: string,
  ) {
    // =========================
    // ENV VARIABLES
    // =========================

    const apiKey =
      process.env.MIMSMS_API_KEY;

    const userName =
      process.env.MIMSMS_USERNAME;

    const senderName =
      process.env.MIMSMS_SENDER_NAME;

    // =========================
    // CHECK CONFIG
    // =========================

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

    // =========================
    // FORMAT PHONE NUMBER
    // =========================

    let formattedPhone =
      phone.trim();

    // Remove +
    if (
      formattedPhone.startsWith('+')
    ) {
      formattedPhone =
        formattedPhone.substring(1);
    }

    // 017XXXXXXXX -> 88017XXXXXXXX
    if (
      formattedPhone.startsWith('01')
    ) {
      formattedPhone =
        `88${formattedPhone}`;
    }

    // =========================
    // OTP MESSAGE
    // =========================

    const message =
      `Sooqxy OTP: ${otp}. Valid for 5 minutes.`;

    // =========================
    // MiMSMS API REQUEST
    // =========================

    try {
      const response =
        await firstValueFrom(
          this.httpService.post(
            'https://api.mimsms.com/api/V2/SMS',
            {
              apiKey: apiKey,
              userName: userName,
              senderName: senderName,
              transactionType: 'T',
              mobileNumber:
                formattedPhone,
              message: message,
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

      // =========================
      // CHECK RESPONSE
      // =========================

      if (
        response.data?.statusCode !==
          '200' ||
        response.data?.status !==
          'Success'
      ) {
        throw new Error(
          response.data?.responseResult ||
            'SMS sending failed',
        );
      }

      // =========================
      // SUCCESS
      // =========================

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
          error?.response?.data?.message ||
          error?.message ||
          'Failed to send OTP',
      );
    }
  }
}
