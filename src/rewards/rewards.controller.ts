import { Controller, Get, Param } from '@nestjs/common';
import { RewardsService } from './rewards.service';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // =========================
  // ADMIN WALLET LIST
  // =========================
  @Get('admin/wallets')
  getAllWallets() {
    return this.rewardsService.getAllWallets();
  }

  // =========================
  // ADMIN TRANSACTIONS
  // =========================
  @Get('admin/transactions')
  getAllTransactions() {
    return this.rewardsService.getAllTransactions();
  }

  // =========================
  // USER WALLET
  // =========================
  @Get('wallet/:userId')
  getWallet(@Param('userId') userId: string) {
    return this.rewardsService.getWallet(userId);
  }

  // =========================
  // USER HISTORY
  // =========================
  @Get('history/:userId')
  history(@Param('userId') userId: string) {
    return this.rewardsService.history(userId);
  }
}
