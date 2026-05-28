import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Cart, CartDocument } from './schemas/cart.schema';

import { Product, ProductDocument } from '../products/schemas/product.schema';

import { AddToCartDto } from './dto/add-to-cart.dto';

import { UpdateCartDto } from './dto/update-cart.dto';

import { RedisService } from '../redis/redis.service';

@Injectable()
export class CartService {
  constructor(
    @InjectModel(Cart.name)
    private cartModel: Model<CartDocument>,

    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,

    private redisService: RedisService,
  ) {}

  // ADD TO CART
  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const product = await this.productModel.findById(addToCartDto.productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    // check existing cart item
    const existingCart = await this.cartModel.findOne({
      user: userId,
      product: addToCartDto.productId,
    });

    // update quantity
    if (existingCart) {
      existingCart.quantity += addToCartDto.quantity;

      existingCart.totalPrice = existingCart.quantity * existingCart.price;

      await existingCart.save();

      await this.cacheCart(userId);

      return existingCart;
    }

    // create cart item
    const cart = await this.cartModel.create({
      user: userId,

      product: addToCartDto.productId,

      quantity: addToCartDto.quantity,

      price: product.price,

      totalPrice: product.price * addToCartDto.quantity,
    });

    await this.cacheCart(userId);

    return cart;
  }

  // GET USER CART
  async getUserCart(userId: string) {
    const cacheKey = `cart:${userId}`;

    // 🔥 CHECK REDIS CACHE
    const cachedCart = await this.redisService.get(cacheKey);

    if (cachedCart) {
      return typeof cachedCart === 'string'
        ? JSON.parse(cachedCart)
        : cachedCart;
    }

    // 🧠 GET FROM DB
    const cart = await this.cartModel
      .find({
        user: userId,
      })
      .populate('product');

    // 💾 SAVE CACHE (5 min)
    await this.redisService.set(cacheKey, JSON.stringify(cart), 300);

    return cart;
  }

  // UPDATE CART QUANTITY
  async updateQuantity(cartId: string, updateCartDto: UpdateCartDto) {
    const cart = await this.cartModel.findById(cartId);

    if (!cart) {
      throw new NotFoundException('Cart item not found');
    }

    cart.quantity = updateCartDto.quantity;

    cart.totalPrice = cart.price * cart.quantity;

    await cart.save();

    await this.cacheCart(cart.user.toString());

    return cart;
  }

  // REMOVE CART ITEM
  async removeCartItem(cartId: string) {
    const cart = await this.cartModel.findById(cartId);

    if (!cart) {
      throw new NotFoundException('Cart item not found');
    }

    const userId = cart.user.toString();

    await this.cartModel.findByIdAndDelete(cartId);

    await this.cacheCart(userId);

    return {
      success: true,
      message: 'Cart item removed',
    };
  }

  // CACHE USER CART
  async cacheCart(userId: string) {
    const cart = await this.cartModel
      .find({
        user: userId,
      })
      .populate('product');

    await this.redisService.set(`cart:${userId}`, JSON.stringify(cart), 300);
  }
}
