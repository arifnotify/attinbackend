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

@Injectable()
export class RewardsService {
  constructor(
    @InjectModel(RewardWallet.name)
    private walletModel: Model<RewardWalletDocument>,

    @InjectModel(RewardTransaction.name)
    private transactionModel: Model<RewardTransactionDocument>,
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
}
