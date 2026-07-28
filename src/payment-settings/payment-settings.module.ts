import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import {
  PaymentSetting,
  PaymentSettingSchema,
} from './schemas/payment-setting.schema';

import { PaymentSettingsService } from './payment-settings.service';
import { PaymentSettingsController } from './payment-settings.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: PaymentSetting.name,
        schema: PaymentSettingSchema,
      },
    ]),
  ],
  controllers: [PaymentSettingsController],
  providers: [PaymentSettingsService],
  exports: [PaymentSettingsService],
})
export class PaymentSettingsModule {}