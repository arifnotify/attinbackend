import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class SmsService {
  constructor(
    private readonly httpService: HttpService,
  ) {}

  // =========================================================
  // SEND OTP THROUGH MiMSMS
  // =========================================================
  async sendOtp(
    phone: string,
    otp: string,
  ) {
    // -------------------------------------------------------
    // ENV VARIABLES
    // -------------------------------------------------------
    const apiKey =
      process.env.MIMSMS_API_KEY;

    const userName =
      process.env.MIMSMS_USERNAME;

    const senderName =
      process.env.MIMSMS_SENDER_NAME;

    // -------------------------------------------------------
    // CHECK API KEY
    // -------------------------------------------------------
    if (!apiKey) {
      throw new BadRequestException(
        'MIMSMS_API_KEY is missing',
      );
    }

    // -------------------------------------------------------
    // CHECK USERNAME
    // -------------------------------------------------------
    if (!userName) {
      throw new BadRequestException(
        'MIMSMS_USERNAME is missing',
      );
    }

    // -------------------------------------------------------
    // CHECK SENDER ID
    // -------------------------------------------------------
    if (!senderName) {
      throw new BadRequestException(
        'MIMSMS_SENDER_NAME is missing',
      );
    }

    // -------------------------------------------------------
    // CLEAN PHONE
    // -------------------------------------------------------
    let formattedPhone =
      String(phone || '')
        .trim()
        .replace(/\s+/g, '');

    // +8801894691666
    if (
      formattedPhone.startsWith('+880')
    ) {
      formattedPhone =
        formattedPhone.substring(1);
    }

    // 01894691666
    if (
      formattedPhone.startsWith('01')
    ) {
      formattedPhone =
        `88${formattedPhone}`;
    }

    // -------------------------------------------------------
    // VALIDATE MiMSMS PHONE FORMAT
    // Expected:
    // 8801XXXXXXXXX
    // -------------------------------------------------------
    if (
      !/^8801[3-9]\d{8}$/.test(
        formattedPhone,
      )
    ) {
      throw new BadRequestException(
        'Invalid Bangladesh mobile number',
      );
    }

    // -------------------------------------------------------
    // VALIDATE OTP
    // -------------------------------------------------------
    const cleanOtp =
      String(otp || '').trim();

    if (
      !/^\d{6}$/.test(cleanOtp)
    ) {
      throw new BadRequestException(
        'OTP must be exactly 6 digits',
      );
    }

    // -------------------------------------------------------
    // SMS MESSAGE
    // -------------------------------------------------------
    const message =
      `MATIGR OTP: ${cleanOtp}. Valid for 5 minutes.`;

    // -------------------------------------------------------
    // DEBUG
    // -------------------------------------------------------
    console.log('');
    console.log(
      '===========================================',
    );

    console.log(
      'MiMSMS REQUEST',
    );

    console.log(
      'Phone:',
      formattedPhone,
    );

    console.log(
      'Sender:',
      senderName,
    );

    console.log(
      'Transaction Type:',
      'T',
    );

    console.log(
      'Message:',
      message,
    );

    console.log(
      '===========================================',
    );

    try {
      // -----------------------------------------------------
      // MiMSMS API v2.1
      // -----------------------------------------------------
      const response =
        await firstValueFrom(
          this.httpService.post(
            'https://api.mimsms.com/api/V2/SMS',

            {
              apiKey:
                apiKey,

              userName:
                userName,

              senderName:
                senderName,

              transactionType:
                'T',

              mobileNumber:
                formattedPhone,

              message:
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

      // -----------------------------------------------------
      // MiMSMS RESPONSE
      // -----------------------------------------------------
      console.log('');
      console.log(
        'MiMSMS Response:',
        response.data,
      );

      // -----------------------------------------------------
      // CHECK SUCCESS
      // -----------------------------------------------------
      if (
        response.data?.statusCode !==
          '200' ||
        response.data?.status !==
          'Success'
      ) {
        const errorMessage =
          response.data
            ?.responseResult ||
          response.data
            ?.error_Data?.[0]
            ?.error ||
          'SMS sending failed';

        console.error(
          'MiMSMS SMS Error:',
          errorMessage,
        );

        throw new BadRequestException(
          errorMessage,
        );
      }

      // -----------------------------------------------------
      // SUCCESS
      // -----------------------------------------------------
      console.log(
        '🟢 MiMSMS SMS SENT SUCCESSFULLY',
      );

      console.log(
        'Transaction ID:',
        response.data?.trxnId,
      );

      console.log(
        'Mobile:',
        formattedPhone,
      );

      // -----------------------------------------------------
      // RETURN
      // -----------------------------------------------------
      return {
        success: true,

        message:
          'SMS sent successfully',

        transactionId:
          response.data?.trxnId,

        response:
          response.data,
      };
    } catch (error) {
      // -----------------------------------------------------
      // ERROR LOG
      // -----------------------------------------------------
      console.error('');
      console.error(
        '===========================================',
      );

      console.error(
        'MiMSMS SMS ERROR',
      );

      console.error(
        error?.response?.data ||
          error?.message ||
          error,
      );

      console.error(
        '===========================================',
      );

      // -----------------------------------------------------
      // IF ALREADY BAD REQUEST
      // -----------------------------------------------------
      if (
        error instanceof
        BadRequestException
      ) {
        throw error;
      }

      // -----------------------------------------------------
      // API ERROR
      // -----------------------------------------------------
      const apiError =
        error?.response?.data;

      const message =
        apiError?.responseResult ||
        apiError?.error_Data?.[0]
          ?.error ||
        apiError?.message ||
        error?.message ||
        'Failed to send OTP SMS';

      throw new BadRequestException(
        message,
      );
    }
  }
}
