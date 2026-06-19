import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { RidersService } from './riders.service';

import { CreateRiderDto } from './dto/create-rider.dto';

import { LoginRiderDto } from './dto/login-rider.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('riders')
export class RidersController {
  constructor(private readonly service: RidersService) {}

  // CREATE RIDER

  @Post()
  create(
    @Body()
    dto: CreateRiderDto,
  ) {
    return this.service.createRider(dto);
  }

  // LOGIN

  @Post('login')
  login(
    @Body()
    dto: LoginRiderDto,
  ) {
    return this.service.login(dto);
  }

  // ALL RIDERS

  @Get()
  getAll() {
    return this.service.getAllRiders();
  }

  // MY ORDERS

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  getMyOrders(
    @Req()
    req: any,
  ) {
    return this.service.getMyOrders(req.user.id);
  }

  // COMPLETE ORDER

  @UseGuards(JwtAuthGuard)
  @Post('complete-order/:orderId')
  completeOrder(@Param('orderId') orderId: string, @Req() req: any) {
  return this.service.completeOrder(orderId,req.user.id || req.user.userId,);}
}
