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
    // testing OTP
    const otp = '1234';

    // store OTP in Redis
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

    // find existing user
    let user = await this.usersService.findByPhone(phone);

    // if user does not exist
    // create account automatically
    if (!user) {
      user = await this.usersService.create(phone);
    }

    // generate JWT token
    const token = this.jwtService.sign({
      userId: user._id,
      phone: user.phone,
      role: 'user',
    });

    // delete OTP after verification
    await this.redisService.delete(`otp:${phone}`);

    return {
      success: true,

      message: 'User login successful',

      access_token: token,

      user,
    };
  }
}
