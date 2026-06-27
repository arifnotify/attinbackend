import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { RewardsService } from './rewards.service';
import { RewardsController } from './rewards.controller';

import { RewardSettingsModule } from 'src/reward-settings/reward-settings.module';
import { CouponsModule } from 'src/coupons/coupons.module';
import {
  RewardWallet,
  RewardWalletSchema,
} from './schemas/reward-wallet.schema';
import {
  RewardTransaction,
  RewardTransactionSchema,
} from './schemas/reward-transaction.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: RewardWallet.name, schema: RewardWalletSchema },
      { name: RewardTransaction.name, schema: RewardTransactionSchema },
    ]),

    RewardSettingsModule,
    CouponsModule, // 🔥 IMPORTANT FIX
  ],

  providers: [RewardsService],
  controllers: [RewardsController],
  exports: [RewardsService],
})
export class RewardsModule {}
