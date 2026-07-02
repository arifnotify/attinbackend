import { Injectable, BadRequestException } from '@nestjs/common';
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

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(RewardWallet.name)
    private walletModel: Model<RewardWalletDocument>,

    @InjectModel(RewardTransaction.name)
    private transactionModel: Model<RewardTransactionDocument>,

    private rewardSettingsService: RewardSettingsService,
  ) {}

  // =========================
  // GET OR CREATE WALLET (SAFE + RACE CONDITION FIX)
  // =========================
  async getWallet(userId: string) {
    const userObjectId = new Types.ObjectId(userId);

    let wallet = await this.walletModel.findOne({ user: userObjectId });

    if (wallet) return wallet;

    try {
      wallet = await this.walletModel.create({
        user: userObjectId,
        balance: 0,
        totalEarned: 0,
        totalUsed: 0,
      });

      return wallet;
    } catch (err) {
      if (err.code === 11000) {
        return this.walletModel.findOne({ user: userObjectId });
      }
      throw err;
    }
  }

  // =========================
  // ADD REWARD (ONLY DELIVERY)
  // =========================
  async addReward(
    userId: string,
    amount: number,
    orderId: string,
    description: string,
  ) {
    if (amount <= 0) return null;

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

    return wallet;
  }

  // =========================
  // GET ALL WALLETS
  // =========================
  async getAllWallets() {
    return this.walletModel
      .find()
      .populate('user', 'phone customerType')
      .sort({ createdAt: -1 });
  }

  // =========================
  // GET BALANCE
  // =========================
  async getBalance(userId: string) {
    return this.getWallet(userId);
  }

  // =========================
  // HISTORY
  // =========================
  async history(userId: string) {
    return this.transactionModel
      .find({ user: userId })
      .sort({ createdAt: -1 });
  }

  // =========================
  // CALCULATE REWARD
  // =========================
  async calculateReward(customerType: string, orderAmount: number) {
    const settings = await this.rewardSettingsService.getSettings();

    if (!settings || !settings.isActive) return 0;

    let percentage = settings.regularPercentage;

    if (customerType === 'premium') percentage = settings.premiumPercentage;
    if (customerType === 'vip') percentage = settings.vipPercentage;

    const reward = (orderAmount * percentage) / 100;

    return Number(reward.toFixed(2));
  }

  // =========================
  // DELIVERY REWARD ONLY
  // =========================
  async rewardAfterOrder(
    userId: string,
    customerType: string,
    orderAmount: number,
    orderId: string,
  ): Promise<number> {
    const reward = await this.calculateReward(customerType, orderAmount);

    if (reward <= 0) return 0;

    await this.addReward(
      userId,
      reward,
      orderId,
      `Reward earned from order ৳${orderAmount}`,
    );

    return reward;
  }

  // =========================
  // REDEEM REWARD (CHECKOUT)
  // =========================
  async redeemReward(userId: string, amount: number, orderId: string) {
    const wallet = await this.getWallet(userId);

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient reward balance');
    }

    wallet.balance -= amount;
    wallet.totalUsed += amount;

    await wallet.save();

    await this.transactionModel.create({
      user: new Types.ObjectId(userId),
      amount,
      type: RewardTransactionType.REDEEM,
      order: new Types.ObjectId(orderId),
      description: 'Reward used during checkout',
    });

    return wallet;
  }

  // =========================
  // CUSTOM TRANSACTION
  // =========================
  async createTransaction(data: {
    user: string;
    amount: number;
    type: RewardTransactionType;
    order: string;
    description: string;
  }) {
    return this.transactionModel.create({
      user: new Types.ObjectId(data.user),
      amount: data.amount,
      type: data.type,
      order: new Types.ObjectId(data.order),
      description: data.description,
    });
  }

  // =========================
  // ALL TRANSACTIONS
  // =========================
  async getAllTransactions() {
    return this.transactionModel
      .find()
      .populate('user', 'phone customerType')
      .populate('order', 'orderNumber totalAmount')
      .sort({ createdAt: -1 });
  }
}