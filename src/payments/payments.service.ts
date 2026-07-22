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
  // INITIATE ONLINE PAYMENT
  // ====================================
  async initiateOnlinePayment(data: {
    amount: number;
    transactionId: string;
    customerPhone: string;
    userId: string;
    shippingAddressId: string;
    useReward: boolean;
    rewardAmount: number;
    deliveryCharge: number;
  }) {
    const gatewayResponse = await this.sslProvider.createPayment(data);

    return {
      paymentUrl: gatewayResponse?.paymentUrl || null,
      transactionId: gatewayResponse?.transactionId || null,
    };
  }

  // ====================================
  // CREATE PAYMENT (COD)
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
          transactionId: data.orderId,
          customerPhone: data.customerPhone,
          userId: data.userId,
          shippingAddressId: '',
          useReward: false,
          rewardAmount: 0,
          deliveryCharge: 0,
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
  // SSL SUCCESS HANDLER (পেমেন্ট সফল হলেই কেবল Order ডাটাবেজে তৈরি হবে)
  // ====================================
 // ====================================
  // SSL SUCCESS HANDLER (ফোন নম্বর সহ অর্ডার তৈরি)
  // ====================================
  // ====================================
  // SSL SUCCESS HANDLER (FIXED)
  // ====================================
  async handleSuccess(query: Record<string, any>) {
    try {
      const transactionId = query.tran_id as string;

      const userId = query.value_a as string;
      const shippingAddressId = query.value_b as string;
      const useReward = query.value_c === '1';

      const valueD = (query.value_d as string) || '0_0';
      const [rewardAmountStr, deliveryChargeStr] = valueD.split('_');
      const rewardUsed = parseFloat(rewardAmountStr) || 0;
      const deliveryCharge = parseFloat(deliveryChargeStr) || 0;

      if (!userId) {
        return { success: false, message: 'Invalid payload' };
      }

      // 🎯 ১. সরাসরি orderModel / userModel থেকে ইউজার তথ্য রিড করা
      const user = await this.userModel.findById(userId);

      // ২. কার্ট চেক করা
      const cartItems = await this.cartModel
        .find({ user: userId })
        .populate('product');

      if (!cartItems.length) {
        return {
          success: false,
          message: 'Cart empty or order already processed',
        };
      }

      // ৩. অ্যামাউন্ট ক্যালকুলেশন
      const subTotal = cartItems.reduce(
        (sum, item: any) => sum + (item.price || 0) * (item.quantity || 1),
        0,
      );
      const totalAmount = subTotal + deliveryCharge;
      const finalAmount = Math.max(0, totalAmount - rewardUsed);

      // ৪. ইউনিক অর্ডার নম্বর
      let orderNumber = '';
      let exists = true;
      while (exists) {
        orderNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
        const check = await this.orderModel.findOne({ orderNumber });
        if (!check) exists = false;
      }

      const items = cartItems.map((item: any) => ({
        product: item.product._id,
        productName: item.product.title?.en,
        productImage: item.product.images?.[0] || '',
        quantity: item.quantity || 1,
        price: item.price || 0,
        totalPrice: (item.price || 0) * (item.quantity || 1),
      }));

      // 🟢 ৫. ডাটাবেজে Order তৈরি (ফোন নম্বর সহ)
      const order = await this.orderModel.create({
        orderNumber,
        user: userId,
        customerPhone: user?.phone || query.cus_phone || '', // 🎯 সেফটি ব্যাকআপ সহ ফোন নম্বর
        shippingAddress: shippingAddressId,
        items,
        subTotal,
        deliveryCharge,
        rewardUsed,
        discountAmount: rewardUsed,
        totalAmount,
        finalAmount,
        paymentMethod: PaymentMethod.SSLCOMMERZ,
        orderStatus: OrderStatus.PENDING,
        isPaid: true,
        trackingEnabled: false,
      });

      // ৬. Payment Schema তে রেকর্ড
      await this.paymentModel.create({
        user: new Types.ObjectId(userId),
        order: order._id,
        amount: finalAmount,
        paymentMethod: PaymentMethod.SSLCOMMERZ,
        paymentStatus: PaymentStatus.SUCCESS,
        transactionId: transactionId,
      });

      // ৭. রিওয়ার্ড কাটা
      if (useReward && rewardUsed > 0) {
        await this.rewardsService.redeemReward(
          userId,
          rewardUsed,
          (order._id as Types.ObjectId).toString(),
        );
        await this.usersService.increaseRewardUsed(userId, rewardUsed);
      }

      // ৮. কার্ট ক্লিয়ার
      await this.cartModel.deleteMany({ user: userId });
      await this.cartService.cacheCart(userId);

      return { success: true, message: 'Order created and payment successful' };
    } catch (error) {
      console.error('SSL Success Error:', error);
      throw error;
    }
  }
  // ====================================
  // SSL FAIL HANDLER (কোনো অর্ডার ডিলিট করারও দরকার নেই, কারণ তৈরিই হয়নি)
  // ====================================
  async handleFail(query: Record<string, any>) {
    return { success: false, message: 'Payment Failed. No order created.' };
  }

  // ====================================
  // SSL CANCEL HANDLER
  // ====================================
  async handleCancel(query: Record<string, any>) {
    return { success: false, message: 'Payment Cancelled. No order created.' };
  }

  // ====================================
  // MARK SUCCESS (Manual / Admin)
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

  async getPayment(id: string) {
    return this.paymentModel
      .findById(id)
      .populate('user')
      .populate('order');
  }

  async getAllPayments() {
    return this.paymentModel
      .find()
      .populate('user')
      .populate('order')
      .sort({ createdAt: -1 });
  }

  async getUserPayments(userId: string) {
    return this.paymentModel
      .find({ user: userId })
      .populate('order')
      .sort({ createdAt: -1 });
  }
}
