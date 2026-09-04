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
    const user =
      await this.usersService.findByPhone(
        phone,
      );

    if (user?.isBlocked) {
      throw new UnauthorizedException(
        `This number is blocked. Reason: ${user.blockReason}`,
      );
    }

    const otp = Math.floor(
      1000 + Math.random() * 9000,
    ).toString();

    console.log(
      'Generated OTP:',
      otp,
    );

    await this.redisService.set(
      `otp:${phone}`,
      otp,
      300,
    );

    await this.smsService.sendOtp(
      phone,
      otp,
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
    const storedOtp =
      await this.redisService.get(
        `otp:${phone}`,
      );

    if (!storedOtp) {
      throw new UnauthorizedException(
        'OTP expired',
      );
    }

    if (
      String(storedOtp) !==
      String(otp)
    ) {
      throw new UnauthorizedException(
        'Invalid OTP',
      );
    }

    let user =
      await this.usersService.findByPhone(
        phone,
      );

    if (user?.isBlocked) {
      throw new UnauthorizedException(
        `This number is blocked. Reason: ${user.blockReason}`,
      );
    }

    if (!user) {
      user =
        await this.usersService.create(
          phone,
        );
    }

    const token =
      this.jwtService.sign({
        userId: user._id,
        phone: user.phone,
        role: 'user',
      });

    await this.redisService.del(
      `otp:${phone}`,
    );

    return {
      success: true,
      message:
        'User login successful',
      access_token: token,
      user,
    };
  }

  // =========================
  // PROFILE
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
