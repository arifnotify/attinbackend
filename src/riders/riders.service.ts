import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import * as bcrypt from 'bcrypt';

import { JwtService } from '@nestjs/jwt';

import { Rider, RiderDocument } from './schemas/rider.schema';

import { Order } from '../orders/schemas/order.schema';

import { CreateRiderDto } from './dto/create-rider.dto';

import { LoginRiderDto } from './dto/login-rider.dto';

@Injectable()
export class RidersService {
  constructor(
    @InjectModel(Rider.name)
    private riderModel: Model<RiderDocument>,

    @InjectModel(Order.name)
    private orderModel: Model<any>,

    private jwtService: JwtService,
  ) {}

  // =========================
  // CREATE RIDER
  // =========================

  async createRider(
    dto: CreateRiderDto,
  ) {
    const hash = await bcrypt.hash(
      dto.password,
      10,
    );

    const rider =
      await this.riderModel.create({
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
  // LOGIN
  // =========================

  async login(dto: LoginRiderDto) {
    const rider = await this.riderModel.findOne({
      phone: dto.phone,
    });

    if (!rider) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const match = await bcrypt.compare(dto.password, rider.password);

    if (!match) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.jwtService.sign({
      id: rider._id,
      role: rider.role,
    });

    return {
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

  // =========================
  // RIDER ORDERS
  // =========================

  async getMyOrders(riderId: string) {
    return this.orderModel
      .find({
        assignedRider: riderId,
      })
      .sort({
        createdAt: -1,
      });
  }

  // =========================
  // COMPLETE ORDER
  // =========================

  async completeOrder(orderId: string) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return this.orderModel.findByIdAndUpdate(
      orderId,
      {
        orderStatus: 'Delivered',
        trackingEnabled: false,
      },
      {
        new: true,
      },
    );
  }
}