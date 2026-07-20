import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model, Types } from 'mongoose';

import { Payment, PaymentDocument } from './schemas/payment.schema';

import { PaymentMethod } from './enums/payment-method.enum';

import { PaymentStatus } from './enums/payment-status.enum';

import { CodProvider } from './providers/cod.provider';

import { SSLCommerzProvider } from './providers/sslcommerz.provider';
import { Order } from '../orders/schemas/order.schema';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,

    private readonly codProvider: CodProvider,

    private readonly sslProvider: SSLCommerzProvider,

    @InjectModel(Order.name) private orderModel: Model<any>,
  ) {}

  // ====================================
  // CREATE PAYMENT
  // ====================================

  async createOrderPayment(data: {
    userId: string;
    orderId: string;
    amount: number;
    paymentMethod: PaymentMethod;
  }) {
    let gatewayResponse: any;

    switch (data.paymentMethod) {
      case PaymentMethod.COD:

        gatewayResponse =
          await this.codProvider.createPayment();

        break;

      case PaymentMethod.SSLCOMMERZ:

        gatewayResponse =
          await this.sslProvider.createPayment();

        break;

      default:

        gatewayResponse =
          await this.codProvider.createPayment();
    }

    const payment =
      await this.paymentModel.create({
        user: new Types.ObjectId(
          data.userId,
        ),

        order: new Types.ObjectId(
          data.orderId,
        ),

        amount: data.amount,

        paymentMethod:
          data.paymentMethod,

        paymentStatus:
          PaymentStatus.PENDING,

        transactionId:
          gatewayResponse?.transactionId ||
          null,

        paymentUrl:
          gatewayResponse?.paymentUrl ||
          null,
      });

    return payment;
  }

  // ====================================
  // PAYMENT SUCCESS
  // ====================================

async markSuccess(paymentId: string) {

  const payment =
  await this.paymentModel
  .findByIdAndUpdate(
    paymentId,
    {
      paymentStatus:
      PaymentStatus.SUCCESS,
    },
    {
      new:true,
    },
  );

  if(payment){

    await this.orderModel
    .findByIdAndUpdate(
      payment.order,
      {
        isPaid:true,
      },
    );

  }

  return payment;
}

  // ====================================
  // PAYMENT FAILED
  // ====================================

  async markFailed(paymentId: string) {
    return this.paymentModel.findByIdAndUpdate(
      paymentId,
      {
        paymentStatus:
          PaymentStatus.FAILED,
      },
      {
        new: true,
      },
    );
  }

  // ====================================
  // PAYMENT CANCELLED
  // ====================================

async markCancelled(
  paymentId:string,
){

  const payment =
  await this.paymentModel
  .findByIdAndUpdate(
    paymentId,
    {
      paymentStatus:
      PaymentStatus.CANCELLED,
    },
    {
      new:true,
    },
  );

  if(payment){

    await this.orderModel
    .findByIdAndUpdate(
      payment.order,
      {
        isPaid:false,
      },
    );

  }

  return payment;
}

  // ====================================
  // GET SINGLE PAYMENT
  // ====================================

  async getPayment(id: string) {
    return this.paymentModel
      .findById(id)
      .populate('user')
      .populate('order');
  }

  // ====================================
  // GET ALL PAYMENTS
  // ====================================

  async getAllPayments() {
    return this.paymentModel
      .find()
      .populate('user')
      .populate('order')
      .sort({
        createdAt: -1,
      });
  }

  // ====================================
  // GET USER PAYMENTS
  // ====================================

  async getUserPayments(
    userId: string,
  ) {
    return this.paymentModel
      .find({
        user: userId,
      })
      .populate('order')
      .sort({
        createdAt: -1,
      });
  }
}