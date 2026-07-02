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

import { UsersService } from 'src/users/users.service';

import { RewardTransactionType } from 'src/rewards/schemas/reward-transaction.schema';
import { AdminEditOrderDto } from './dto/admin-edit-order.dto';
import { Product } from 'src/products/schemas/product.schema';

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

    private usersService: UsersService,

    @InjectModel(Product.name)
    private productModel: Model<Product>,
  ) {}

  // =========================
  // CREATE ORDER
  // =========================

  async createOrder(userId: string, dto: CreateOrderDto) {
    // =========================
    // USER CHECK
    // =========================
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // =========================
    // ADDRESS CHECK
    // =========================
    const address = await this.addressModel.findOne({
      _id: dto.shippingAddress,
      user: userId,
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    // =========================
    // CART ITEMS
    // =========================
    const cartItems = await this.cartModel
      .find({ user: userId })
      .populate('product');

    if (!cartItems.length) {
      throw new NotFoundException('Cart is empty');
    }

    // =========================
    // SUBTOTAL CALCULATION
    // =========================
    const subTotal = cartItems.reduce((sum, item) => sum + item.totalPrice, 0);

    const deliveryCharge = dto.deliveryCharge ?? 0;

    const totalAmount = subTotal + deliveryCharge;

    // =========================
    // REWARD CALCULATION (SAFE)
    // =========================
    let rewardUsed = 0;
    let finalAmount = totalAmount;

    if (dto.useReward && dto.rewardAmount) {
      const wallet = await this.rewardsService.getWallet(userId);

      rewardUsed = Math.min(dto.rewardAmount, wallet.balance, totalAmount);

      finalAmount = totalAmount - rewardUsed;
    }

    // safety
    finalAmount = Math.max(0, finalAmount);

    // =========================
    // ITEMS MAP
    // =========================
    const items = cartItems.map((item: any) => ({
      product: item.product._id,
      productName: item.product.title?.en,
      productImage: item.product.images?.[0] || '',
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
    }));

    // =========================
    // ORDER NUMBER GENERATE
    // =========================
    let orderNumber = '';
    let exists = true;

    while (exists) {
      orderNumber = Math.floor(10000000 + Math.random() * 90000000).toString();

      const check = await this.orderModel.findOne({
        orderNumber,
      });

      if (!check) {
        exists = false;
      }
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

      subTotal,
      deliveryCharge,
      totalAmount,

      rewardUsed,
      discountAmount: rewardUsed,

      finalAmount,

      paymentMethod: 'COD',
      orderStatus: OrderStatus.PENDING,
      isPaid: false,
      trackingEnabled: false,
    });

    // =========================
    // REDEEM REWARD
    // =========================
    if (rewardUsed > 0) {
      await this.rewardsService.redeemReward(
        userId,
        rewardUsed,
        order._id.toString(),
      );

      await this.usersService.increaseRewardUsed(userId, rewardUsed);
    }

    // =========================
    // CLEAR CART
    // =========================
    await this.cartModel.deleteMany({ user: userId });

    return order;
  }
  // =========================
  // USER ORDERS
  // =========================

  async getUserOrders(userId: string) {
    return this.orderModel
      .find({
        user: userId,
      })
      .populate('shippingAddress')
      .sort({
        createdAt: -1,
      });
  }

  // =========================
  // ALL ORDERS
  // =========================

  async getAllOrders() {
    return this.orderModel.find().populate('shippingAddress').sort({
      createdAt: -1,
    });
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
  // UPDATE ORDER STATUS
  // =========================

  // =========================
  // UPDATE STATUS
  // =========================
async updateOrderStatus(id: string, dto: UpdateOrderStatusDto) {
  const order = await this.orderModel.findById(id);

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  // 🔥 prevent duplicate update
  if (order.orderStatus === dto.orderStatus) {
    return order;
  }

  const userId = order.user.toString();

  const updated = await this.orderModel.findByIdAndUpdate(
    id,
    {
      orderStatus: dto.orderStatus,
    },
    { new: true },
  );

  // ======================================================
  // 🔵 DELIVERY COMPLETED FLOW
  // ======================================================
  if (dto.orderStatus === OrderStatus.DELIVERED) {
    await this.orderModel.findByIdAndUpdate(id, {
      trackingEnabled: false,
      assignedRider: null,
    });

    const user = await this.userModel.findById(userId);

    const customerType = user?.customerType ?? 'regular';

    // =========================
    // GIVE REWARD
    // =========================
    const earnedReward = await this.rewardsService.rewardAfterOrder(
      userId,
      customerType,
      order.totalAmount,
      order._id.toString(),
    );

    // save earned reward in order
    await this.orderModel.findByIdAndUpdate(order._id, {
      earnedReward: earnedReward || 0,
    });

    // =========================
    // USER REWARD UPDATE
    // =========================
    if (earnedReward > 0) {
      await this.usersService.increaseRewardEarned(
        userId,
        earnedReward,
      );
    }

    // =========================
    // USER STATS UPDATE
    // =========================
    await this.usersService.increaseSpentAmount(
      userId,
      order.totalAmount,
    );

    await this.usersService.increaseOrderCount(userId);

    await this.usersService.checkCustomerLevel(userId);
  }

  // ======================================================
  // 🔴 CANCEL FLOW (NEW FIXED)
  // ======================================================
  if (dto.orderStatus === OrderStatus.CANCELLED) {
    const usedReward = order.rewardUsed || 0;

    if (usedReward > 0) {
      const wallet = await this.rewardsService.getWallet(userId);

      // refund reward back
      wallet.balance += usedReward;
      await wallet.save();

      // rollback user reward usage safely
      await this.usersService.increaseRewardUsed(
        userId,
        -usedReward,
      );

      // transaction log
      await this.rewardsService.createTransaction({
        user: userId,
        amount: usedReward,
        type: RewardTransactionType.EARN,
        order: id,
        description: 'Reward refunded due to order cancellation',
      });
    }

    await this.orderModel.findByIdAndUpdate(id, {
      trackingEnabled: false,
      assignedRider: null,
    });
  }

  return updated;
}
  // =========================
  // RETURN ORDER ITEM
  // =========================

  async returnOrderItem(orderId: string, returnAmount: number) {
    const order = await this.orderModel.findById(orderId);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    if ((order.returnedAmount || 0) + returnAmount > order.totalAmount) {
      throw new BadRequestException('Return exceeds order amount');
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

    // Update User Reward Summary
    await this.userModel.findByIdAndUpdate(userId, {
      $inc: {
        totalRewardEarned: -deductedReward,
      },
    });

    await this.rewardsService.createTransaction({
      user: userId,
      amount: deductedReward,
      type: RewardTransactionType.DEDUCT,
      order: orderId,
      description: 'Reward reversed due to return',
    });

    return {
      success: true,
      refunded: returnAmount,
      rewardDeducted: deductedReward,
    };
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
      {
        new: true,
      },
    );
  }

  // =========================
  // TRACKING
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

      destination: {
        lat: address.latitude,
        lng: address.longitude,
        area: address.areaOrVillage,
        landmark: address.landmark,
      },

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

  async getActiveOrder(userId: string) {
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

  ////////////////////////////////////////////////////////////////////////////////////
  async increaseSpentAmount(userId: string, amount: number) {
    return this.userModel.findByIdAndUpdate(userId, {
      $inc: { totalSpent: amount },
    });
  }
  //////////////////////////////////////////////////////////////////////////////////////////////
  async adminEditOrder(orderId: string, dto: AdminEditOrderDto) {
    const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  if (order.orderStatus === OrderStatus.DELIVERED) {
    throw new BadRequestException('Delivered order cannot be edited');
  }

  // =========================
  // STEP 1: UPDATE ITEMS
  // =========================
  let subTotal = 0;

  const updatedItems = await Promise.all(
    dto.items.map(async (item) => {
      const product = await this.productModel.findById(item.product);

      if (!product) {
        throw new BadRequestException('Product not found');
      }

      const price = product.price;
      const totalPrice = price * item.quantity;

      subTotal += totalPrice;

      return {
        product: product._id,
        productName: product.title?.en,
        productImage: product.images?.[0] || '',
        quantity: item.quantity,
        price,
        totalPrice,
      };
    }),
  );

  order.items = updatedItems;

  // =========================
  // STEP 2: AUTO RECALCULATE
  // =========================
  const deliveryCharge = order.deliveryCharge || 0;

  const totalAmount = subTotal + deliveryCharge;

  // =========================
  // STEP 3: REWARD RECALCULATE
  // =========================
  const rewardUsed = Math.min(order.rewardUsed || 0, totalAmount);

  const finalAmount = Math.max(0, totalAmount - rewardUsed);

  // =========================
  // STEP 4: WALLET UPDATE
  // =========================
  const userId = order.user.toString();

  const diff = totalAmount - order.totalAmount;

  if (diff !== 0) {
    const wallet = await this.rewardsService.getWallet(userId);

    wallet.balance += diff;

    await wallet.save();

    await this.usersService.increaseSpentAmount(userId, diff);
  }

  // =========================
  // STEP 5: SAVE ORDER
  // =========================
  order.subTotal = subTotal;
  order.totalAmount = totalAmount;
  order.rewardUsed = rewardUsed;
  order.finalAmount = finalAmount;

  await order.save();

  return order;
}

}
