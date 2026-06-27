import { Injectable, NotFoundException } from '@nestjs/common';
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

  if (!user) {
    throw new NotFoundException('User not found');
  }

  const address = await this.addressModel.findOne({
    _id: dto.shippingAddress,
    user: userId,
  });

  if (!address) {
    throw new NotFoundException('Address not found');
  }

  const cartItems = await this.cartModel
    .find({ user: userId })
    .populate('product');

  if (!cartItems.length) {
    throw new NotFoundException('Cart is empty');
  }

  // =========================
  // TOTAL AMOUNT
  // =========================
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.totalPrice,
    0,
  );

  // =========================
  // INIT DISCOUNTS
  // =========================
  let rewardUsed = 0;
  let couponDiscount = 0;
  let discountAmount = 0;
  let finalAmount = totalAmount;

  // =========================
  // REWARD APPLY
  // =========================
  if (dto.useReward && dto.rewardAmount > 0) {
    rewardUsed = dto.rewardAmount;

    finalAmount -= rewardUsed;
  }

  // =========================
  // COUPON APPLY
  // =========================
  let coupon = null;

  if (dto.couponCode) {
    coupon = await this.couponsService.validateCoupon(
      userId,
      dto.couponCode,
    );

    couponDiscount = coupon.discountAmount;

    finalAmount -= couponDiscount;
  }

  // prevent negative
  if (finalAmount < 0) {
    finalAmount = 0;
  }

  discountAmount = rewardUsed + couponDiscount;

  // =========================
  // ORDER ITEMS
  // =========================
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

  // =========================
  // ORDER NUMBER
  // =========================
  let orderNumber = '';
  let exists = true;

  while (exists) {
    orderNumber = Math.floor(
      10000000 + Math.random() * 90000000,
    ).toString();

    const check = await this.orderModel.findOne({
      orderNumber,
    });

    if (!check) exists = false;
  }

  // =========================
  // CREATE ORDER
  // =========================
  const order = await this.orderModel.create({
    orderNumber,
    user: userId,
    customerPhone: user.phone,
    shippingAddress: address._id,
    items,

    totalAmount,
    rewardUsed,
    couponDiscount,
    discountAmount,
    finalAmount,

    paymentMethod: 'COD',
    orderStatus: OrderStatus.PENDING,
    isPaid: false,
    trackingEnabled: false,
  });

  // =========================
  // REWARD DEDUCT
  // =========================
  if (rewardUsed > 0) {
    await this.rewardsService.redeemReward(
      userId,
      rewardUsed,
      order._id.toString(),
    );
  }

  // =========================
  // COUPON MARK USED
  // =========================
  if (coupon) {
    await this.couponsService.markAsUsed(
      coupon._id.toString(),
    );
  }

  // =========================
  // CLEAR CART
  // =========================
  await this.cartModel.deleteMany({
    user: userId,
  });

  return order;
}

  // =========================
  // USER ORDERS
  // =========================
  async getUserOrders(userId: string) {
    return this.orderModel
      .find({ user: userId })
      .populate('shippingAddress')
      .sort({ createdAt: -1 });
  }

  // =========================
  // ALL ORDERS
  // =========================
  async getAllOrders() {
    return this.orderModel
      .find()
      .populate('shippingAddress')
      .sort({ createdAt: -1 });
  }

  // =========================
  // SINGLE ORDER
  // =========================
  async getSingleOrder(id: string) {
    const order = await this.orderModel
      .findById(id)
      .populate('shippingAddress');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // =========================
  // UPDATE STATUS
  // =========================
async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
  const order = await this.orderModel.findById(id);

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  const updated = await this.orderModel.findByIdAndUpdate(
    id,
    { orderStatus: dto.orderStatus },
    { new: true },
  );

  // 🔥 DELIVERY COMPLETE LOGIC
if (dto.orderStatus === OrderStatus.DELIVERED) {
  await this.orderModel.findByIdAndUpdate(id, {
    trackingEnabled: false,
    assignedRider: null,
  });

  // USER INFO
  const user = await this.userModel.findById(
    order.user,
  );

  // DEFAULT CUSTOMER TYPE
  const customerType =
    user?.customerType || 'regular';

  // ADD REWARD
const reward =
  await this.rewardsService.rewardAfterOrder(
    order.user.toString(),
    customerType,
    order.totalAmount,
    order._id.toString(),
  );

await this.orderModel.findByIdAndUpdate(
  order._id,
  {
    earnedReward: reward || 0,
  },
);
// Total Spent
await this.usersService.increaseSpentAmount(
  order.user.toString(),
  order.totalAmount,
);

// Total Orders
await this.usersService.increaseOrderCount(
  order.user.toString(),
);

// Customer Level
await this.usersService.checkCustomerLevel(
  order.user.toString(),
);
}

  return updated;
}

  // =========================
  // ASSIGN RIDER
  // =========================
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

  // =========================
  // TRACKING (MAIN FIX)
  // =========================
  async getTracking(orderId: string) {
    const order = await this.orderModel
      .findById(orderId)
      .populate('shippingAddress');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if (!order.assignedRider) {
      return {
        orderNumber: order.orderNumber,
        status: order.orderStatus,
        trackingEnabled: false,
      };
    }

    const riderLocation = await this.riderLocationModel.findOne({
      riderId: order.assignedRider,
    });

    const address = order.shippingAddress as any;

    return {
      orderNumber: order.orderNumber,
      status: order.orderStatus,
      trackingEnabled: order.trackingEnabled,

      // 🔥 USER LOCATION (FOR MAP)
      destination: {
        lat: address.latitude,
        lng: address.longitude,
        area: address.areaOrVillage,
        landmark: address.landmark,
      },

      // 🚴 RIDER LOCATION
      rider: {
        lat: riderLocation?.lat ?? null,
        lng: riderLocation?.lng ?? null,
        updatedAt: riderLocation?.updatedAt ?? null,
      },
    };
  }

  // =========================
// ACTIVE ORDER
// =========================

async getActiveOrder(
  userId: string,
) {
  return this.orderModel
    .findOne({
      user: userId,

      orderStatus: {
        $in: [
          OrderStatus.PENDING,
          OrderStatus.PROCESSING,
          OrderStatus.OUT_FOR_DELIVERY,
        ],
      },
    })
    .sort({
      createdAt: -1,
    });
}

/////////////////////////////////

// =========================
// RETURN ORDER ITEM
// =========================

async returnOrderItem(
  orderId: string,
  returnAmount: number,
) {
  const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  // Already returned check
  const alreadyReturned = order.returnedAmount || 0;

  if (alreadyReturned + returnAmount > order.totalAmount) {
    throw new BadRequestException(
      'Return amount exceeds order total amount',
    );
  }

  // Save return amount
  order.returnedAmount = alreadyReturned + returnAmount;

  order.refundAmount =
    (order.refundAmount || 0) + returnAmount;

  await order.save();

  const userId = order.user.toString();

  // =========================
  // GET USER WALLET
  // =========================

  const wallet =
    await this.rewardsService.getWallet(userId);

  // =========================
  // CALCULATE RETURN RATIO
  // =========================

  const ratio =
    returnAmount / order.totalAmount;

  /**
   * IMPORTANT
   *
   * Order Schema এ earnedReward নামে একটি field থাকতে হবে
   */

  const deductedReward =
    (order.earnedReward || 0) * ratio;

  // =========================
  // UPDATE WALLET
  // =========================

  wallet.balance = Math.max(
    0,
    wallet.balance - deductedReward,
  );

  wallet.totalEarned = Math.max(
    0,
    wallet.totalEarned - deductedReward,
  );

  await wallet.save();

  // =========================
  // UPDATE USER STATISTICS
  // =========================

  await this.userModel.findByIdAndUpdate(userId, {
    $inc: {
      totalRewardEarned: -deductedReward,
    },
  });

  // =========================
  // SAVE TRANSACTION
  // =========================

  await this.rewardsService.createTransaction({
    user: userId,

    amount: deductedReward,

    type: RewardTransactionType.DEDUCT,

    order: orderId,

    description:
      'Reward reversed because of returned products',
  });

  // =========================
  // RESPONSE
  // =========================

  return {
    success: true,

    message: 'Return processed successfully',

    refundedAmount: returnAmount,

    rewardDeducted: deductedReward,

    currentWalletBalance: wallet.balance,
  };
}
}
