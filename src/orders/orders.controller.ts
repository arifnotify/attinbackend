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
import { AdminEditOrderDto } from './dto/admin-edit-order.dto';

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
  // MY ORDERS
  // =========================

  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  getMyOrders(@Req() req: any) {
    return this.service.getUserOrders(req.user.userId);
  }

  // =========================
  // ACTIVE ORDER
  // =========================

  @UseGuards(JwtAuthGuard)
  @Get('active')
  getActiveOrder(@Req() req: any) {
    return this.service.getActiveOrder(req.user.userId);
  }

  // =========================
  // ALL ORDERS
  // =========================

  @UseGuards(JwtAuthGuard)
  @Get()
  getAll() {
    return this.service.getAllOrders();
  }

  // =========================
  // TRACK ORDER
  // =========================

  @Get(':id/tracking')
  getTracking(@Param('id') id: string) {
    return this.service.getTracking(id);
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
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.service.updateOrderStatus(id, dto);
  }

  // =========================
  // ASSIGN RIDER
  // =========================

  @UseGuards(JwtAuthGuard)
  @Put('assign-rider')
  assignRider(@Body() body: any) {
    return this.service.assignRider(body.orderId, body.riderId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  adminEditOrder(@Param('id') id: string, @Body() dto: AdminEditOrderDto) {
    return this.service.adminEditOrder(id, dto);
  }
}
