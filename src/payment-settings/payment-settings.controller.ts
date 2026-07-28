import { Controller, Get, Patch, Body } from '@nestjs/common';

import { PaymentSettingsService } from './payment-settings.service';

@Controller('payment-settings')
export class PaymentSettingsController {
  constructor(
    private readonly paymentSettingsService: PaymentSettingsService,
  ) {}

  @Get()
  getSettings() {
    return this.paymentSettingsService.getSettings();
  }

  @Patch()
  updateSettings(
    @Body()
    body: {
      codEnabled: boolean;
      sslcommerzEnabled: boolean;
    },
  ) {
    return this.paymentSettingsService.updateSettings(body);
  }
}
