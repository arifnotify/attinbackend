import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { User, UserDocument, CustomerType } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  // ===========================
  // GET ALL USERS
  // ===========================
  async getUsers() {
    return this.userModel.find().sort({
      createdAt: -1,
    });
  }

  // ===========================
  // FIND USER BY PHONE
  // ===========================
  async findByPhone(phone: string) {
    return this.userModel.findOne({
      phone,
    });
  }

  // ===========================
  // FIND USER BY ID
  // ===========================
  async getUserById(id: string) {
    const user = await this.userModel.findById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ===========================
  // CREATE USER
  // ===========================
  async create(phone: string) {
    return this.userModel.create({
      phone,
    });
  }

  // ===========================
  // BLOCK USER
  // ===========================
  async blockUser(phone: string, reason: string) {
    return this.userModel.findOneAndUpdate(
      {
        phone,
      },
      {
        isBlocked: true,
        blockReason: reason,
      },
      {
        new: true,
      },
    );
  }

  // ===========================
  // UNBLOCK USER
  // ===========================
  async unblockUser(phone: string) {
    return this.userModel.findOneAndUpdate(
      {
        phone,
      },
      {
        isBlocked: false,
        blockReason: '',
      },
      {
        new: true,
      },
    );
  }

  // ===========================
  // UPDATE CUSTOMER TYPE
  // ===========================
  async updateCustomerType(userId: string, customerType: CustomerType) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        customerType,
      },
      {
        new: true,
      },
    );
  }

  // ===========================
  // ADD SPENT AMOUNT
  // ===========================
  async increaseSpentAmount(userId: string, amount: number) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        $inc: {
          totalSpent: amount,
        },
      },
      {
        new: true,
      },
    );
  }

  // ===========================
  // INCREASE ORDER COUNT
  // ===========================
  async increaseOrderCount(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        $inc: {
          totalOrders: 1,
        },
      },
      {
        new: true,
      },
    );
  }

  // ===========================
  // ADD REWARD EARNED
  // ===========================
  async increaseRewardEarned(userId: string, amount: number) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        $inc: {
          totalRewardEarned: amount,
        },
      },
      {
        new: true,
      },
    );
  }

  // ===========================
  // ADD REWARD USED
  // ===========================
  async increaseRewardUsed(userId: string, amount: number) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        $inc: {
          totalRewardUsed: amount,
        },
      },
      {
        new: true,
      },
    );
  }

  // ===========================
  // CHANGE CUSTOMER TYPE
  // ===========================
  async checkCustomerLevel(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    let customerType = CustomerType.REGULAR;

    if ((user.totalSpent || 0) >= 50000) {
      customerType = CustomerType.VIP;
    } else if ((user.totalSpent || 0) >= 10000) {
      customerType = CustomerType.PREMIUM;
    }

    if (customerType !== user.customerType) {
      user.customerType = customerType;
      await user.save();
    }

    return customerType;
  }
}
