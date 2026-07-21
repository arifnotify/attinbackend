import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Payment, PaymentDocument } from './schemas/payment.schema';
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

  // ... [আপনার বাকি createOrderPayment, markSuccess, markFailed ইত্যাদি আগের মতোই থাকবে] ...

  // ====================================
  // SSL SUCCESS (PRODUCTION READY)
  // ====================================
  async handleSuccess(query: any) {
    const transactionId = query.tran_id;

    const payment = await this.paymentModel.findOne({ transactionId });

    if (!payment) {
      return {
        success: false,
        message: 'Payment not found',
      };
    }

    // ডুপ্লিকেট পেমেন্ট প্রসেসিং আটকানোর জন্য
    if (payment.paymentStatus === PaymentStatus.SUCCESS) {
      return {
        success: true,
        message: 'Payment already processed',
      };
    }

    payment.paymentStatus = PaymentStatus.SUCCESS;
    await payment.save();

    const order = await this.orderModel.findById(payment.order);

    if (order) {
      const userId = order.user.toString();

      // ১. অর্ডার স্ট্যাটাস PENDING (অ্যাক্টিভ) এবং isPaid: true করা
      order.isPaid = true;
      order.orderStatus = OrderStatus.PENDING; 
      await order.save();

      // ২. রিওয়ার্ড রিডিম করা
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

      // ৩. কার্ট ক্লিয়ার করা
      await this.cartModel.deleteMany({ user: userId });
      await this.cartService.cacheCart(userId);
    }

    return {
      success: true,
      message: 'Payment Successful',
    };
  }

  // ====================================
  // SSL FAIL
  // ====================================
  async handleFail(query: any) {
    const transactionId = query.tran_id;

    const payment = await this.paymentModel.findOne({ transactionId });

    if (!payment) {
      return {
        success: false,
        message: 'Payment not found',
      };
    }

    payment.paymentStatus = PaymentStatus.FAILED;
    await payment.save();

    // পেমেন্ট ফেইল করলে অর্ডার স্ট্যাটাস CANCELLED করা
    await this.orderModel.findByIdAndUpdate(payment.order, {
      orderStatus: OrderStatus.CANCELLED,
      isPaid: false,
    });

    return {
      success: false,
      message: 'Payment Failed',
    };
  }

  // ====================================
  // SSL CANCEL
  // ====================================
  async handleCancel(query: any) {
    const transactionId = query.tran_id;

    const payment = await this.paymentModel.findOne({ transactionId });

    if (!payment) {
      return {
        success: false,
        message: 'Payment not found',
      };
    }

    payment.paymentStatus = PaymentStatus.CANCELLED;
    await payment.save();

    // পেমেন্ট ক্যানসেল করলে অর্ডার স্ট্যাটাস CANCELLED করা
    await this.orderModel.findByIdAndUpdate(payment.order, {
      orderStatus: OrderStatus.CANCELLED,
      isPaid: false,
    });

    return {
      success: false,
      message: 'Payment Cancelled',
    };
  }
}