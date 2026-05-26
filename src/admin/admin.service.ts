import { Injectable, UnauthorizedException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { Admin, AdminDocument } from './schemas/admin.schema';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name)
    private adminModel: Model<AdminDocument>,

    private jwtService: JwtService,
  ) {}

  // =========================
  // 🔐 ADMIN SIGNUP
  // =========================
  async signup(data: any) {
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const admin = await this.adminModel.create({
      ...data,
      password: hashedPassword,
    });

    return {
      success: true,
      message: 'Admin created successfully',
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  // =========================
  // 🔐 ADMIN LOGIN
  // =========================
  async login(data: any) {
    const admin = await this.adminModel.findOne({
      email: data.email,
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(data.password, admin.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // JWT TOKEN GENERATE
    const token = this.jwtService.sign({
      adminId: admin._id,
      email: admin.email,
      role: admin.role,
    });

    return {
      success: true,
      access_token: token,

      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        role: admin.role,
      },
    };
  }

  // =========================
  // 👤 GET SINGLE ADMIN (optional use)
  // =========================
  async getAdminById(id: string) {
    return this.adminModel.findById(id).select('-password');
  }
}