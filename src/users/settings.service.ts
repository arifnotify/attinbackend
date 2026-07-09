import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';
import { Setting, SettingDocument } from './schemas/settings.schema';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name)
    private settingModel: Model<SettingDocument>,
  ) {}

  // CREATE
  async create(data: { premiumAmount: number; vipAmount: number }) {
    const exists = await this.settingModel.findOne();

    if (exists) {
      throw new Error('Settings already exists');
    }

    return this.settingModel.create(data);
  }

  // GET
  async getSettings() {
    return this.settingModel.findOne();
  }

  // UPDATE
  async update(data: { premiumAmount: number; vipAmount: number }) {
    const settings = await this.settingModel.findOne();

    if (!settings) {
      throw new NotFoundException('Settings not found');
    }

    settings.premiumAmount = data.premiumAmount;

    settings.vipAmount = data.vipAmount;

    await settings.save();

    return settings;
  }
}
