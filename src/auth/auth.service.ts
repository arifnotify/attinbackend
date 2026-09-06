import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { SmsService } from '../sms/sms.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly redisService: RedisService,
    private readonly jwtService: JwtService,
    private readonly smsService: SmsService,
  ) {}

  // =========================================================
  // NORMALIZE BANGLADESH PHONE NUMBER
  // =========================================================
  private normalizePhone(phone: string): string {
    let value = String(phone || '')
      .trim()
      .replace(/\s+/g, '');

    // +8801894691666
    if (value.startsWith('+880')) {
      value = `0${value.substring(4)}`;
    }

    // 8801894691666
    else if (value.startsWith('880')) {
      value = `0${value.substring(3)}`;
    }

    // Must be 01XXXXXXXXX
    if (!/^01[3-9]\d{8}$/.test(value)) {
      throw new BadRequestException(
        'Invalid Bangladesh mobile number',
      );
    }

    return value;
  }

  // =========================================================
  // SEND OTP
  // POST /auth/send-otp
  // =========================================================
  async sendOtp(phone: string) {
    const formattedPhone =
      this.normalizePhone(phone);

    // -------------------------------------------------------
    // CHECK USER
    // -------------------------------------------------------
    const user =
      await this.usersService.findByPhone(
        formattedPhone,
      );

    // -------------------------------------------------------
    // CHECK BLOCKED USER
    // -------------------------------------------------------
    if (user?.isBlocked) {
      throw new UnauthorizedException(
        `This number is blocked. Reason: ${
          user.blockReason ||
          'No reason provided'
        }`,
      );
    }

    // -------------------------------------------------------
    // GENERATE 6 DIGIT OTP
    // -------------------------------------------------------
    const otp = Math.floor(
      100000 + Math.random() * 900000,
    ).toString();

    // -------------------------------------------------------
    // REDIS KEY
    // -------------------------------------------------------
    const otpKey =
      `otp:${formattedPhone}`;

    // -------------------------------------------------------
    // DEBUG LOG
    // -------------------------------------------------------
    console.log('');
    console.log(
      '===========================================',
    );
    console.log(
      'GENERATED OTP',
    );
    console.log(
      'Phone:',
      formattedPhone,
    );
    console.log(
      'OTP Key:',
      otpKey,
    );
    console.log(
      'OTP:',
      otp,
    );
    console.log(
      '===========================================',
    );

    // -------------------------------------------------------
    // SEND SMS
    // -------------------------------------------------------
    await this.smsService.sendOtp(
      formattedPhone,
      otp,
    );

    // -------------------------------------------------------
    // SAVE OTP IN REDIS
    // 300 seconds = 5 minutes
    // -------------------------------------------------------
    await this.redisService.set(
      otpKey,
      otp,
      300,
    );

    // -------------------------------------------------------
    // SUCCESS LOG
    // -------------------------------------------------------
    console.log(
      '================ OTP SENT ================',
    );

    console.log(
      'Phone:',
      formattedPhone,
    );

    console.log(
      'OTP Key:',
      otpKey,
    );

    console.log(
      'OTP saved for 300 seconds',
    );

    console.log(
      '===========================================',
    );

    return {
      success: true,
      message: 'OTP sent successfully',
    };
  }

  // =========================================================
  // VERIFY OTP
  // POST /auth/verify-otp
  // =========================================================
  async verifyOtp(
    phone: string,
    otp: string,
  ) {
    const formattedPhone =
      this.normalizePhone(phone);

    const enteredOtp =
      String(otp || '').trim();

    // -------------------------------------------------------
    // VALIDATE OTP
    // -------------------------------------------------------
    if (!enteredOtp) {
      throw new BadRequestException(
        'OTP is required',
      );
    }

    if (!/^\d{6}$/.test(enteredOtp)) {
      throw new BadRequestException(
        'OTP must be exactly 6 digits',
      );
    }

    // -------------------------------------------------------
    // REDIS KEY
    // -------------------------------------------------------
    const otpKey =
      `otp:${formattedPhone}`;

    // -------------------------------------------------------
    // GET OTP FROM REDIS
    // -------------------------------------------------------
    const storedOtp =
      await this.redisService.get(
        otpKey,
      );

    // -------------------------------------------------------
    // DEBUG LOG
    // -------------------------------------------------------
    console.log('');
    console.log(
      '=============== OTP VERIFY ===============',
    );

    console.log(
      'Phone:',
      formattedPhone,
    );

    console.log(
      'OTP Key:',
      otpKey,
    );

    console.log(
      'Entered OTP:',
      enteredOtp,
    );

    console.log(
      'Stored OTP:',
      storedOtp,
    );

    console.log(
      'OTP Match:',
      String(storedOtp).trim() ===
        enteredOtp,
    );

    console.log(
      '============================================',
    );

    // -------------------------------------------------------
    // OTP EXPIRED / NOT FOUND
    // -------------------------------------------------------
    if (!storedOtp) {
      throw new UnauthorizedException(
        'OTP expired or not found. Please request a new OTP.',
      );
    }

    // -------------------------------------------------------
    // OTP DOES NOT MATCH
    // -------------------------------------------------------
    if (
      String(storedOtp).trim() !==
      enteredOtp
    ) {
      throw new UnauthorizedException(
        'Invalid OTP',
      );
    }

    // -------------------------------------------------------
    // FIND USER
    // -------------------------------------------------------
    let user =
      await this.usersService.findByPhone(
        formattedPhone,
      );

    // -------------------------------------------------------
    // CHECK BLOCKED USER
    // -------------------------------------------------------
    if (user?.isBlocked) {
      throw new UnauthorizedException(
        `This number is blocked. Reason: ${
          user.blockReason ||
          'No reason provided'
        }`,
      );
    }

    // -------------------------------------------------------
    // CREATE USER IF NOT EXISTS
    // -------------------------------------------------------
    if (!user) {
      user =
        await this.usersService.create(
          formattedPhone,
        );
    }

    // -------------------------------------------------------
    // DELETE OTP AFTER SUCCESSFUL VERIFICATION
    // -------------------------------------------------------
    await this.redisService.del(
      otpKey,
    );

    // -------------------------------------------------------
    // JWT PAYLOAD
    // -------------------------------------------------------
    const payload = {
      userId: user._id.toString(),
      phone: user.phone,
      role: 'user',
    };

    // -------------------------------------------------------
    // GENERATE JWT TOKEN
    // -------------------------------------------------------
    const accessToken =
      this.jwtService.sign(payload);

    // -------------------------------------------------------
    // SUCCESS LOG
    // -------------------------------------------------------
    console.log('');
    console.log(
      '===========================================',
    );

    console.log(
      'OTP VERIFIED SUCCESSFULLY',
    );

    console.log(
      'Phone:',
      formattedPhone,
    );

    console.log(
      'User ID:',
      user._id.toString(),
    );

    console.log(
      '===========================================',
    );

    // -------------------------------------------------------
    // RESPONSE
    // -------------------------------------------------------
    return {
      success: true,
      message:
        'User login successful',

      access_token:
        accessToken,

      user,
    };
  }

  // =========================================================
  // GET PROFILE
  // GET /auth/profile
  // =========================================================
  async getProfile(
    userId: string,
  ) {
    const user =
      await this.usersService.findById(
        userId,
      );

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    return user;
  }
}
