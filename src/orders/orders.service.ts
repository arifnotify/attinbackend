import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  Order,
  OrderDocument,
} from './schemas/order.schema';

import { Cart } from '../cart/schemas/cart.schema';
import { User } from '../users/schemas/user.schema';

import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

import { RedisService } from '../redis/redis.service';

import { OrderStatus } from './enums/order-status.enum';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private readonly orderModel: Model<OrderDocument>,

    @InjectModel(Cart.name)
    private readonly cartModel: Model<any>,

    @InjectModel(User.name)
    private readonly userModel: Model<any>,

    private readonly redisService: RedisService,
  ) {}

  // ===================================
  // CREATE ORDER
  // ===================================
  async createOrder(
    userId: string,
    dto: CreateOrderDto,
  ) {
    const user =
      await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException(
        'User not found',
      );
    }

    const cartItems =
      await this.cartModel
        .find({
          user: userId,
        })
        .populate('product');

    if (!cartItems.length) {
      throw new NotFoundException(
        'Cart is empty',
      );
    }

    const totalAmount =
      cartItems.reduce(
        (sum, item) =>
          sum + item.totalPrice,
        0,
      );

    const items = cartItems.map(
      (item) => ({
        product: item.product._id,

        productName:
          typeof item.product.title ===
          'object'
            ? JSON.stringify(
                item.product.title,
              )
            : item.product.title,

        productImage:
          item.product.images?.[0] ??
          '',

        quantity: item.quantity,

        price: item.price,

        totalPrice:
          item.totalPrice,
      }),
    );

    const order =
      await this.orderModel.create({
        user: userId,

        customerPhone:
          user.phone,

        shippingAddress:
          dto.shippingAddress,

        items,

        totalAmount,

        paymentMethod: 'COD',

        orderStatus:
          OrderStatus.PENDING,

        isPaid: false,

        trackingEnabled: false,
      });

    // Clear Cart
    await this.cartModel.deleteMany({
      user: userId,
    });

    // Clear Redis Cart
    await this.redisService.del(
      `cart:${userId}`,
    );

    return order;
  }

  // ===================================
  // GET ALL ORDERS
  // ===================================
  async getAllOrders() {
    return this.orderModel
      .find()
      .sort({
        createdAt: -1,
      });
  }

  // ===================================
  // GET USER ORDERS
  // ===================================
  async getUserOrders(
    userId: string,
  ) {
    return this.orderModel
      .find({
        user: userId,
      })
      .sort({
        createdAt: -1,
      });
  }

  // ===================================
  // GET SINGLE ORDER
  // ===================================
  async getSingleOrder(
    id: string,
  ) {
    const order =
      await this.orderModel.findById(
        id,
      );

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    return order;
  }

  // ===================================
  // UPDATE ORDER STATUS
  // ===================================
  async updateOrderStatus(
    id: string,
    dto: UpdateOrderStatusDto,
  ) {
    const order =
      await this.orderModel.findById(
        id,
      );

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    const updateData: any = {
      orderStatus:
        dto.orderStatus,
    };

    // Rider started delivery
    if (
      dto.orderStatus ===
      OrderStatus.OUT_FOR_DELIVERY
    ) {
      updateData.trackingEnabled =
        true;
    }

    // Delivery completed
    if (
      dto.orderStatus ===
        OrderStatus.DELIVERED ||
      dto.orderStatus ===
        OrderStatus.CANCELLED
    ) {
      updateData.trackingEnabled =
        false;
    }

    return this.orderModel.findByIdAndUpdate(
      id,
      updateData,
      {
        new: true,
      },
    );
  }

  // ===================================
  // UPDATE RIDER LOCATION
  // ===================================
  async updateRiderLocation(
    orderId: string,
    lat: number,
    lng: number,
  ) {
    const order =
      await this.orderModel.findById(
        orderId,
      );

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    if (
      !order.trackingEnabled
    ) {
      throw new NotFoundException(
        'Tracking not enabled',
      );
    }

    return this.orderModel.findByIdAndUpdate(
      orderId,
      {
        riderLat: lat,
        riderLng: lng,
        lastLocationUpdate:
          new Date(),
      },
      {
        new: true,
      },
    );
  }

  // ===================================
  // CUSTOMER TRACK ORDER
  // ===================================
  async getTracking(
    orderId: string,
  ) {
    const order =
      await this.orderModel.findById(
        orderId,
      );

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    return {
      orderId: order._id,

      orderStatus:
        order.orderStatus,

      trackingEnabled:
        order.trackingEnabled,

      riderLat:
        order.riderLat,

      riderLng:
        order.riderLng,

      lastLocationUpdate:
        order.lastLocationUpdate,
    };
  }

  // ===================================
  // GET ACTIVE TRACKING ORDER
  // ===================================
  async getActiveOrder(
    userId: string,
  ) {
    return this.orderModel.findOne({
      user: userId,

      orderStatus:
        OrderStatus.OUT_FOR_DELIVERY,

      trackingEnabled: true,
    });
  }
}