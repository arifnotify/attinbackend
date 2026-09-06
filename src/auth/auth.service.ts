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

  // ============================================
  // Normalize Bangladesh phone number
  // ============================================
  private normalizePhone(
    phone: string,
  ): string {
    let value = String(phone || '')
      .trim()
      .replace(/\s+/g, '');

    // +8801894691666
    if (value.startsWith('+880')) {
      value =
        `0${value.substring(4)}`;
    }

    // 8801894691666
    else if (
      value.startsWith('880')
    ) {
      value =
        `0${value.substring(3)}`;
    }

    // Must be 01XXXXXXXXX
    if (
      !/^01[3-9]\d{8}$/.test(value)
    ) {
      throw new BadRequestException(
        'Invalid Bangladesh phone number',
      );
    }

    return value;
  }

  // ============================================
  // SEND OTP
  // ============================================
  async sendOtp(
    phone: string,
  ) {
    const formattedPhone =
      this.normalizePhone(phone);

    // Check existing user
    const user =
      await this.usersService.findByPhone(
        formattedPhone,
      );

    // Blocked user cannot request OTP
    if (user?.isBlocked) {
      throw new UnauthorizedException(
        `This number is blocked. Reason: ${
          user.blockReason ||
          'No reason provided'
        }`,
      );
    }

    // Generate 6 digit OTP
    const otp =
      Math.floor(
        100000 +
          Math.random() * 900000,
      ).toString();

    // Redis key
    const otpKey =
      `otp:${formattedPhone}`;

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

    // Send SMS first
    await this.smsService.sendOtp(
      formattedPhone,
      otp,
    );

    // Save OTP in Redis for 5 minutes
    await this.redisService.set(
      otpKey,
      otp,
      300,
    );

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
      message:
        'OTP sent successfully',
    };
  }

  // ============================================
  // VERIFY OTP
  // ============================================
  async verifyOtp(
    phone: string,
    otp: string,
  ) {
    const formattedPhone =
      this.normalizePhone(phone);

    const enteredOtp =
      String(otp || '').trim();

    // Check OTP
    if (!enteredOtp) {
      throw new BadRequestException(
        'OTP is required',
      );
    }

    // OTP must be exactly 6 digits
    if (
      !/^\d{6}$/.test(
        enteredOtp,
      )
    ) {
      throw new BadRequestException(
        'OTP must be exactly 6 digits',
      );
    }

    // Redis key
    const otpKey =
      `otp:${formattedPhone}`;

    // Get OTP from Redis
    const storedOtp =
      await this.redisService.get(
        otpKey,
      );

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
      'User OTP:',
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

    // OTP not found / expired
    if (!storedOtp) {
      throw new UnauthorizedException(
        'OTP expired or not found. Please request a new OTP.',
      );
    }

    // Wrong OTP
    if (
      String(storedOtp).trim() !==
      enteredOtp
    ) {
      throw new UnauthorizedException(
        'Invalid OTP',
      );
    }

    // Find user
    let user =
      await this.usersService.findByPhone(
        formattedPhone,
      );

    // Check blocked user
    if (user?.isBlocked) {
      throw new UnauthorizedException(
        `This number is blocked. Reason: ${
          user.blockReason ||
          'No reason provided'
        }`,
      );
    }

    // Create new user if not exists
    if (!user) {
      user =
        await this.usersService.create(
          formattedPhone,
        );
    }

    // Delete OTP after successful verification
    await this.redisService.del(
      otpKey,
    );

    // JWT payload
    const payload = {
      userId:
        user._id.toString(),

      phone:
        user.phone,

      role:
        'user',
    };

    // Generate JWT
    const accessToken =
      this.jwtService.sign(
        payload,
      );

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
      user._id,
    );

    console.log(
      '===========================================',
    );

    return {
      success: true,

      message:
        'OTP verified successfully',

      access_token:
        accessToken,

      user,
    };
  }

  // ============================================
  // GET PROFILE
  // ============================================
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
