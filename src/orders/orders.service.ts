import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Order, OrderDocument } from './schemas/order.schema';
import { Cart } from '../cart/schemas/cart.schema';
import { User } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,

    @InjectModel(Cart.name)
    private cartModel: Model<any>,

    @InjectModel(User.name)
    private userModel: Model<any>,

    private redisService: RedisService,
  ) {}

  // =========================
  // CREATE ORDER (MAIN LOGIC)
  // =========================
  async createOrder(userId: string, dto: CreateOrderDto) {
    // 1. GET USER
    const user = await this.userModel.findById(userId);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 2. GET CART ITEMS
    const cartItems = await this.cartModel
      .find({ user: userId })
      .populate('product');

    if (!cartItems.length) {
      throw new NotFoundException('Cart is empty');
    }

    // 3. CALCULATE TOTAL
    const totalAmount = cartItems.reduce(
      (sum, item) => sum + item.totalPrice,
      0,
    );

    // 4. FORMAT ORDER ITEMS
    const items = cartItems.map((item) => ({
      product: item.product._id,
      productName: item.product.title,
      productImage: item.product.images?.[0] || '',
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
    }));

    // 5. CREATE ORDER
    const order = await this.orderModel.create({
      user: userId,
      customerPhone: user.phone,
      shippingAddress: dto.shippingAddress,
      items,
      totalAmount,
      paymentMethod: 'COD',
      orderStatus: 'Pending',
      isPaid: false,
    });

    // 6. CLEAR CART FROM DB
    await this.cartModel.deleteMany({ user: userId });

    // 7. CLEAR REDIS CACHE
    await this.redisService.del(`cart:${userId}`);

    console.log(`ORDER CREATED & CART CLEARED: ${userId}`);

    return order;
  }

  // =========================
  // GET ALL ORDERS
  // =========================
  async getAllOrders() {
    return this.orderModel.find().sort({ createdAt: -1 });
  }

  // =========================
  // GET SINGLE ORDER
  // =========================
  async getSingleOrder(id: string) {
    const order = await this.orderModel.findById(id);

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  // =========================
  // UPDATE ORDER STATUS
  // =========================
  async updateOrderStatus(id: string, dto: any) {
    return this.orderModel.findByIdAndUpdate(
      id,
      { orderStatus: dto.orderStatus },
      { new: true },
    );
  }
}
