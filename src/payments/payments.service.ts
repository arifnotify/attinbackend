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
  // INITIATE ONLINE PAYMENT (For OrdersService Build Fix)
  // ====================================
  async initiateOnlinePayment(data: {
    userId: string;
    amount: number;
    customerPhone: string;
  }) {
    const tempOrderId = new Types.ObjectId().toString();

    const gatewayResponse = await this.sslProvider.createPayment({
      amount: data.amount,
      orderId: tempOrderId,
      customerPhone: data.customerPhone,
    });

    return {
      paymentUrl: gatewayResponse?.paymentUrl || null,
      transactionId: gatewayResponse?.transactionId || null,
    };
  }

  // ====================================
  // CREATE PAYMENT (For COD / Direct Payment)
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
  // SSL SUCCESS HANDLER (پেমেন্ট সফল হলে অর্ডার এক্টিভ, রিওয়ার্ড কাটবে ও কার্ট ক্লিয়ার হবে)
  // ====================================
  // ====================================
  // SSL SUCCESS HANDLER
  // ====================================
// payments.service.ts

async handleSuccess(query: Record<string, any>) {
  const transactionId = query.tran_id as string;

  // SSLCommerz থেকে পাওয়া কাস্টম ভ্যালুগুলো রিড করা
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

  // ১. ইউজার কার্ট থেকে আইটেমগুলো নিয়ে আসা
  const cartItems = await this.cartModel.find({ user: userId }).populate('product');
  if (!cartItems.length) {
    return { success: false, message: 'Cart empty or order already processed' };
  }

  // ২. সাবটোটাল ও টোটাল হিসাব করা
  const subTotal = cartItems.reduce((sum, item: any) => sum + (item.price || 0) * (item.quantity || 1), 0);
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
    productName: item.product.title?.en,
    productImage: item.product.images?.[0] || '',
    quantity: item.quantity || 1,
    price: item.price || 0,
    totalPrice: (item.price || 0) * (item.quantity || 1),
  }));

  // 🟢 ৪. পেমেন্ট সাকসেস হয়েছে! এখন ডাটাবেজে Order তৈরি হবে (isPaid: true)
  const order = await this.orderModel.create({
    orderNumber,
    user: userId,
    shippingAddress: shippingAddressId,
    items,
    subTotal,
    deliveryCharge,
    rewardUsed,
    discountAmount: rewardUsed,
    totalAmount,
    finalAmount,
    paymentMethod: 'SSLCOMMERZ',
    orderStatus: OrderStatus.PENDING,
    isPaid: true, // 🎯 সরাসরি PAID হয়ে ক্রিয়েট হবে
    trackingEnabled: false,
  });

  // ৫. পেমেন্ট রেকর্ড তৈরি
  await this.paymentModel.create({
    user: new Types.ObjectId(userId),
    order: order._id,
    amount: finalAmount,
    paymentMethod: PaymentMethod.SSLCOMMERZ,
    paymentStatus: PaymentStatus.SUCCESS,
    transactionId: transactionId,
  });

  // ৬. রিওয়ার্ড পয়েন্ট কাটা
  if (useReward && rewardUsed > 0) {
    await this.rewardsService.redeemReward(userId, rewardUsed, order._id.toString());
    await this.usersService.increaseRewardUsed(userId, rewardUsed);
  }

  // ৭. কার্ট খালি করা
  await this.cartModel.deleteMany({ user: userId });
  await this.cartService.cacheCart(userId);

  return { success: true, message: 'Order created and payment successful' };
}

async handleFail(query: Record<string, any>) {
  // পেমেন্ট ফেইল হলে ব্যাকএন্ডে কিছু করার প্রয়োজন নেই কারণ অর্ডার তৈরিই হয়নি!
  return { success: false, message: 'Payment Failed. No order created.' };
}

async handleCancel(query: Record<string, any>) {
  // ক্যানসেল করলেও ব্যাকএন্ডে কোনো অর্ডার ডিলিট বা ক্যানসেল করার দরকার নেই, কার্ট আগের মতোই থাকবে!
  return { success: false, message: 'Payment Cancelled. No order created.' };
}
}
