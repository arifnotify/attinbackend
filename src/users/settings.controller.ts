import { Body, Controller, Get, Patch, Post } from '@nestjs/common';

import { SettingsService } from './settings.service';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Post()
  create(
    @Body()
    body: {
      premiumAmount: number;
      vipAmount: number;
    },
  ) {
    return this.settingsService.create(body);
  }

  @Get()
  getSettings() {
    return this.settingsService.getSettings();
  }

  @Patch()
  update(
    @Body()
    body: {
      premiumAmount: number;
      vipAmount: number;
    },
  ) {
    return this.settingsService.update(body);
  }
}
