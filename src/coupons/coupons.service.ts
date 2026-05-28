import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Coupon, CouponDocument } from './schemas/coupon.schema';

import { CreateCouponDto } from './dto/create-coupon.dto';

import { ApplyCouponDto } from './dto/apply-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name)
    private couponModel: Model<CouponDocument>,
  ) {}

  // CREATE COUPON
  async createCoupon(createCouponDto: CreateCouponDto) {
    return this.couponModel.create(createCouponDto);
  }

  // APPLY COUPON
  async applyCoupon(applyCouponDto: ApplyCouponDto) {
    const coupon = await this.couponModel.findOne({
      code: applyCouponDto.code.toUpperCase(),
    });

    if (!coupon) {
      throw new NotFoundException('Invalid coupon code');
    }

    // inactive
    if (!coupon.isActive) {
      throw new BadRequestException('Coupon inactive');
    }

    // expired
    const now = new Date();

    if (coupon.expireDate < now) {
      throw new BadRequestException('Coupon expired');
    }

    // minimum order
    if (applyCouponDto.orderAmount < coupon.minimumOrderAmount) {
      throw new BadRequestException(
        `Minimum order amount is ${coupon.minimumOrderAmount}`,
      );
    }

    let discountAmount = 0;

    // percentage
    if (coupon.type === 'percentage') {
      discountAmount = (applyCouponDto.orderAmount * coupon.discount) / 100;
    }

    // fixed
    if (coupon.type === 'fixed') {
      discountAmount = coupon.discount;
    }

    // final amount
    const finalAmount = applyCouponDto.orderAmount - discountAmount;

    // increase usage
    coupon.usageCount += 1;

    await coupon.save();

    return {
      success: true,

      couponCode: coupon.code,

      discountType: coupon.type,

      discountValue: coupon.discount,

      discountAmount,

      originalAmount: applyCouponDto.orderAmount,

      finalAmount,
    };
  }

  // GET ALL COUPONS
  async getAllCoupons() {
    return this.couponModel.find().sort({
      createdAt: -1,
    });
  }

  // DELETE COUPON
  async deleteCoupon(id: string) {
    const coupon = await this.couponModel.findById(id);

    if (!coupon) {
      throw new NotFoundException('Coupon not found');
    }

    await this.couponModel.findByIdAndDelete(id);

    return {
      success: true,
      message: 'Coupon deleted successfully',
    };
  }
}
