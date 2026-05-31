import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { Cart } from '../cart/schemas/cart.schema';
import { User } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
  constructor(
    @InjectModel(Order.name)
    private orderModel: Model<OrderDocument>,

    @InjectModel(Cart.name)
    private cartModel: Model<any>,

    @InjectModel(User.name)
    private userModel: Model<any>,
  ) {}

  async createOrder(userId: string, dto: CreateOrderDto) {
    const user = await this.userModel.findById(userId);

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
      productName: item.product.title,
      productImage: item.product.images?.[0],
      quantity: item.quantity,
      price: item.price,
      totalPrice: item.totalPrice,
    }));

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

    await this.cartModel.deleteMany({ user: userId });

    return order;
  }

  async getAllOrders() {
    return this.orderModel.find().sort({ createdAt: -1 });
  }

  async getSingleOrder(id: string) {
    const order = await this.orderModel.findById(id);
    if (!order) throw new NotFoundException('Order not found');
    return order;
  }

  async updateOrderStatus(id: string, dto: any) {
    return this.orderModel.findByIdAndUpdate(
      id,
      { orderStatus: dto.orderStatus },
      { new: true },
    );
  }
}
