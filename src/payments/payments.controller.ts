import { Body, Controller, Post, Res } from '@nestjs/common';
import type { Response } from 'express'; // 🟢 'import type' হিসেবে ইমপোর্ট করা হয়েছে
import { PaymentsService } from './payments.service';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  // ====================================
  // MANUAL SUCCESS (Admin/Internal use)
  // ====================================
  @Post('manual/success')
  async success(@Body() body: any) {
    return this.paymentsService.markSuccess(body.paymentId);
  }

  // ====================================
  // MANUAL FAIL (Admin/Internal use)
  // ====================================
  @Post('manual/fail')
  async fail(@Body() body: any) {
    return this.paymentsService.markFailed(body.paymentId);
  }

  // ====================================
  // MANUAL CANCEL (Admin/Internal use)
  // ====================================
  @Post('manual/cancel')
  async cancel(@Body() body: any) {
    return this.paymentsService.markCancelled(body.paymentId);
  }

  // ====================================
  // SSLCOMMERZ CALLBACK ENDPOINTS
  // ====================================

  @Post('success')
  async sslSuccess(@Body() body: Record<string, any>, @Res() res: Response) {
    await this.paymentsService.handleSuccess(body);

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Success</title>
        </head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;background-color:#f4f6f8;">
          <div style="text-align:center;padding:20px;background:#fff;border-radius:12px;box-shadow:0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color:#2e7d32;margin-bottom:8px;">Payment Successful!</h2>
            <p style="color:#666;">Redirecting to your app...</p>
          </div>
        </body>
      </html>
    `);
  }

  @Post('fail')
  async sslFail(@Body() body: Record<string, any>, @Res() res: Response) {
    await this.paymentsService.handleFail(body);

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Failed</title>
        </head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;background-color:#f4f6f8;">
          <div style="text-align:center;padding:20px;background:#fff;border-radius:12px;box-shadow:0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color:#c62828;margin-bottom:8px;">Payment Failed!</h2>
            <p style="color:#666;">Please try again.</p>
          </div>
        </body>
      </html>
    `);
  }

  @Post('cancel')
  async sslCancel(@Body() body: Record<string, any>, @Res() res: Response) {
    await this.paymentsService.handleCancel(body);

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Payment Cancelled</title>
        </head>
        <body style="display:flex;justify-content:center;align-items:center;height:100vh;margin:0;font-family:sans-serif;background-color:#f4f6f8;">
          <div style="text-align:center;padding:20px;background:#fff;border-radius:12px;box-shadow:0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color:#ef6c00;margin-bottom:8px;">Payment Cancelled</h2>
            <p style="color:#666;">Returning to checkout...</p>
          </div>
        </body>
      </html>
    `);
  }
}
