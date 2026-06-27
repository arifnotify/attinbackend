import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import {
  RewardWallet,
  RewardWalletDocument,
} from './schemas/reward-wallet.schema';

import {
  RewardTransaction,
  RewardTransactionDocument,
  RewardTransactionType,
} from './schemas/reward-transaction.schema';
import { RewardSettingsService } from 'src/reward-settings/reward-settings.service';
import { CouponsService } from 'src/coupons/coupons.service';

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(RewardWallet.name)
    private walletModel: Model<RewardWalletDocument>,

    @InjectModel(RewardTransaction.name)
    private transactionModel: Model<RewardTransactionDocument>,

    private rewardSettingsService: RewardSettingsService,

    private couponsService: CouponsService,
  ) {}

  // ===========================
  // CREATE WALLET IF NOT EXISTS
  // ===========================

  async getWallet(userId: string) {
    let wallet = await this.walletModel.findOne({
      user: userId,
    });

    if (!wallet) {
      wallet = await this.walletModel.create({
        user: new Types.ObjectId(userId),
      });
    }

    return wallet;
  }

  // ===========================
  // ADD REWARD
  // ===========================

  async addReward(
    userId: string,
    amount: number,
    orderId: string,
    description: string,
  ) {
    const wallet = await this.getWallet(userId);

    wallet.balance += amount;

    wallet.totalEarned += amount;

    await wallet.save();

    await this.transactionModel.create({
      user: new Types.ObjectId(userId),

      amount,

      type: RewardTransactionType.EARN,

      order: new Types.ObjectId(orderId),

      description,
    });
    // AUTO COUPON GENERATE
    if (wallet.balance >= 100) {
      await this.couponsService.generateCoupon(userId, 100);

      wallet.balance -= 100;

      await wallet.save();
    }

    return wallet;
  }

  // ===========================
  // GET BALANCE
  // ===========================

  async getBalance(userId: string) {
    const wallet = await this.getWallet(userId);

    return wallet;
  }

  // ===========================
  // HISTORY
  // ===========================

  async history(userId: string) {
    return this.transactionModel
      .find({
        user: userId,
      })
      .sort({
        createdAt: -1,
      });
  }

  // ===========================
  // CALCULATE REWARD
  // ===========================

  async calculateReward(customerType: string, orderAmount: number) {
    const settings = await this.rewardSettingsService.getSettings();

    if (!settings || !settings.isActive) {
      return 0;
    }

    let percentage = settings.regularPercentage;

    if (customerType === 'premium') {
      percentage = settings.premiumPercentage;
    }

    if (customerType === 'vip') {
      percentage = settings.vipPercentage;
    }

    const reward = (orderAmount * percentage) / 100;

    return Number(reward.toFixed(2));
  }

  // ===========================
  // ORDER DELIVERED
  // ===========================

  async rewardAfterOrder(
    userId: string,
    customerType: string,
    orderAmount: number,
    orderId: string,
  ) {
    const reward = await this.calculateReward(customerType, orderAmount);

    if (reward <= 0) {
      return;
    }

    await this.addReward(
      userId,
      reward,
      orderId,
      `Reward earned from order of ৳${orderAmount}`,
    );

    return reward;
  }

  ////////////////////////////////////////
  async redeemReward(userId: string, amount: number, orderId: string) {
    const wallet = await this.getWallet(userId);

    if (wallet.balance < amount) {
      throw new Error('Insufficient reward balance');
    }

    wallet.balance -= amount;

    wallet.totalUsed += amount;

    await wallet.save();

    await this.transactionModel.create({
      user: userId,

      amount,

      type: RewardTransactionType.REDEEM,

      order: orderId,

      description: 'Reward used during checkout',
    });

    return wallet;
  }
  
/////////////////////////////////////////
  async createTransaction(data: {
  user: string;
  amount: number;
  type: string;
  order: string;
  description: string;
}) {
  return this.transactionModel.create({
    user: new Types.ObjectId(data.user),

    amount: data.amount,

    type: data.type as RewardTransactionType,

    order: new Types.ObjectId(data.order),

    description: data.description,
  });
}
}
