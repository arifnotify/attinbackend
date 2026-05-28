import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument } from '../users/schemas/user.schema';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

import { RedisService } from '../redis/redis.service';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,

    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,

    private redisService: RedisService,
  ) {}

  // =========================
  // DASHBOARD SUMMARY (CACHED)
  // =========================
  async getDashboardSummary() {
    const cacheKey = 'dashboard_summary';

    // 🔥 CHECK CACHE FIRST
    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      console.log('🔥 DASHBOARD FROM REDIS');

      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }

    console.log('🟢 DASHBOARD FROM MONGODB');

    // TOTAL USERS
    const totalUsers = await this.userModel.countDocuments();

    // TOTAL PRODUCTS
    const totalProducts = await this.productModel.countDocuments();

    // TOTAL ORDERS
    const totalOrders = await this.orderModel.countDocuments();

    // TOTAL REVENUE
    const revenueResult = await this.orderModel.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: {
            $sum: '$totalAmount',
          },
        },
      },
    ]);

    const totalRevenue =
      revenueResult.length > 0 ? revenueResult[0].totalRevenue : 0;

    const result = {
      totalUsers,
      totalProducts,
      totalOrders,
      totalRevenue,
    };

    // 💾 SAVE CACHE (2 min because analytics changes fast)
    await this.redisService.set(cacheKey, JSON.stringify(result), 120);

    return result;
  }

  // =========================
  // MONTHLY SALES (CACHED)
  // =========================
  async getMonthlySales() {
    const cacheKey = 'monthly_sales';

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }

    const result = await this.orderModel.aggregate([
      {
        $group: {
          _id: {
            month: {
              $month: '$createdAt',
            },
            year: {
              $year: '$createdAt',
            },
          },
          totalSales: {
            $sum: '$totalAmount',
          },
          totalOrders: {
            $sum: 1,
          },
        },
      },
      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);

    await this.redisService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }

  // =========================
  // RECENT ORDERS (NO CACHE)
  // =========================
  async getRecentOrders() {
    return this.orderModel
      .find()
      .populate('user', 'name phoneNumber')
      .sort({ createdAt: -1 })
      .limit(10);
  }

  // =========================
  // TOP PRODUCTS (CACHED)
  // =========================
  async getTopProducts() {
    const cacheKey = 'top_products';

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }

    const result = await this.productModel
      .find()
      .sort({ totalSales: -1 })
      .limit(10);

    await this.redisService.set(cacheKey, JSON.stringify(result), 300);

    return result;
  }
}
