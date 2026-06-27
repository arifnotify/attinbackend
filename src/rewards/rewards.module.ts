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

import { RewardSettingsModule } from '../reward-settings/reward-settings.module';

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

    RewardSettingsModule,
  ],

  controllers: [RewardsController],

  providers: [RewardsService],

  exports: [RewardsService],
})
export class RewardsModule {}
