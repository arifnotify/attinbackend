import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RedisService } from '../redis/redis.service';
import { SmsService } from 'src/sms/sms.service';

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
  // CHECK USER BLOCKED
  const user = await this.usersService.findByPhone(phone);

  if (user?.isBlocked) {
    throw new UnauthorizedException(
      `This number is blocked. Reason: ${user.blockReason}`,
    );
  }

  // OTP COOLDOWN (1 minute)
  const cooldown = await this.redisService.get(
    `otp-cooldown:${phone}`,
  );

  if (cooldown) {
    throw new UnauthorizedException(
      'Please wait 1 minute before requesting another OTP',
    );
  }

  // GENERATE RANDOM OTP
  const otp = Math.floor(
    1000 + Math.random() * 9000,
  ).toString();

  // FORMAT PHONE NUMBER
  const formattedPhone = phone.startsWith('0')
    ? `88${phone}`
    : phone;

  // DEBUG LOG
  console.log('Generated OTP:', otp);

  // SEND SMS
  await this.smsService.sendOtp(
    formattedPhone,
    otp,
  );

  // SAVE OTP IN REDIS (5 min)
  await this.redisService.set(
    `otp:${phone}`,
    otp,
    300,
  );

  // OTP REQUEST COOLDOWN (1 min)
  await this.redisService.set(
    `otp-cooldown:${phone}`,
    '1',
    60,
  );

  return {
    success: true,
    message: 'OTP sent successfully',
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
  async getProfile(userId: string) {
    const user = await this.usersService.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}