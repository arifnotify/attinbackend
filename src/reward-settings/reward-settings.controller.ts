import { Body, Controller, Get, Post, Patch } from '@nestjs/common';
import { RewardSettingsService } from './reward-settings.service';
import { CreateRewardSettingsDto } from './dto/create-reward-settings.dto';
import { UpdateRewardSettingsDto } from './dto/update-reward-settings.dto';

@Controller('reward-settings')
export class RewardSettingsController {
  constructor(private readonly rewardSettingsService: RewardSettingsService) {}

  // CREATE (admin only once)
  @Post()
  create(@Body() dto: CreateRewardSettingsDto) {
    return this.rewardSettingsService.create(dto);
  }

  // GET (admin + system)
  @Get()
  getSettings() {
    return this.rewardSettingsService.getSettings();
  }

  // UPDATE (FIXED - NO ID)
  @Patch()
  update(@Body() dto: UpdateRewardSettingsDto) {
    return this.rewardSettingsService.update(dto);
  }
}