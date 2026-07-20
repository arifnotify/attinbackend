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
import { CartService } from 'src/cart/cart.service';
import { PaymentsService } from '../payments/payments.service';

import { PaymentMethod } from '../payments/enums/payment-method.enum';

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

    private readonly paymentsService: PaymentsService,
  ) {}

  // =========================
  // CREATE ORDER
  // =========================

async createOrder(userId: string, dto: CreateOrderDto) {
  // =========================
  // USER CHECK
  // =========================
  const user = await this.userModel.findById(userId);
  if (!user) throw new NotFoundException('User not found');

  // =========================
  // ADDRESS CHECK
  // =========================
  const address = await this.addressModel.findOne({
    _id: dto.shippingAddress,
    user: userId,
  });

  if (!address) throw new NotFoundException('Address not found');

  // =========================
  // CART ITEMS
  // =========================
  const cartItems = await this.cartModel
    .find({ user: userId })
    .populate('product');

  if (!cartItems.length) throw new NotFoundException('Cart is empty');

  // =========================
  // SUBTOTAL (PRODUCT ONLY SAFE)
  // =========================
  const subTotal = cartItems.reduce((sum, item: any) => {
    const price = item.price || 0;
    const qty = item.quantity || 1;

    return sum + price * qty;
  }, 0);

  // =========================
  // DELIVERY CHARGE
  // =========================
  const deliveryCharge = dto.deliveryCharge ?? 0;

  // =========================
  // WALLET
  // =========================
  const wallet = await this.rewardsService.getWallet(userId);

  // =========================
  // REWARD (ONLY SUBTOTAL)
  // =========================
  let rewardUsed = 0;

  if (dto.useReward) {
    rewardUsed = Math.min(
      dto.rewardAmount || 0,
      wallet.balance,
      subTotal, // ❗ ONLY PRODUCT PRICE
    );
  }

  // =========================
  // TOTAL CALCULATION
  // =========================
  const totalAmount = subTotal + deliveryCharge;

  const finalAmount = Math.max(
    0,
    totalAmount - rewardUsed,
  );

  // =========================
  // ITEMS MAP
  // =========================
const items = cartItems.map((item: any) => {
  const price = item.price || 0;
  const qty = item.quantity || 1;

  return {
    product: item.product._id,
    productName: item.product.title?.en,
    productImage: item.product.images?.[0] || '',
    quantity: qty,
    price,
    totalPrice: price * qty,
  };
});

  // =========================
  // ORDER NUMBER GENERATE
  // =========================
  let orderNumber = '';
  let exists = true;

  while (exists) {
    orderNumber = Math.floor(
      10000000 + Math.random() * 90000000,
    ).toString();

    const check = await this.orderModel.findOne({ orderNumber });

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

// =========================
// CREATE PAYMENT
// =========================

const payment =
await this.paymentsService
.createOrderPayment({

  userId,

  orderId:
  order._id.toString(),

  amount:
  order.finalAmount,

  paymentMethod:
  dto.paymentMethod,

  customerPhone:
  user.phone,
});

// =========================
// SAVE PAYMENT ID
// =========================

order.payment =
payment._id as any;

await order.save();

  // =========================
  // REDEEM REWARD
  // =========================
  if (rewardUsed > 0) {
    await this.rewardsService.redeemReward(
      userId,
      rewardUsed,
      order._id.toString(),
    );

    await this.usersService.increaseRewardUsed(
      userId,
      rewardUsed,
    );
  }

  // =========================
  // CLEAR CART
  // =========================
  await this.cartModel.deleteMany({ user: userId });
  await this.cartService.cacheCart(userId);

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
      .populate('payment')
      .sort({
        createdAt: -1,
      });
  }

  // =========================
  // ALL ORDERS
  // =========================

  async getAllOrders() {
    return this.orderModel.find().populate('shippingAddress').populate('payment').sort({
      createdAt: -1,
    });
  }

  // =========================
  // SINGLE ORDER
  // =========================

  async getSingleOrder(id: string) {
    const order = await this.orderModel
  .findById(id)
  .populate('shippingAddress')
  .populate('payment');

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

    if (order.payment) {

  await this.paymentsService
  .markSuccess(
    order.payment.toString(),
  );

}

    const user = await this.userModel.findById(userId);

    const customerType = user?.customerType ?? 'regular';

    // =========================
    // GIVE REWARD
    // =========================
    const earnedReward = await this.rewardsService.rewardAfterOrder(
      userId,
      customerType,
      order.subTotal,
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
    if (order.payment) {

  await this.paymentsService
  .markCancelled(
    order.payment.toString(),
  );

}
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

    const ratio = returnAmount / order.subTotal;

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


  // 🚫 Delivered order cannot edit
  if (order.orderStatus === OrderStatus.DELIVERED) {
    throw new BadRequestException(
      'Delivered order cannot be edited'
    );
  }


  // =========================
  // STEP 1: UPDATE ITEMS + CURRENT PRICE SAVE
  // =========================

  let subTotal = 0;


  const updatedItems = dto.items.map((item)=>{


    const price = item.price;


    const totalPrice = price * item.quantity;


    subTotal += totalPrice;



    return {

      product: new Types.ObjectId(item.product),

      productName:item.productName || '',

      productImage:item.productImage || '',

      quantity:item.quantity,

      price,

      totalPrice,

    };


  });



  order.items = updatedItems as any;



  // =========================
  // STEP 2: RECALCULATE TOTAL
  // =========================

  const deliveryCharge = order.deliveryCharge || 0;


  const totalAmount = subTotal + deliveryCharge;



  // =========================
  // STEP 3: PRICE DIFFERENCE
  // =========================

  const oldTotal = order.totalAmount || 0;

  const diff = totalAmount - oldTotal;



  // =========================
  // STEP 4: UPDATE USER WALLET SAFE
  // =========================

  const userId = order.user.toString();



  if(diff !== 0){


    const wallet =
      await this.rewardsService.getWallet(userId);



    if(wallet){

      wallet.balance = Math.max(
        0,
        wallet.balance + diff
      );

      await wallet.save();

    }



    await this.usersService.increaseSpentAmount(
      userId,
      diff
    );


  }




  // =========================
  // STEP 5: REWARD SAFE
  // =========================

  const rewardUsed = Math.min(
    order.rewardUsed || 0,
    totalAmount
  );


  const finalAmount = Math.max(
    0,
    totalAmount - rewardUsed
  );




  // =========================
  // STEP 6: SAVE ORDER
  // =========================

  order.subTotal = subTotal;

  order.totalAmount = totalAmount;

  order.rewardUsed = rewardUsed;

  order.finalAmount = finalAmount;

  await order.save();
  return {
    success:true,
    message:'Order updated successfully',
    order,

  };

}
}
