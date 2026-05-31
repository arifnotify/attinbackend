import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Order, OrderDocument } from './schemas/order.schema';

import { Cart, CartDocument } from '../cart/schemas/cart.schema';

import { User } from '../users/schemas/user.schema';

import { CreateOrderDto } from './dto/create-order.dto';

import { UpdateOrderStatusDto } from './dto/update-order-status.dto';

import { RedisService } from '../redis/redis.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,

    @InjectModel(Cart.name)
    private cartModel: Model<CartDocument>,

    @InjectModel(User.name)
    private userModel: Model<User>,

    private redisService: RedisService,
  ) {}

  // CREATE ORDER
  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
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

    // TOTAL
    const totalAmount =
      cartItems.reduce(
        (sum, item) =>
          sum + item.totalPrice,
        0,
      );

    // ORDER ITEMS
    const items = cartItems.map(
      (item) => ({
        product: (item.product as any)?._id,

        productName:
          (item.product as any)?.name,

        productImage:
          (item.product as any)?.image,

        quantity: item.quantity,

        price: item.price,

        totalPrice:
          item.totalPrice,
      }),
    );

    // CREATE ORDER
    const order =
      await this.orderModel.create({
        user: userId,

        customerPhone:
          user.phone,

        shippingAddress:
          createOrderDto.shippingAddress,

        items,

        totalAmount,

        paymentMethod: 'COD',

        orderStatus: 'Pending',

        isPaid: false,
      });

    // CLEAR CART
    await this.cartModel.deleteMany({
      user: userId,
    });

    // CLEAR REDIS
    await this.redisService.del(
      `cart:${userId}`,
    );

    return {
      success: true,
      message:
        'Order placed successfully',
      order,
    };
  }

  // USER ORDERS
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

  // SINGLE ORDER
  async getSingleOrder(id: string) {
    const order =
      await this.orderModel.findById(id);

    if (!order) {
      throw new NotFoundException(
        'Order not found',
      );
    }

    return order;
  }

  // ADMIN ALL ORDERS
  async getAllOrders() {
    return this.orderModel
      .find()
      .populate(
        'user',
        'phone',
      )
      .sort({
        createdAt: -1,
      });
  }

  // UPDATE STATUS
  async updateOrderStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const order = await this.orderModel.findByIdAndUpdate(
        id,
        {
          orderStatus:
            updateOrderStatusDto.orderStatus,
        },
        {
          new: true,
        },
      );

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }
}