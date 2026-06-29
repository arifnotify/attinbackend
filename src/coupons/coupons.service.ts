import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { Coupon, CouponDocument } from './schemas/coupon.schema';

@Injectable()
export class CouponsService {
  constructor(
    @InjectModel(Coupon.name)
    private couponModel: Model<CouponDocument>,
  ) {}

  // =========================
  // GENERATE SIMPLE COUPON (REWARD SYSTEM)
  // =========================

  async generateCoupon(userId: string, amount: number) {
    const code =
      'RW-' +
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + 6);

    return this.couponModel.create({
      code,
      user: new Types.ObjectId(userId),
      discountAmount: amount,
      expiresAt,
      isActive: true,
      isUsed: false,
    });
  }

  // =========================
  // PURCHASE COUPON (ORDER BASED - DAY 22)
  // =========================

  async generatePurchaseCoupon(
    userId: string,
    totalAmount: number,
    orderId?: string,
  ) {
    const discount = Math.floor(totalAmount * 0.05); // 5% reward coupon

    if (discount <= 0) return null;

    // prevent duplicate for same order
    if (orderId) {
      const existing = await this.couponModel.findOne({
        user: new Types.ObjectId(userId),
        order: new Types.ObjectId(orderId),
      });

      if (existing) {
        return existing;
      }
    }

    const code =
      'PUR-' +
      Math.random()
        .toString(36)
        .substring(2, 8)
        .toUpperCase();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    return this.couponModel.create({
      code,
      user: new Types.ObjectId(userId),
      discountAmount: discount,
      expiresAt,
      isActive: true,
      isUsed: false,
      order: orderId ? new Types.ObjectId(orderId) : null,
    });
  }

  // =========================
  // GET USER COUPONS
  // =========================

  async getUserCoupons(userId: string) {
    return this.couponModel
      .find({
        user: new Types.ObjectId(userId),
        isActive: true,
        isUsed: false,
      })
      .sort({ createdAt: -1 });
  }

  // =========================
  // VALIDATE COUPON
  // =========================

  async validateCoupon(userId: string, code: string) {
    const coupon = await this.couponModel.findOne({
      code,
      user: new Types.ObjectId(userId),
      isActive: true,
      isUsed: false,
    });

    if (!coupon) {
      throw new BadRequestException('Invalid coupon');
    }

    if (new Date() > coupon.expiresAt) {
      throw new BadRequestException('Coupon expired');
    }

    return coupon;
  }

  // =========================
  // MARK AS USED
  // =========================

  async markAsUsed(couponId: string) {
    return this.couponModel.findByIdAndUpdate(
      couponId,
      {
        isUsed: true,
        usedAt: new Date(),
      },
      { new: true },
    );
  }

  // ===========================
// ADMIN - GET ALL COUPONS
// ===========================

async getAllCoupons() {
  return this.couponModel
    .find()
    .populate({
      path: "user",
      select: "phone customerType",
    })
    .populate({
      path: "order",
      select: "orderNumber",
    })
    .sort({
      createdAt: -1,
    });
}
}
/* import {
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
}*/
