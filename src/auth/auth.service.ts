
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
  // NORMALIZE PHONE NUMBER
  // =========================

  private normalizePhone(phone: string): string {
    let formattedPhone = phone.trim();

    // Remove spaces
    formattedPhone =
      formattedPhone.replace(/\s+/g, '');

    // Remove +
    if (formattedPhone.startsWith('+')) {
      formattedPhone =
        formattedPhone.substring(1);
    }

    // 01XXXXXXXXX
    // ↓
    // 8801XXXXXXXXX
    if (formattedPhone.startsWith('01')) {
      formattedPhone =
        `88${formattedPhone}`;
    }

    // 8801XXXXXXXXX
    // Already correct
    if (
      formattedPhone.startsWith('8801')
    ) {
      return formattedPhone;
    }

    return formattedPhone;
  }

  // =========================
  // SEND OTP
  // =========================

  async sendOtp(phone: string) {
    // Normalize phone
    const formattedPhone =
      this.normalizePhone(phone);

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
    // GENERATE 6 DIGIT OTP
    // =========================

    const otp =
      Math.floor(
        100000 +
          Math.random() * 900000,
      ).toString();

    // =========================
    // OTP KEY
    // =========================

    const otpKey =
      `otp:${formattedPhone}`;

    // =========================
    // SEND SMS
    // =========================

    await this.smsService.sendOtp(
      formattedPhone,
      otp,
    );

    // =========================
    // SAVE OTP TO REDIS
    // =========================
    //
    // 300 seconds = 5 minutes
    //

    await this.redisService.set(
      otpKey,
      otp,
      300,
    );

    // =========================
    // LOG
    // =========================

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
      'OTP saved to Redis successfully',
    );

    console.log(
      '===========================================',
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
    // NORMALIZE PHONE
    // =========================

    const formattedPhone =
      this.normalizePhone(phone);

    // =========================
    // CLEAN OTP
    // =========================

    const submittedOtp =
      String(otp).trim();

    // =========================
    // OTP KEY
    // =========================

    const otpKey =
      `otp:${formattedPhone}`;

    // =========================
    // GET OTP FROM REDIS
    // =========================

    const storedOtp =
      await this.redisService.get(
        otpKey,
      );

    // =========================
    // DEBUG LOG
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
    // OTP NOT FOUND / EXPIRED
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
    // CHECK BLOCKED USER
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
    // CREATE JWT
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
    //
    // OTP can only be used once.
    //

    await this.redisService.del(
      otpKey,
    );

    // =========================
    // SUCCESS LOG
    // =========================

    console.log(
      'OTP verified successfully:',
      formattedPhone,
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
