import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  RewardSettings,
  RewardSettingsDocument,
} from './schemas/reward-setting.schema';
import { CreateRewardSettingsDto } from './dto/create-reward-settings.dto';
import { UpdateRewardSettingsDto } from './dto/update-reward-settings.dto';

@Injectable()
export class RewardSettingsService {
  constructor(
    @InjectModel(RewardSettings.name)
    private rewardSettingsModel: Model<RewardSettingsDocument>,
  ) {}

  // CREATE (ONLY ONCE)
  async create(dto: CreateRewardSettingsDto) {
    const exists = await this.rewardSettingsModel.findOne();

    if (exists) {
      throw new BadRequestException('Reward settings already exist');
    }

    return this.rewardSettingsModel.create(dto);
  }

  // GET SETTINGS
  async getSettings() {
    return this.rewardSettingsModel.findOne();
  }

  // UPDATE (SINGLETON FIX)
  async update(dto: UpdateRewardSettingsDto) {
    const settings = await this.rewardSettingsModel.findOne();

    if (!settings) {
      throw new NotFoundException('Reward settings not found');
    }

    return this.rewardSettingsModel.findByIdAndUpdate(
      settings._id,
      dto,
      { new: true },
    );
  }
}