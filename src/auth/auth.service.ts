import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
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

  // =========================
  // SEND OTP
  // =========================
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

    // DEBUG LOG
    console.log('Generated OTP:', otp);

    // SAVE OTP IN REDIS (5 min)
    await this.redisService.set(`otp:${phone}`, otp, 300);

    return {
      success: true,
      message: 'OTP sent successfully',
      otp,
    };
  }

  // =========================
  // VERIFY OTP
  // =========================
  async verifyOtp(phone: string, otp: string) {
    // GET OTP FROM REDIS
    const storedOtp = await this.redisService.get(`otp:${phone}`);

    // DEBUG LOGS
    console.log('Stored OTP:', storedOtp);
    console.log('User OTP:', otp);

    // CHECK OTP EXISTS
    if (!storedOtp) {
      throw new UnauthorizedException('OTP expired');
    }

    // VERIFY OTP
    if (String(storedOtp) !== String(otp)) {
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

    // GENERATE JWT TOKEN
    const token = this.jwtService.sign({
      userId: user._id,
      phone: user.phone,
      role: 'user',
    });

    // DELETE OTP AFTER SUCCESS
    await this.redisService.del(`otp:${phone}`);

    return {
      success: true,
      message: 'User login successful',
      access_token: token,
      user,
    };
  }

  // =========================
  // GET PROFILE
  // =========================
// src/auth/auth.service.ts

async getProfile(userId: string) {
  // findById এর বদলে findOne বা আপনার UsersService-এ যে মেথড আছে তা ব্যবহার করুন
  const user = await this.usersService.findOne(userId); 

  if (!user) {
    throw new NotFoundException('User not found');
  }

  return user;
}
}