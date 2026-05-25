import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import { UsersService } from '../users/users.service';

import { RedisService } from '../redis/redis.service';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,

    private redisService: RedisService,

    private jwtService: JwtService,
  ) {}

  // SEND OTP
  async sendOtp(phone: string) {
    // CHECK USER BLOCKED
    const user = await this.usersService.findByPhone(phone);

    if (user?.isBlocked) {
      throw new UnauthorizedException(
        `This number is blocked. Reason: ${user.blockReason}`,
      );
    }

    // TEST OTP
    const otp = '1234';

    // STORE OTP IN REDIS
    await this.redisService.set(`otp:${phone}`, otp, 300);

    return {
      success: true,
      message: 'OTP sent successfully',
      otp,
    };
  }

  // VERIFY OTP
  async verifyOtp(phone: string, otp: string) {
    const storedOtp = await this.redisService.get(`otp:${phone}`);

    if (!storedOtp) {
      throw new UnauthorizedException('OTP expired');
    }

    if (storedOtp !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }

    // FIND USER
    let user = await this.usersService.findByPhone(phone);

    // CHECK BLOCK
    if (user?.isBlocked) {
      throw new UnauthorizedException(
        `This number is blocked. Reason: ${user.blockReason}`,
      );
    }

    // AUTO CREATE USER
    if (!user) {
      user = await this.usersService.create(phone);
    }

    // JWT TOKEN
    const token = this.jwtService.sign({
      userId: user._id,

      phone: user.phone,

      role: 'user',
    });

    // DELETE OTP
    await this.redisService.delete(`otp:${phone}`);

    return {
      success: true,

      message: 'User login successful',

      access_token: token,

      user,
    };
  }
}