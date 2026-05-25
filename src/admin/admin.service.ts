import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';

import { Admin, AdminDocument } from './schemas/admin.schema';

import { CreateAdminDto } from './dto/create-admin.dto';

import { LoginAdminDto } from './dto/login-admin.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admin.name)
    private adminModel: Model<AdminDocument>,

    private jwtService: JwtService,
  ) {}

  // SIGNUP
  async signup(createAdminDto: CreateAdminDto) {
    const existingAdmin = await this.adminModel.findOne({
      email: createAdminDto.email,
    });

    if (existingAdmin) {
      throw new BadRequestException('Email already exists');
    }

    // hash password
    const hashedPassword = await bcrypt.hash(createAdminDto.password, 10);

    // create admin
    const admin = await this.adminModel.create({
      ...createAdminDto,
      password: hashedPassword,
    });

    return {
      success: true,
      message: 'Admin account created successfully',
      admin,
    };
  }

  // LOGIN
  async login(loginAdminDto: LoginAdminDto) {
    const admin = await this.adminModel.findOne({
      email: loginAdminDto.email,
    });

    if (!admin) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // compare password
    const isPasswordMatched = await bcrypt.compare(
      loginAdminDto.password,
      admin.password,
    );

    if (!isPasswordMatched) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // generate token
    const token = this.jwtService.sign({
      adminId: admin._id,
      email: admin.email,
      role: admin.role,
    });

    return {
      success: true,
      access_token: token,
      admin,
    };
  }

  // CURRENT ADMIN
  async getCurrentAdmin(id: string) {
    return this.adminModel.findById(id);
  }
}
