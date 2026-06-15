import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

@Controller('orders')
export class OrdersController {
  constructor(private readonly service: OrdersService) {}

  // =========================
  // CREATE ORDER
  // =========================
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.service.createOrder(req.user.userId, dto);
  }

  // =========================
  // MY ORDERS (USER)
  // =========================
  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  getMyOrders(@Req() req: any) {
    return this.service.getUserOrders(req.user.userId);
  }

  // =========================
  // ACTIVE ORDER (TRACKING)
  // =========================
  @UseGuards(JwtAuthGuard)
  @Get('active')
  getActive(@Req() req: any) {
    return this.service.getActiveOrder(req.user.userId);
  }

  // =========================
  // ALL ORDERS (ADMIN)
  // =========================
  @UseGuards(JwtAuthGuard)
  @Get()
  getAll() {
    return this.service.getAllOrders();
  }

  // =========================
  // SINGLE ORDER
  // =========================
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getOne(@Param('id') id: string) {
    return this.service.getSingleOrder(id);
  }

  // =========================
  // UPDATE STATUS
  // =========================
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.service.updateOrderStatus(id, dto);
  }

  // =========================
  // RIDER LOCATION UPDATE
  // =========================
  @Put(':id/location')
  updateLocation(
    @Param('id') id: string,
    @Body() body: any,
  ) {
    return this.service.updateRiderLocation(
      id,
      body.lat,
      body.lng,
    );
  }

  // =========================
  // TRACKING (CUSTOMER)
  // =========================
  @Get(':id/tracking')
  getTracking(@Param('id') id: string) {
    return this.service.getTracking(id);
  }
}