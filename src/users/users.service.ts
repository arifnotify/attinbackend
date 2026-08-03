import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { User, UserDocument, CustomerType } from './schemas/user.schema';
import {
  RewardSettings,
  RewardSettingsDocument,
} from 'src/reward-settings/schemas/reward-setting.schema';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,

    @InjectModel(RewardSettings.name)
    private rewardSettingsModel: Model<RewardSettingsDocument>,

    private readonly socketGateway: SocketGateway,
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
  // 🔑 FIND USER BY ID (নতুন মেথড যোগ করা হয়েছে)
  // ===========================
  async findById(id: string) {
    const user = await this.userModel.findById(id).select('-password');

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  // ===========================
  // GET USER BY ID (BACKWARD COMPATIBILITY)
  // ===========================
  async getUserById(id: string) {
    return this.findById(id);
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
    const user = await this.userModel.findOneAndUpdate(
      { phone },
      {
        isBlocked: true,
        blockReason: reason,
      },
      { new: true },
    );

    if (user) {
      // 🔥 সকেট ইভেন্ট: ইউজারকে ইনস্ট্যান্ট ব্লক আপডেট পাঠানো
      this.socketGateway.emitUserBlockStatusChanged(
        user._id.toString(),
        true,
        reason,
      );
    }

    return user;
  }

  // ===========================
  // UNBLOCK USER
  // ===========================
  async unblockUser(phone: string) {
    const user = await this.userModel.findOneAndUpdate(
      { phone },
      {
        isBlocked: false,
        blockReason: '',
      },
      { new: true },
    );

    if (user) {
      // 🔥 সকেট ইভেন্ট: ইউজারকে আনব্লক আপডেট পাঠানো
      this.socketGateway.emitUserBlockStatusChanged(
        user._id.toString(),
        false,
      );
    }

    return user;
  }

  // ===========================
  // UPDATE CUSTOMER TYPE
  // ===========================
  async updateCustomerType(userId: string, customerType: CustomerType) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      { customerType },
      { new: true },
    );

    if (user) {
      // 🔥 সকেট ইভেন্ট: কাস্টমার টাইপ চেঞ্জ হলে ইউজারকে নোটিফাই করা
      this.socketGateway.emitUserUpdated(userId, { customerType });
    }

    return user;
  }

  // ===========================
  // ADD SPENT AMOUNT
  // ===========================
  async increaseSpentAmount(userId: string, amount: number) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $inc: { totalSpent: amount },
      },
      { new: true },
    );

    if (user) {
      this.socketGateway.emitUserUpdated(userId, { totalSpent: user.totalSpent });
    }

    return user;
  }

  // ===========================
  // INCREASE ORDER COUNT
  // ===========================
  async increaseOrderCount(userId: string) {
    return this.userModel.findByIdAndUpdate(
      userId,
      {
        $inc: { totalOrders: 1 },
      },
      { new: true },
    );
  }

  // ===========================
  // ADD REWARD EARNED
  // ===========================
  async increaseRewardEarned(userId: string, amount: number) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $inc: { totalRewardEarned: amount },
      },
      { new: true },
    );

    if (user) {
      this.socketGateway.emitUserUpdated(userId, {
        totalRewardEarned: user.totalRewardEarned,
      });
    }

    return user;
  }

  // ===========================
  // ADD REWARD USED
  // ===========================
  async increaseRewardUsed(userId: string, amount: number) {
    const user = await this.userModel.findByIdAndUpdate(
      userId,
      {
        $inc: { totalRewardUsed: amount },
      },
      { new: true },
    );

    if (user) {
      this.socketGateway.emitUserUpdated(userId, {
        totalRewardUsed: user.totalRewardUsed,
      });
    }

    return user;
  }

  // ===========================
  // CHECK CUSTOMER LEVEL
  // ===========================
  async checkCustomerLevel(userId: string) {
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const settings = await this.rewardSettingsModel.findOne();
    const premiumAmount = settings?.premiumAmount || 10000;
    const vipAmount = settings?.vipAmount || 50000;

    let customerType = CustomerType.REGULAR;

    if ((user.totalSpent || 0) >= vipAmount) {
      customerType = CustomerType.VIP;
    } else if ((user.totalSpent || 0) >= premiumAmount) {
      customerType = CustomerType.PREMIUM;
    }

    if (user.customerType !== customerType) {
      user.customerType = customerType;
      await user.save();

      // 🔥 সকেট ইভেন্ট: টাইপ আপগ্রেড হলে রিয়েলটাইমে ইউজারকে পাঠানো
      this.socketGateway.emitUserUpdated(userId, { customerType });
    }

    return {
      userId: user._id,
      totalSpent: user.totalSpent,
      customerType,
      premiumLimit: premiumAmount,
      vipLimit: vipAmount,
    };
  }
}