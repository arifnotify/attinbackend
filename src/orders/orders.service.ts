import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Order, OrderDocument } from './schemas/order.schema';

import { Cart, CartDocument } from '../cart/schemas/cart.schema';

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

    private redisService: RedisService,
  ) {}

  // CREATE ORDER
  async createOrder(userId: string, createOrderDto: CreateOrderDto) {
    // get user cart
    const cartItems = await this.cartModel
      .find({
        user: userId,
      })
      .populate('product');

    if (!cartItems.length) {
      throw new NotFoundException('Cart is empty');
    }

    // calculate total
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );

    // order items
    const items = cartItems.map((item) => ({
      product: item.product,

      quantity: item.quantity,

      price: item.price,

      totalPrice: item.totalPrice,
    }));

    // create order
    const order = await this.orderModel.create({
      user: userId,

      items,

      totalAmount,

      shippingAddress: createOrderDto.shippingAddress,

      paymentMethod: 'COD',
    });

    // clear cart
    await this.cartModel.deleteMany({
      user: userId,
    });

    // clear redis cart cache
    await this.redisService.delete(`cart:${userId}`);

    return {
      success: true,
      message: 'Order placed successfully',
      order,
    };
  }

  // USER ORDERS
  async getUserOrders(userId: string) {
    return this.orderModel
      .find({
        user: userId,
      })
      .populate('items.product')
      .sort({
        createdAt: -1,
      });
  }

  // SINGLE ORDER
  async getSingleOrder(id: string) {
    const order = await this.orderModel.findById(id).populate('items.product');

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // ADMIN ALL ORDERS
  async getAllOrders() {
    return this.orderModel
      .find()
      .populate('items.product')
      .populate('user')
      .sort({
        createdAt: -1,
      });
  }

  // UPDATE ORDER STATUS
  async updateOrderStatus(
    id: string,
    updateOrderStatusDto: UpdateOrderStatusDto,
  ) {
    const order = await this.orderModel.findByIdAndUpdate(
      id,
      {
        orderStatus: updateOrderStatusDto.orderStatus,
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
