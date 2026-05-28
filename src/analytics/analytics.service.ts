import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { User, UserDocument } from '../users/schemas/user.schema';

import { Order, OrderDocument } from '../orders/schemas/order.schema';

import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class AnalyticsService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,

    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
  ) {}

  // DASHBOARD SUMMARY
  async getDashboardSummary() {
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

    return {
      totalUsers,

      totalProducts,

      totalOrders,

      totalRevenue,
    };
  }

  // MONTHLY SALES
  async getMonthlySales() {
    return this.orderModel.aggregate([
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
  }

  // RECENT ORDERS
  async getRecentOrders() {
    return this.orderModel
      .find()
      .populate('user', 'name phoneNumber')
      .sort({
        createdAt: -1,
      })
      .limit(10);
  }

  // TOP PRODUCTS
  async getTopProducts() {
    return this.productModel
      .find()
      .sort({
        totalSales: -1,
      })
      .limit(10);
  }
}
