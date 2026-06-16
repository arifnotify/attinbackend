import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

import { Rider } from './schemas/rider.schema';
import { CreateRiderDto } from './dto/create-rider.dto';
import { LoginRiderDto } from './dto/login-rider.dto';

@Injectable()
export class RidersService {
  constructor(
    @InjectModel(Rider.name)
    private riderModel: Model<Rider>,

    private jwtService: JwtService,
  ) {}

  // =========================
  // CREATE RIDER
  // =========================
  async createRider(dto: CreateRiderDto) {
    const hash = await bcrypt.hash(dto.password, 10);

    const rider = await this.riderModel.create({
      name: dto.name,
      phone: dto.phone,
      password: hash,
      role: 'rider',
    });

    return {
      message: 'Rider created successfully',
      data: rider,
    };
  }

  // =========================
  // LOGIN RIDER
  // =========================
  async login(dto: LoginRiderDto) {
    const rider = await this.riderModel.findOne({
      phone: dto.phone,
    });

    if (!rider) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(dto.password, rider.password);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      id: rider._id,
      role: rider.role,
    });

    return {
      message: 'Login successful',
      access_token: token,
      rider,
    };
  }

  // =========================
  // GET ALL RIDERS
  // =========================
  async getAllRiders() {
    return this.riderModel.find();
  }
}
