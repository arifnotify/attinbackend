import { Controller, Get, Param } from '@nestjs/common';

import { CouponsService } from './coupons.service';

@Controller('coupons')
export class CouponsController {
  constructor(private readonly couponsService: CouponsService) {}

  @Get(':userId')
  getCoupons(
    @Param('userId')
    userId: string,
  ) {
    return this.couponsService.getUserCoupons(userId);
  }
}

/*import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CouponsService } from './coupons.service';

import { CreateCouponDto } from './dto/create-coupon.dto';

import { ApplyCouponDto } from './dto/apply-coupon.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('coupons')
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  // CREATE COUPON
  @UseGuards(JwtAuthGuard)
  @Post()
  createCoupon(
    @Body()
    createCouponDto: CreateCouponDto,
  ) {
    return this.couponsService.createCoupon(createCouponDto);
  }

  // APPLY COUPON
  @Post('apply')
  applyCoupon(
    @Body()
    applyCouponDto: ApplyCouponDto,
  ) {
    return this.couponsService.applyCoupon(applyCouponDto);
  }

  // ALL COUPONS
  @UseGuards(JwtAuthGuard)
  @Get()
  getAllCoupons() {
    return this.couponsService.getAllCoupons();
  }

  // DELETE COUPON
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteCoupon(@Param('id') id: string) {
    return this.couponsService.deleteCoupon(id);
  }
}*/
