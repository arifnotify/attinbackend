import { Injectable, BadRequestException } from '@nestjs/common';
import axios from 'axios';
import * as qs from 'qs';

@Injectable()
export class SSLCommerzProvider {
  async createPayment(data: {
    amount: number;
    transactionId: string;
    customerPhone: string;
    userId: string;
    shippingAddressId: string;
    useReward: boolean;
    rewardAmount: number;
    deliveryCharge: number;
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

        tran_id: data.transactionId,

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

        // 🎯 পেমেন্ট সফল হলে অর্ডার তৈরি করার জন্য কাস্টম ডেটা পাস করা
        value_a: data.userId,
        value_b: data.shippingAddressId,
        value_c: data.useReward ? '1' : '0',
        value_d: `${data.rewardAmount}_${data.deliveryCharge}`,
      };

      const response = await axios.post(
        url,
        qs.stringify(payload),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        },
      );

      if (
        response.data.status !== 'SUCCESS' ||
        !response.data.GatewayPageURL
      ) {
        throw new BadRequestException(
          response.data.failedreason || 'SSLCommerz Session Failed',
        );
      }

      return {
        transactionId: data.transactionId,
        paymentUrl: response.data.GatewayPageURL,
        sessionKey: response.data.sessionkey,
      };
    } catch (e: any) {
      console.log('SSL Error:', e.response?.data || e.message);
      throw new BadRequestException('Unable to create SSL payment session');
    }
  }
}
