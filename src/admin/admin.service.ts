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

  async signup(data: any) {
    const hashed = await bcrypt.hash(data.password, 10);

    return this.adminModel.create({
      ...data,
      password: hashed,
    });
  }

  async login(data: any) {
    const admin = await this.adminModel.findOne({ email: data.email });

    if (!admin) throw new UnauthorizedException('Invalid credentials');

    const match = await bcrypt.compare(data.password, admin.password);

    if (!match) throw new UnauthorizedException('Invalid credentials');

    const token = this.jwtService.sign({
      adminId: admin._id,
      role: 'admin',
    });

    return {
      access_token: token,
    };
  }
}
