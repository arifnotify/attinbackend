import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { Order, OrderDocument } from './schemas/order.schema';
import { User } from '../users/schemas/user.schema';
import { Cart } from '../cart/schemas/cart.schema';

import {
  RiderLocation,
  RiderLocationDocument,
} from './rider-location/rider-location.schema';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

import { OrderStatus } from './enums/order-status.enum';
import { Address } from 'src/address/schemas/address.schema';

import { RewardsService } from 'src/rewards/rewards.service';
import { CouponsService } from 'src/coupons/coupons.service';
import { UsersService } from 'src/users/users.service';

import { RewardTransactionType } from 'src/rewards/schemas/reward-transaction.schema';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,

    @InjectModel(User.name)
    private userModel: Model<any>,

    @InjectModel(Cart.name)
    private cartModel: Model<any>,

    @InjectModel(Address.name)
    private addressModel: Model<any>,

    @InjectModel(RiderLocation.name)
    private riderLocationModel: Model<RiderLocationDocument>,

    private rewardsService: RewardsService,
    private couponsService: CouponsService,
    private usersService: UsersService,
  ) {}

  // =========================
  // CREATE ORDER
  // =========================
  async createOrder(userId: string, dto: CreateOrderDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    const address = await this.addressModel.findOne({
      _id: dto.shippingAddress,
      user: userId,
    });
    if (!address) throw new NotFoundException('Address not found');

    const cartItems = await this.cartModel.find({ user: userId }).populate('product');
    if (!cartItems.length) throw new NotFoundException('Cart is empty');

    const totalAmount = cartItems.reduce((s, i) => s + i.totalPrice, 0);

    let rewardUsed = 0;
    let couponDiscount = 0;
    let finalAmount = totalAmount;
    let coupon: any = null;

    // reward apply
    if (dto.useReward && dto.rewardAmount) {
      rewardUsed = dto.rewardAmount;
      finalAmount -= rewardUsed;
    }

    // coupon apply
    if (dto.couponCode) {
      coupon = await this.couponsService.validateCoupon(userId, dto.couponCode);
      couponDiscount = coupon.discountAmount;
      finalAmount -= couponDiscount;
    }

    if (finalAmount < 0) finalAmount = 0;

    const items = cartItems.map((item) => ({
      product: item.product._id,
      productName:
        typeof item.product.title === 'object'
          ? item.product.title.en
          : item.product.title,
      productImage: item.product.images?.[0] || '',
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
    }));

    let orderNumber = '';
    let exists = true;

    while (exists) {
      orderNumber = Math.floor(10000000 + Math.random() * 90000000).toString();
      const check = await this.orderModel.findOne({ orderNumber });
      if (!check) exists = false;
    }

    const order = await this.orderModel.create({
      orderNumber,
      user: userId,
      customerPhone: user.phone,
      shippingAddress: address._id,
      items,

      totalAmount,
      rewardUsed,
      couponDiscount,
      finalAmount,
      discountAmount: rewardUsed + couponDiscount,

      paymentMethod: 'COD',
      orderStatus: OrderStatus.PENDING,
      isPaid: false,
      trackingEnabled: false,
    });

    // redeem reward
    if (rewardUsed > 0) {
      await this.rewardsService.redeemReward(
        userId,
        rewardUsed,
        order._id.toString(),
      );
    }

    // mark coupon used
    if (coupon) {
      await this.couponsService.markAsUsed(coupon._id.toString());
    }

    await this.cartModel.deleteMany({ user: userId });

    return order;
  }

  // =========================
  // UPDATE STATUS
  // =========================
  async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');

    const updated = await this.orderModel.findByIdAndUpdate(
      id,
      { orderStatus: dto.orderStatus },
      { new: true },
    );

    // DELIVERY COMPLETE
    if (dto.orderStatus === OrderStatus.DELIVERED) {
      await this.orderModel.findByIdAndUpdate(id, {
        trackingEnabled: false,
        assignedRider: null,
      });

      const user = await this.userModel.findById(order.user);

      const customerType = user?.customerType || 'regular';

      const reward = await this.rewardsService.rewardAfterOrder(
        order.user.toString(),
        customerType,
        order.totalAmount,
        order._id.toString(),
      );

      await this.orderModel.findByIdAndUpdate(order._id, {
        earnedReward: reward || 0,
      });

      await this.usersService.increaseSpentAmount(order.user.toString(), order.totalAmount);
      await this.usersService.increaseOrderCount(order.user.toString());
      await this.usersService.checkCustomerLevel(order.user.toString());
    }

    return updated;
  }

  // =========================
  // RETURN ORDER ITEM
  // =========================
  async returnOrderItem(orderId: string, returnAmount: number) {
    const order = await this.orderModel.findById(orderId);
    if (!order) throw new NotFoundException('Order not found');

    if ((order.returnedAmount || 0) + returnAmount > order.totalAmount) {
      throw new BadRequestException('Invalid return amount');
    }

    order.returnedAmount = (order.returnedAmount || 0) + returnAmount;
    order.refundAmount = (order.refundAmount || 0) + returnAmount;

    await order.save();

    const userId = order.user.toString();
    const wallet = await this.rewardsService.getWallet(userId);

    const ratio = returnAmount / order.totalAmount;
    const deductedReward = (order.earnedReward || 0) * ratio;

    wallet.balance = Math.max(0, wallet.balance - deductedReward);
    wallet.totalEarned = Math.max(0, wallet.totalEarned - deductedReward);

    await wallet.save();

    await this.rewardsService.createTransaction({
      user: userId,
      amount: deductedReward,
      type: RewardTransactionType.DEDUCT,
      order: orderId,
      description: 'Reward reversed due to return',
    });

    return {
      success: true,
      refundedAmount: returnAmount,
      rewardDeducted: deductedReward,
    };
  }

  // ========================= OTHER METHODS =========================
  async getUserOrders(userId: string) {
    return this.orderModel.find({ user: userId }).sort({ createdAt: -1 });
  }

  async getAllOrders() {
    return this.orderModel.find().sort({ createdAt: -1 });
  }

  async getSingleOrder(id: string) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async assignRider(orderId: string, riderId: string) {
    return this.orderModel.findByIdAndUpdate(
      orderId,
      {
        assignedRider: new Types.ObjectId(riderId),
        orderStatus: OrderStatus.OUT_FOR_DELIVERY,
        trackingEnabled: true,
      },
      { new: true },
    );
  }

  async getActiveOrder(userId: string) {
    return this.orderModel.findOne({
      user: userId,
      orderStatus: {
        $in: [
          OrderStatus.PENDING,
          OrderStatus.PROCESSING,
          OrderStatus.OUT_FOR_DELIVERY,
        ],
      },
    });
  }
}