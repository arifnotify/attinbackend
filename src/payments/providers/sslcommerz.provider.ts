import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as qs from 'qs';

@Injectable()
export class SSLCommerzProvider {
  async createPayment(data: {
    amount: number;
    orderId: string;
    customerPhone: string;
  }) {
    try {
      const isLive = process.env.SSL_IS_LIVE === 'true';

      const url = isLive
          ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
          : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

      const payload = {
        store_id: process.env.SSL_STORE_ID,
        store_passwd: process.env.SSL_STORE_PASSWORD,

        total_amount: data.amount,
        currency: 'BDT',

        tran_id: data.orderId,

        success_url: process.env.SSL_SUCCESS_URL,
        fail_url: process.env.SSL_FAIL_URL,
        cancel_url: process.env.SSL_CANCEL_URL,

        ipn_url: process.env.SSL_IPN_URL,

        shipping_method: 'NO',

        product_name: 'Ecommerce Order',
        product_category: 'General',
        product_profile: 'general',

        cus_name: 'Customer',
        cus_email: 'customer@example.com',
        cus_add1: 'Bangladesh',
        cus_city: 'Dhaka',
        cus_country: 'Bangladesh',
        cus_phone: data.customerPhone,

        value_a: data.orderId,
      };

      const response = await axios.post(
        url,
        qs.stringify(payload),
        {
          headers: {
            'Content-Type':
                'application/x-www-form-urlencoded',
          },
        },
      );

      if (
        response.data.status !== 'SUCCESS' ||
        !response.data.GatewayPageURL
      ) {
        throw new BadRequestException(
          response.data.failedreason ||
              'SSLCommerz Session Failed',
        );
      }

      return {
        transactionId: data.orderId,
        paymentUrl: response.data.GatewayPageURL,
        sessionKey: response.data.sessionkey,
      };
    } catch (e: any) {
      console.log(
        'SSL Error:',
        e.response?.data || e.message,
      );

      throw new BadRequestException(
        'Unable to create SSL payment session',
      );
    }
  }
}