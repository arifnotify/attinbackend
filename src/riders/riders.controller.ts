import { Controller, Post, Get, Body } from '@nestjs/common';
import { RidersService } from './riders.service';

import { CreateRiderDto } from './dto/create-rider.dto';
import { LoginRiderDto } from './dto/login-rider.dto';

@Controller('riders')
export class RidersController {
  constructor(private readonly service: RidersService) {}

  // =========================
  // CREATE RIDER
  // =========================
  @Post()
  create(@Body() dto: CreateRiderDto) {
    return this.service.createRider(dto);
  }

  // =========================
  // LOGIN RIDER
  // =========================
  @Post('login')
  login(@Body() dto: LoginRiderDto) {
    return this.service.login(dto);
  }

  // =========================
  // GET ALL RIDERS
  // =========================
  @Get()
  getAll() {
    return this.service.getAllRiders();
  }
}
