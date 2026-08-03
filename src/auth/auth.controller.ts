import {
  Body,
  Controller,
  Get,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { SendOtpDto } from './dto/send-otp.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ==========================================
  // 📩 SEND OTP
  // ==========================================
  @Post('send-otp')
  async sendOtp(
    @Body() sendOtpDto: SendOtpDto,
  ) {
    return this.authService.sendOtp(sendOtpDto.phone);
  }

  // ==========================================
  // 🔑 VERIFY OTP
  // ==========================================
  @Post('verify-otp')
  async verifyOtp(
    @Body() verifyOtpDto: VerifyOtpDto,
  ) {
    return this.authService.verifyOtp(verifyOtpDto.phone, verifyOtpDto.otp);
  }

  // ==========================================
  // 👤 GET USER PROFILE & CHECK BLOCK STATUS
  // ==========================================
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    // 💡 JWT স্ট্র্যাটেজি থেকে আসা user id দিয়ে ডাটাবেজ থেকে ফ্রেশ ইউজারের তথ্য রিটার্ন করুন
    const userId = req.user._id || req.user.id;
    return this.authService.getProfile(userId);
  }
}