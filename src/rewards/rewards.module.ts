import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';

import {
  RewardWallet,
  RewardWalletSchema,
} from './schemas/reward-wallet.schema';

import {
  RewardTransaction,
  RewardTransactionSchema,
} from './schemas/reward-transaction.schema';

import { RewardsController } from './rewards.controller';

import { RewardsService } from './rewards.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RewardWallet.name,
        schema: RewardWalletSchema,
      },

      {
        name: RewardTransaction.name,
        schema: RewardTransactionSchema,
      },
    ]),
  ],

  controllers: [RewardsController],

  providers: [RewardsService],

  exports: [RewardsService],
})
export class RewardsModule {}
