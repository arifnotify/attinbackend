import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
import { PaymentMethod } from './enums/payment-method.enum';
import { PaymentStatus } from './enums/payment-status.enum';
import { CodProvider } from './providers/cod.provider';
import { SSLCommerzProvider } from './providers/sslcommerz.provider';
import { Order } from '../orders/schemas/order.schema';
import { OrderStatus } from '../orders/enums/order-status.enum';
import { Cart } from '../cart/schemas/cart.schema';
import { RewardsService } from 'src/rewards/rewards.service';
import { UsersService } from 'src/users/users.service';
import { CartService } from 'src/cart/cart.service';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectModel(Payment.name)
    private paymentModel: Model<PaymentDocument>,

    private readonly codProvider: CodProvider,
    private readonly sslProvider: SSLCommerzProvider,

    @InjectModel(Order.name) 
    private orderModel: Model<any>,

    @InjectModel(Cart.name)
    private cartModel: Model<any>,

    private readonly rewardsService: RewardsService,
    private readonly usersService: UsersService,
    private readonly cartService: CartService,
  ) {}

  // ====================================
  // CREATE PAYMENT
  // ====================================
  async createOrderPayment(data: {
    userId: string;
    orderId: string;
    amount: number;
    paymentMethod: PaymentMethod;
    customerPhone: string;
  }) {
    let gatewayResponse: any;

    switch (data.paymentMethod) {
      case PaymentMethod.COD:
        gatewayResponse = await this.codProvider.createPayment();
        break;

      case PaymentMethod.SSLCOMMERZ:
        gatewayResponse = await this.sslProvider.createPayment({
          amount: data.amount,
          orderId: data.orderId,
          customerPhone: data.customerPhone,
        });
        break;

      default:
        gatewayResponse = await this.codProvider.createPayment();
    }

    const payment = await this.paymentModel.create({
      user: new Types.ObjectId(data.userId),
      order: new Types.ObjectId(data.orderId),
      amount: data.amount,
      paymentMethod: data.paymentMethod,
      paymentStatus: PaymentStatus.PENDING,
      transactionId: gatewayResponse?.transactionId || null,
      paymentUrl: gatewayResponse?.paymentUrl || null,
    });

    return payment;
  }

  // ====================================
  // MARK SUCCESS
  // ====================================
  async markSuccess(paymentId: string) {
    const payment = await this.paymentModel.findByIdAndUpdate(
      paymentId,
      { paymentStatus: PaymentStatus.SUCCESS },
      { new: true },
    );

    if (payment) {
      await this.orderModel.findByIdAndUpdate(payment.order, {
        isPaid: true,
        orderStatus: OrderStatus.PENDING,
      });
    }

    return payment;
  }

  // ====================================
  // MARK FAILED
  // ====================================
  async markFailed(paymentId: string) {
    return this.paymentModel.findByIdAndUpdate(
      paymentId,
      { paymentStatus: PaymentStatus.FAILED },
      { new: true },
    );
  }

  // ====================================
  // MARK CANCELLED
  // ====================================
  async markCancelled(paymentId: string) {
    const payment = await this.paymentModel.findByIdAndUpdate(
      paymentId,
      { paymentStatus: PaymentStatus.CANCELLED },
      { new: true },
    );

    if (payment) {
      await this.orderModel.findByIdAndUpdate(payment.order, {
        isPaid: false,
        orderStatus: OrderStatus.CANCELLED,
      });
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
      .sort({ createdAt: -1 });
  }

  // ====================================
  // GET USER PAYMENTS
  // ====================================
  async getUserPayments(userId: string) {
    return this.paymentModel
      .find({ user: userId })
      .populate('order')
      .sort({ createdAt: -1 });
  }

  // ====================================
  // SSL SUCCESS HANDLER (পেমেন্ট সফল হলে অর্ডার এক্টিভ হবে)
  // ====================================
  async handleSuccess(query: any) {
    const transactionId = query.tran_id;
    const payment = await this.paymentModel.findOne({ transactionId });

    if (!payment) {
      return { success: false, message: 'Payment not found' };
    }

    if (payment.paymentStatus === PaymentStatus.SUCCESS) {
      return { success: true, message: 'Payment already processed' };
    }

    payment.paymentStatus = PaymentStatus.SUCCESS;
    await payment.save();

    const order = await this.orderModel.findById(payment.order);

    if (order) {
      const userId = order.user.toString();

      order.isPaid = true;
      order.orderStatus = OrderStatus.PENDING;
      await order.save();

      // পেমেন্ট সফল হওয়ার পরই কেবল রিওয়ার্ড কাটা হবে
      if (order.rewardUsed > 0) {
        await this.rewardsService.redeemReward(
          userId,
          order.rewardUsed,
          order._id.toString(),
        );

        await this.usersService.increaseRewardUsed(
          userId,
          order.rewardUsed,
        );
      }

      // পেমেন্ট সফল হওয়ার পরই কেবল কার্ট ডিলিট হবে
      await this.cartModel.deleteMany({ user: userId });
      await this.cartService.cacheCart(userId);
    }

    return { success: true, message: 'Payment Successful' };
  }

  // ====================================
  // SSL FAIL HANDLER (পেমেন্ট ফেইল করলে DB থেকে অর্ডার ডিলিট)
  // ====================================
  async handleFail(query: any) {
    const transactionId = query.tran_id;
    const payment = await this.paymentModel.findOne({ transactionId });

    if (payment) {
      payment.paymentStatus = PaymentStatus.FAILED;
      await payment.save();

      // 🔴 পেমেন্ট ফেইল হলে ব্যাকএন্ড থেকে আনপেইড অর্ডারটি সম্পূর্ণ ডিলিট করে দেওয়া
      await this.orderModel.findByIdAndDelete(payment.order);
    }

    return { success: false, message: 'Payment Failed' };
  }

  // ====================================
  // SSL CANCEL HANDLER (পেমেন্ট ক্যানসেল করলে DB থেকে অর্ডার ডিলিট)
  // ====================================
  async handleCancel(query: any) {
    const transactionId = query.tran_id;
    const payment = await this.paymentModel.findOne({ transactionId });

    if (payment) {
      payment.paymentStatus = PaymentStatus.CANCELLED;
      await payment.save();

      // 🔴 ইউজার ক্যানসেল করলে ব্যাকএন্ড থেকে আনপেইড অর্ডারটি সম্পূর্ণ ডিলিট করে দেওয়া
      await this.orderModel.findByIdAndDelete(payment.order);
    }

    return { success: false, message: 'Payment Cancelled' };
  }
}