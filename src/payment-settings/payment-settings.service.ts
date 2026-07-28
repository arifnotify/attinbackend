import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import {
  PaymentSetting,
  PaymentSettingDocument,
} from './schemas/payment-setting.schema';
import { Model } from 'mongoose';

@Injectable()
export class PaymentSettingsService {
  constructor(
    @InjectModel(PaymentSetting.name)
    private paymentSettingModel: Model<PaymentSettingDocument>,
  ) {}

  async getSettings() {
    let settings = await this.paymentSettingModel.findOne();

    if (!settings) {
      settings = await this.paymentSettingModel.create({
        codEnabled: true,
        sslcommerzEnabled: true,
      });
    }

    return settings;
  }

  async updateSettings(data: {
    codEnabled: boolean;
    sslcommerzEnabled: boolean;
  }) {
    let settings = await this.paymentSettingModel.findOne();

    if (!settings) {
      settings = await this.paymentSettingModel.create(data);
    } else {
      settings.codEnabled = data.codEnabled;

      settings.sslcommerzEnabled = data.sslcommerzEnabled;

      await settings.save();
    }

    return settings;
  }
}
