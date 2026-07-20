import { Controller, Post, Body } from '@nestjs/common';

import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('success')
  success(
    @Body() body:any,
  ){
    return this.paymentsService
      .markSuccess(
        body.paymentId,
      );
  }

  @Post('fail')
  fail(
    @Body() body:any,
  ){
    return this.paymentsService
      .markFailed(
        body.paymentId,
      );
  }

  @Post('cancel')
  cancel(
    @Body() body:any,
  ){
    return this.paymentsService
      .markCancelled(
        body.paymentId,
      );
  }
}
