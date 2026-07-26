import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Inject,
  forwardRef,
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
import { CartService } from 'src/cart/cart.service';
import { PaymentsService } from '../payments/payments.service';
import { PaymentMethod } from '../payments/enums/payment-method.enum';
import { SocketGateway } from "../socket/socket.gateway";

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

    private readonly cartService: CartService,

    @Inject(forwardRef(() => PaymentsService))
    private readonly paymentsService: PaymentsService,

    private readonly socketGateway: SocketGateway,
  ) {}

  // =========================
  // CREATE ORDER
  // =========================
  async createOrder(userId: string, dto: CreateOrderDto) {
    const user = await this.userModel.findById(userId);
    if (!user) throw new NotFoundException('User not found');

    // অ্যাড্রেস আইডি ফাঁকা কি না চেক করা
    if (!dto.shippingAddress || dto.shippingAddress.trim() === '') {
      throw new BadRequestException('Shipping address ID is required and cannot be empty');
    }

    const address = await this.addressModel.findOne({
      _id: dto.shippingAddress,
      user: userId,
    });
    if (!address) throw new NotFoundException('Address not found');

    const cartItems = await this.cartModel
      .find({ user: userId })
      .populate('product');

    if (!cartItems.length) throw new NotFoundException('Cart is empty');

    const subTotal = cartItems.reduce((sum, item: any) => {
      const price = item.price || 0;
      const qty = item.quantity || 1;
      return sum + price * qty;
    }, 0);

    const deliveryCharge = dto.deliveryCharge ?? 0;
    const wallet = await this.rewardsService.getWallet(userId);

    let rewardUsed = 0;
    if (dto.useReward) {
      rewardUsed = Math.min(
        dto.rewardAmount || 0,
        wallet.balance,
        subTotal,
      );
    }

    const totalAmount = subTotal + deliveryCharge;
    const finalAmount = Math.max(0, totalAmount - rewardUsed);

    // ==========================================
    // 🔵 SSLCOMMERZ FLOW (পেমেন্ট সফল হওয়ার আগে অর্ডার তৈরি হবে না)
    // ==========================================
    const isOnline =
      dto.paymentMethod === PaymentMethod.SSLCOMMERZ ||
      (dto.paymentMethod as any) === 'SSLCOMMERZ';

    if (isOnline) {
      const tempTransactionId = `TXN_${Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

      // পেমেন্ট গেটওয়ের জন্য প্রয়োজনীয় ডেটা পাস করা (যাতে পেমেন্ট সাকসেস হলে হ্যান্ডলারে সব ডাটা পাওয়া যায়)
      const sslSession = await this.paymentsService.initiateOnlinePayment({
        amount: finalAmount,
        transactionId: tempTransactionId,
        customerPhone: user.phone,
        userId: userId,
        shippingAddressId: address._id.toString(),
        useReward: !!dto.useReward,
        rewardAmount: rewardUsed,
        deliveryCharge: deliveryCharge,
      });

      return {
        paymentMethod: 'SSLCOMMERZ',
        paymentUrl: sslSession.paymentUrl,
      };
    }

    // ==========================================
    // 🟢 COD FLOW (ক্যাশ অন ডেলিভারির ক্ষেত্রে সরাসরি অর্ডার ডাটাবেজে ক্রিয়েট হবে)
    // ==========================================
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

    const order = await this.orderModel.create({
      orderNumber,
      user: new Types.ObjectId(userId),
      customerPhone: user.phone,
      shippingAddress: address._id,
      items,
      subTotal,
      deliveryCharge,
      rewardUsed,
      discountAmount: rewardUsed,
      totalAmount,
      finalAmount,
      paymentMethod: dto.paymentMethod,
      orderStatus: OrderStatus.PENDING,
      isPaid: false,
      trackingEnabled: false,
    });

    const payment = await this.paymentsService.createOrderPayment({
      userId,
      orderId: order._id.toString(),
      amount: order.finalAmount,
      paymentMethod: dto.paymentMethod,
      customerPhone: user.phone,
    });

    order.payment = payment._id as any;
    await order.save();

    if (rewardUsed > 0) {
      await this.rewardsService.redeemReward(
        userId,
        rewardUsed,
        order._id.toString(),
      );
      await this.usersService.increaseRewardUsed(userId, rewardUsed);
    }

    await this.cartModel.deleteMany({ user: userId });
    await this.cartService.cacheCart(userId);
    this.socketGateway.emitNewOrder(order);

    return {
      ...order.toObject(),
      paymentMethod: payment.paymentMethod,
      paymentStatus: payment.paymentStatus,
    };
  }
  // =========================
  // USER ORDERS
  // =========================
async getUserOrders(userId: string) {
  return this.orderModel
    .find({
      user: new Types.ObjectId(userId),
    })
    .populate('shippingAddress')
    .populate('payment')
    .sort({ createdAt: -1 });
}
  // =========================
  // ALL ORDERS
  // =========================
  async getAllOrders() {
    return this.orderModel
      .find()
      .populate('shippingAddress')
      .populate('assignedRider', 'name phone')
      .populate('payment')
      .sort({ createdAt: -1 });
  }

  // =========================
  // SINGLE ORDER
  // =========================
  async getSingleOrder(id: string) {
    const order = await this.orderModel
      .findById(id)
      .populate('shippingAddress')
      .populate('assignedRider', 'name phone')
      .populate('payment');

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

    // Prevent duplicate update
    if (order.orderStatus === dto.orderStatus) {
      return order;
    }

    const userId = order.user.toString();
    order.orderStatus = dto.orderStatus;

    // ======================================================
    // 🔵 DELIVERY COMPLETED FLOW
    // ======================================================
    if (dto.orderStatus === OrderStatus.DELIVERED) {
      order.trackingEnabled = false;
      order.assignedRider = null;

      if (order.payment) {
        await this.paymentsService.markSuccess(order.payment.toString());
      }

      const user = await this.userModel.findById(userId);
      const customerType = user?.customerType ?? 'regular';

      // GIVE REWARD
      const earnedReward = await this.rewardsService.rewardAfterOrder(
        userId,
        customerType,
        order.subTotal,
        order._id.toString(),
      );

      order.earnedReward = earnedReward || 0;

      if (earnedReward > 0) {
        await this.usersService.increaseRewardEarned(userId, earnedReward);
      }

      await this.usersService.increaseSpentAmount(userId, order.totalAmount);
      await this.usersService.increaseOrderCount(userId);
      await this.usersService.checkCustomerLevel(userId);
    }

    // ======================================================
    // 🔴 CANCEL FLOW
    // ======================================================
    if (dto.orderStatus === OrderStatus.CANCELLED) {
      if (order.payment) {
        await this.paymentsService.markCancelled(order.payment.toString());
      }

      const usedReward = order.rewardUsed || 0;

      if (usedReward > 0) {
        const wallet = await this.rewardsService.getWallet(userId);

        // Refund reward back
        wallet.balance += usedReward;
        await wallet.save();

        await this.usersService.increaseRewardUsed(userId, -usedReward);

        await this.rewardsService.createTransaction({
          user: userId,
          amount: usedReward,
          type: RewardTransactionType.EARN,
          order: id,
          description: 'Reward refunded due to order cancellation',
        });
      }

      order.trackingEnabled = false;
      order.assignedRider = null;
    }

    await order.save();
    this.socketGateway.emitOrderUpdated(
      order
    );
    return order;
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
    const ratio = returnAmount / order.subTotal;
    const deductedReward = (order.earnedReward || 0) * ratio;

    wallet.balance = Math.max(0, wallet.balance - deductedReward);
    wallet.totalEarned = Math.max(0, wallet.totalEarned - deductedReward);

    await wallet.save();

    await this.userModel.findByIdAndUpdate(userId, {
      $inc: { totalRewardEarned: -deductedReward },
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
async assignRider(
  orderId: string,
  riderId: string
) {

  const order =
    await this.orderModel.findById(orderId);


  if(!order){
    throw new NotFoundException(
      "Order not found"
    );
  }


  order.assignedRider =
    new Types.ObjectId(riderId);


  order.orderStatus =
    OrderStatus.OUT_FOR_DELIVERY;


  order.trackingEnabled = true;


  await order.save();


  return this.orderModel
    .findById(orderId)
    .populate(
      'assignedRider',
      'name phone'
    );
  this.socketGateway.emitOrderUpdated(
  updatedOrder
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
      .sort({ createdAt: -1 });
  }

  async increaseSpentAmount(userId: string, amount: number) {
    return this.userModel.findByIdAndUpdate(userId, {
      $inc: { totalSpent: amount },
    });
  }

  // =========================
  // ADMIN EDIT ORDER
  // =========================
async adminEditOrder(orderId: string, dto: AdminEditOrderDto) {
  const order = await this.orderModel.findById(orderId);

  if (!order) {
    throw new NotFoundException('Order not found');
  }

  // 🔴 DELIVERED বা CANCELLED হলে এডিট করা যাবে না
  if (
    order.orderStatus === OrderStatus.DELIVERED ||
    order.orderStatus === OrderStatus.CANCELLED
  ) {
    throw new BadRequestException(
      'Delivered or Cancelled order cannot be edited',
    );
  }

  let subTotal = 0;

  const updatedItems = dto.items.map((item) => {
    const price = item.price;
    const totalPrice = price * item.quantity;

    subTotal += totalPrice;

    return {
      product: new Types.ObjectId(item.product),

      productName: {
        en: item.productName?.en || '',
        bn: item.productName?.bn || '',
      },

      unit: item.unit || 'pcs',

      productImage: item.productImage || '',

      quantity: item.quantity,
      price,
      totalPrice,
    };
  });

  // =========================
  // UPDATE ITEMS
  // =========================
  order.items = updatedItems as any;

  // =========================
  // RECALCULATE TOTALS
  // =========================
  const deliveryCharge = order.deliveryCharge || 0;

  const totalAmount = subTotal + deliveryCharge;

  // Reward Used আগেরটাই থাকবে
  const rewardUsed = Math.min(
    order.rewardUsed || 0,
    totalAmount,
  );

  const finalAmount = Math.max(
    0,
    totalAmount - rewardUsed,
  );

  // =========================
  // UPDATE ORDER AMOUNTS
  // =========================
  order.subTotal = subTotal;
  order.totalAmount = totalAmount;
  order.rewardUsed = rewardUsed;
  order.discountAmount = rewardUsed;
  order.finalAmount = finalAmount;

  await order.save();
  this.socketGateway.emitOrderUpdated(
  order
  );

  return {
    success: true,
    message: 'Order updated successfully',
    order,
  };
}
}
