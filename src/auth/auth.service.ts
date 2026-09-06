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
    // =========================
    // CHECK USER
    // =========================

    const user =
      await this.usersService.findByPhone(
        phone,
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
    // GENERATE 6 DIGIT OTP
    // =========================

    const otp =
      Math.floor(
        100000 +
          Math.random() * 900000,
      ).toString();

    // =========================
    // SEND SMS
    // =========================
    //
    // SmsService → MiMSMS API v2.1
    //

    await this.smsService.sendOtp(
      phone,
      otp,
    );

    // =========================
    // SAVE OTP TO REDIS
    // =========================
    //
    // 300 seconds = 5 minutes
    //

    await this.redisService.set(
      `otp:${phone}`,
      otp,
      300,
    );

    // =========================
    // RESPONSE
    // =========================

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
    // =========================
    // GET OTP FROM REDIS
    // =========================

    const storedOtp =
      await this.redisService.get(
        `otp:${phone}`,
      );

    // =========================
    // OTP EXPIRED / NOT FOUND
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
      String(storedOtp) !==
      String(otp)
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
        phone,
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
    // CREATE USER IF NOT EXISTS
    // =========================

    if (!user) {
      user =
        await this.usersService.create(
          phone,
        );
    }

    // =========================
    // CREATE JWT TOKEN
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
      `otp:${phone}`,
    );

    // =========================
    // RESPONSE
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
    // =========================
    // FIND USER
    // =========================

    const user =
      await this.usersService.findById(
        userId,
      );

    // =========================
    // USER NOT FOUND
    // =========================

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    // =========================
    // RETURN USER
    // =========================

    return user;
  }
}
