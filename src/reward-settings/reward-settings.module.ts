import { Module } from '@nestjs/common';

import { MongooseModule } from '@nestjs/mongoose';



import { RewardSettingsController } from './reward-settings.controller';

import { RewardSettingsService } from './reward-settings.service';
import {
  RewardSettings,
  RewardSettingsSchema,
} from './schemas/reward-setting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: RewardSettings.name,
        schema: RewardSettingsSchema,
      },
    ]),
  ],

  controllers: [RewardSettingsController],

  providers: [RewardSettingsService],

  exports: [RewardSettingsService],
})
export class RewardSettingsModule {}