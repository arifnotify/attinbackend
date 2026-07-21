import { Body, Controller, Post } from '@nestjs/common';

import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
  ) {}

  // ====================================
  // MANUAL SUCCESS
  // ====================================

  @Post('success')
  async success(
    @Body() body: any,
  ) {
    return this.paymentsService.markSuccess(
      body.paymentId,
    );
  }

  // ====================================
  // MANUAL FAIL
  // ====================================

  @Post('fail')
  async fail(
    @Body() body: any,
  ) {
    return this.paymentsService.markFailed(
      body.paymentId,
    );
  }

  // ====================================
  // MANUAL CANCEL
  // ====================================

  @Post('cancel')
  async cancel(
    @Body() body: any,
  ) {
    return this.paymentsService.markCancelled(
      body.paymentId,
    );
  }

  // ====================================
  // SSL SUCCESS CALLBACK
  // ====================================

  @Post('ssl/success')
  async sslSuccess(
    @Body() body: any,
  ) {
    return this.paymentsService.handleSuccess(
      body,
    );
  }

  // ====================================
  // SSL FAIL CALLBACK
  // ====================================

  @Post('ssl/fail')
  async sslFail(
    @Body() body: any,
  ) {
    return this.paymentsService.handleFail(
      body,
    );
  }

  // ====================================
  // SSL CANCEL CALLBACK
  // ====================================

  @Post('ssl/cancel')
  async sslCancel(
    @Body() body: any,
  ) {
    return this.paymentsService.handleCancel(
      body,
    );
  }
}