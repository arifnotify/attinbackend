import { Controller, Get, Param } from '@nestjs/common';

import { RewardsService } from './rewards.service';

@Controller('rewards')
export class RewardsController {
  constructor(private readonly rewardsService: RewardsService) {}

  // Wallet

  @Get('wallet/:userId')
  getWallet(
    @Param('userId')
    userId: string,
  ) {
    return this.rewardsService.getBalance(userId);
  }

  // History

  @Get('history/:userId')
  history(
    @Param('userId')
    userId: string,
  ) {
    return this.rewardsService.history(userId);
  }
}
