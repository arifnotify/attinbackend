import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { OrdersService } from './orders.service';

import { CreateOrderDto } from './dto/create-order.dto';

import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  // CREATE ORDER
  @UseGuards(JwtAuthGuard)
  @Post()
  createOrder(
    @Req() req: any,

    @Body()
    createOrderDto: CreateOrderDto,
  ) {
    return this.ordersService.createOrder(req.user.userId, createOrderDto);
  }

  // USER ORDERS
  @UseGuards(JwtAuthGuard)
  @Get('my-orders')
  getUserOrders(@Req() req: any) {
    return this.ordersService.getUserOrders(req.user.userId);
  }

  // SINGLE ORDER
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getSingleOrder(@Param('id') id: string) {
    return this.ordersService.getSingleOrder(id);
  }

  // ADMIN ALL ORDERS
  @UseGuards(JwtAuthGuard)
  @Get()
  getAllOrders() {
    return this.ordersService.getAllOrders();
  }

  // UPDATE STATUS
  @UseGuards(JwtAuthGuard)
  @Patch(':id/status')
  updateOrderStatus(
    @Param('id') id: string,

    @Body()
    updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, updateOrderStatusDto);
  }
}
