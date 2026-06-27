import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';

import { RewardSettingsService } from './reward-settings.service';

import { CreateRewardSettingsDto } from './dto/create-reward-settings.dto';

import { UpdateRewardSettingsDto } from './dto/update-reward-settings.dto';

@Controller('reward-settings')
export class RewardSettingsController {
  constructor(private readonly rewardSettingsService: RewardSettingsService) {}

  @Post()
  create(
    @Body()
    dto: CreateRewardSettingsDto,
  ) {
    return this.rewardSettingsService.create(dto);
  }

  @Get()
  find() {
    return this.rewardSettingsService.find();
  }

  @Patch(':id')
  update(
    @Param('id') id: string,

    @Body()
    dto: UpdateRewardSettingsDto,
  ) {
    return this.rewardSettingsService.update(id, dto);
  }
}
