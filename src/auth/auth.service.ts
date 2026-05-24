import { Injectable, UnauthorizedException } from '@nestjs/common';

import { JwtService } from '@nestjs/jwt';

import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  // USER SEND OTP
  async sendOtp(phone: string) {
    const otp = '1234';

    // Store in Redis later

    return {
      success: true,
      otp,
    };
  }

  // USER VERIFY OTP
  async verifyOtp(phone: string, otp: string) {
    if (otp !== '1234') {
      throw new UnauthorizedException('Invalid OTP');
    }

    const token = this.jwtService.sign({
      phone,
      role: 'user',
    });

    return {
      success: true,
      access_token: token,
    };
  }

  // ADMIN LOGIN
  async adminLogin(admin: any) {
    const isPasswordMatched = await bcrypt.compare(
      admin.password,
      admin.hashedPassword,
    );

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      email: admin.email,
      role: 'admin',
    });

    return {
      success: true,
      access_token: token,
    };
  }
}
