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

    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );

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
      orderNumber = Math.floor(
        10000000 + Math.random() * 90000000,
      ).toString();

      const check = await this.orderModel.findOne({
        orderNumber,
      });

      if (!check) exists = false;
    }

    const order = await this.orderModel.create({
      orderNumber,
      user: userId,
      customerPhone: user.phone,

      // 🔥 IMPORTANT FIX
      shippingAddress: address._id,

      items,
      totalAmount,
      paymentMethod: 'COD',
      orderStatus: OrderStatus.PENDING,
      isPaid: false,
      trackingEnabled: false,
    });

    await this.cartModel.deleteMany({ user: userId });

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

    // 🔥 AUTO STOP TRACKING WHEN DELIVERED
    if (dto.orderStatus === OrderStatus.DELIVERED) {
      await this.orderModel.findByIdAndUpdate(id, {
        trackingEnabled: false,
      });
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
}
