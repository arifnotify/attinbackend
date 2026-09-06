import {
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

  // =========================
  // SEND OTP
  // =========================

  async sendOtp(phone: string) {
    // Keep phone exactly as app sends it
    // Example: 01894691666

    const formattedPhone = phone.trim();

    // =========================
    // CHECK USER
    // =========================

    const user =
      await this.usersService.findByPhone(
        formattedPhone,
      );

    // =========================
    // CHECK BLOCKED USER
    // =========================

    if (user?.isBlocked) {
      throw new UnauthorizedException(
        `This number is blocked. Reason: ${user.blockReason}`,
      );
    }

    // =========================
    // GENERATE OTP
    // =========================

    const otp =
      Math.floor(
        100000 +
          Math.random() * 900000,
      ).toString();

    // =========================
    // REDIS KEY
    // =========================

    const otpKey =
      `otp:${formattedPhone}`;

    // =========================
    // SEND SMS
    // =========================
    //
    // SmsService will convert:
    //
    // 01894691666
    //       ↓
    // 8801894691666
    //
    // only for MiMSMS.
    //

    await this.smsService.sendOtp(
      formattedPhone,
      otp,
    );

    // =========================
    // SAVE OTP
    // =========================

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
      '===========================================',
    );

    return {
      success: true,
      message:
        'OTP sent successfully',
    };
  }

  // =========================
  // VERIFY OTP
  // =========================

  async verifyOtp(
    phone: string,
    otp: string,
  ) {
    // Keep exactly the same format
    // Example: 01894691666

    const formattedPhone =
      phone.trim();

    const submittedOtp =
      String(otp).trim();

    // =========================
    // SAME REDIS KEY
    // =========================

    const otpKey =
      `otp:${formattedPhone}`;

    // =========================
    // GET OTP
    // =========================

    const storedOtp =
      await this.redisService.get(
        otpKey,
      );

    // =========================
    // DEBUG
    // =========================

    console.log(
      '================ OTP VERIFY ================',
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
      submittedOtp,
    );

    console.log(
      'Stored OTP:',
      storedOtp,
    );

    console.log(
      '============================================',
    );

    // =========================
    // OTP EXPIRED
    // =========================

    if (!storedOtp) {
      throw new UnauthorizedException(
        'OTP expired',
      );
    }

    // =========================
    // CHECK OTP
    // =========================

    if (
      String(storedOtp).trim() !==
      submittedOtp
    ) {
      throw new UnauthorizedException(
        'Invalid OTP',
      );
    }

    // =========================
    // FIND USER
    // =========================

    let user =
      await this.usersService.findByPhone(
        formattedPhone,
      );

    // =========================
    // CHECK BLOCKED
    // =========================

    if (user?.isBlocked) {
      throw new UnauthorizedException(
        `This number is blocked. Reason: ${user.blockReason}`,
      );
    }

    // =========================
    // CREATE USER
    // =========================

    if (!user) {
      user =
        await this.usersService.create(
          formattedPhone,
        );
    }

    // =========================
    // JWT
    // =========================

    const token =
      this.jwtService.sign({
        userId: user._id,
        phone: user.phone,
        role: 'user',
      });

    // =========================
    // DELETE OTP
    // =========================

    await this.redisService.del(
      otpKey,
    );

    // =========================
    // SUCCESS
    // =========================

    return {
      success: true,
      message:
        'User login successful',
      access_token: token,
      user,
    };
  }

  // =========================
  // GET PROFILE
  // =========================

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
