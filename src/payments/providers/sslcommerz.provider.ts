import { Injectable } from '@nestjs/common';

import axios from 'axios';

@Injectable()
export class SSLCommerzProvider {

  async createPayment(data: {
    amount: number;
    orderId: string;
    customerPhone: string;
  }) {

    const url =
      process.env.SSL_IS_LIVE === 'true'
        ? 'https://securepay.sslcommerz.com/gwprocess/v4/api.php'
        : 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php';

    const payload = {

      store_id:
        process.env.SSL_STORE_ID,

      store_passwd:
        process.env.SSL_STORE_PASSWORD,

      total_amount:
        data.amount,

      currency: 'BDT',

      tran_id:
        data.orderId,

      success_url:
        process.env.SSL_SUCCESS_URL,

      fail_url:
        process.env.SSL_FAIL_URL,

      cancel_url:
        process.env.SSL_CANCEL_URL,

      product_name:
        'Ecommerce Order',

      product_category:
        'General',

      product_profile:
        'general',

      cus_name:
        'Customer',

      cus_phone:
        data.customerPhone,

      shipping_method:
        'NO',

      num_of_item: 1,
    };

    const response =
      await axios.post(
        url,
        payload,
      );

    return {
      transactionId:
        data.orderId,

      paymentUrl:
        response.data.GatewayPageURL,
    };
  }
}