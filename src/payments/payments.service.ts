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
  // SSL SUCCESS HANDLER (FIXED WITH PAYMENT ID LINKING)
  // ====================================
  // ====================================
  // SSL SUCCESS HANDLER (FIXED ORDER OF CREATION)
  // ====================================
// ====================================
  // SSL SUCCESS HANDLER (FIXED VARIABLE ORDER)
  // ====================================
  async handleSuccess(query: Record<string, any>) {
    const transactionId = query.tran_id as string;

    // value_a থেকে userId এবং customerPhone আলাদা করে নেওয়া হচ্ছে
    const rawValueA = (query.value_a as string) || '';
    const [userId, customerPhoneFromPayload] = rawValueA.split('|');

    const shippingAddressId = query.value_b as string;
    const useReward = query.value_c === '1';

    const valueD = (query.value_d as string) || '0_0';
    const [rewardAmountStr, deliveryChargeStr] = valueD.split('_');
    const rewardUsed = parseFloat(rewardAmountStr) || 0;
    const deliveryCharge = parseFloat(deliveryChargeStr) || 0;

    if (!userId) {
      return { success: false, message: 'Invalid payload' };
    }

    // ১. কার্ট থেকে আইটেম রিড করা
    const cartItems = await this.cartModel
      .find({ user: userId })
      .populate('product');

    if (!cartItems.length) {
      return {
        success: false,
        message: 'Cart empty or order already processed',
      };
    }

    // ২. টোটাল অ্যামাউন্ট হিসাব
    const subTotal = cartItems.reduce(
      (sum, item: any) => sum + (item.price || 0) * (item.quantity || 1),
      0,
    );
    const totalAmount = subTotal + deliveryCharge;
    const finalAmount = Math.max(0, totalAmount - rewardUsed);

    // ৩. ইউনিক অর্ডার নম্বর জেনারেট
    let orderNumber = '';
    let exists = true;
    while (exists) {
      orderNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
      const check = await this.orderModel.findOne({ orderNumber });
      if (!check) exists = false;
    }

    const items = cartItems.map((item: any) => ({
      product: item.product._id,
      productName: {
        en: item.product.title?.en || '',
        bn: item.product.title?.bn || '',
      },
      unit: item.product.unit || 'pcs',
      productImage: item.product.images?.[0] || '',
      quantity: item.quantity || 1,
      price: item.price || 0,
      totalPrice: (item.price || 0) * (item.quantity || 1),
    }));

    // 🟢 ৪. প্রথমে পেমেন্ট মডেল তৈরি করা হচ্ছে (অর্ডার আইডি ছাড়া বা টেম্পোরারি নাল রেখে)
    // নোট: আপনার Payment Schema-তে `order` ফিল্ডটি যদি required: true থাকে, 
    // তবে সাময়িকভাবে `required: false` করে নিতে পারেন অথবা নিচে order ফিল্ড বাদ দিতে পারেন।
    const payment = await this.paymentModel.create({
      user: new Types.ObjectId(userId),
      amount: finalAmount,
      paymentMethod: PaymentMethod.SSLCOMMERZ,
      paymentStatus: PaymentStatus.SUCCESS,
      transactionId: transactionId,
    });

    // 🟢 ৫. এখন অর্ডার তৈরি করা হচ্ছে এবং পেমেন্ট আইডি ও সঠিক ObjectId ফরম্যাটে shippingAddress পাস করা হচ্ছে
    const order = await this.orderModel.create({
      orderNumber,
      user: new Types.ObjectId(userId),
      customerPhone: customerPhoneFromPayload || query.cus_phone || '',
      shippingAddress: new Types.ObjectId(shippingAddressId), // 🎯 সঠিক অবজেক্ট আইডি ফরম্যাট
      items,
      subTotal,
      deliveryCharge,
      rewardUsed,
      discountAmount: rewardUsed,
      totalAmount,
      finalAmount,
      paymentMethod: PaymentMethod.SSLCOMMERZ,
      payment: payment._id, // 🎯 এখানে পেমেন্ট আইডি সঠিকভাবে যুক্ত হলো
      orderStatus: OrderStatus.PENDING,
      isPaid: true,
      trackingEnabled: false,
    });

    // 🟢 ৬. পেমেন্টের ভেতরে অর্ডার আইডি আপডেট করে দেওয়া
    payment.order = order._id as any;
    await payment.save();

    // ৭. রিওয়ার্ড ওয়ালেট আপডেট
    if (useReward && rewardUsed > 0) {
      await this.rewardsService.redeemReward(
        userId,
        rewardUsed,
        (order._id as Types.ObjectId).toString(),
      );
      await this.usersService.increaseRewardUsed(userId, rewardUsed);
    }

    // ৮. কার্ট ক্লিয়ার
    await this.cartModel.deleteMany({ user: userId });
    await this.cartService.cacheCart(userId);

    return { success: true, message: 'Order created and payment successful' };
  }
  // ====================================
  // SSL FAIL HANDLER
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
