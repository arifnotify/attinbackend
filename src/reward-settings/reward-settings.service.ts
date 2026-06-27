import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { CreateRewardSettingsDto } from './dto/create-reward-settings.dto';

import { UpdateRewardSettingsDto } from './dto/update-reward-settings.dto';
import {
  RewardSettings,
  RewardSettingsDocument,
} from './schemas/reward-setting.schema';

@Injectable()
export class RewardSettingsService {
  constructor(
    @InjectModel(RewardSettings.name)
    private rewardSettingsModel: Model<RewardSettingsDocument>,
  ) {}

  // CREATE
  async create(dto: CreateRewardSettingsDto) {
    const exists = await this.rewardSettingsModel.findOne();

    if (exists) {
      throw new Error('Reward settings already exist.');
    }

    return this.rewardSettingsModel.create(dto);
  }

  // GET

  async find() {
    return this.rewardSettingsModel.findOne();
  }

  // UPDATE

  async update(id: string, dto: UpdateRewardSettingsDto) {
    const settings = await this.rewardSettingsModel.findByIdAndUpdate(id, dto, {
      new: true,
    });

    if (!settings) {
      throw new NotFoundException('Reward settings not found');
    }

    return settings;
  }

  // GET SETTINGS

  async getSettings() {
    return this.rewardSettingsModel.findOne();
  }
}
