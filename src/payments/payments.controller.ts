import { Controller, Get, Query } from '@nestjs/common';

import { PaymentsService }
from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly service: PaymentsService) {}

  @Get('success')
  success(@Query() query: any) {
    return this.service.handleSuccess(query);
  }

  @Get('fail')
  fail(@Query() query: any) {
    return this.service.handleFail(query);
  }

  @Get('cancel')
  cancel(@Query() query: any) {
    return this.service.handleCancel(query);
  }
}
