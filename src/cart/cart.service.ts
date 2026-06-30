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

  // =========================
  // PRICE CALCULATION HELPER
  // =========================
  private getSellingPrice(product: any): number {
    let price = product.price;

    if (product.isFlashSale && product.flashSalePrice > 0) {
      price = product.flashSalePrice;
    } else if (product.discountPrice > 0) {
      price = product.discountPrice;
    }

    return price;
  }

  // =========================
  // SYNC CART
  // =========================
  async syncCart(userId: string, items: any[]) {
    await this.cartModel.deleteMany({ user: userId });

    const products = await this.productModel.find({
      _id: { $in: items.map(i => i.productId) },
    });

    const productMap = new Map(
      products.map(p => [p._id.toString(), p]),
    );

    const newItems = items
      .map((item) => {
        const product = productMap.get(item.productId);
        if (!product) return null;

        const price = this.getSellingPrice(product);

        return {
          user: userId,
          product: item.productId,
          quantity: item.quantity,
          price,
          totalPrice: price * item.quantity,
        };
      })
      .filter(Boolean);

    const result = await this.cartModel.insertMany(newItems);

    await this.cacheCart(userId);

    return result;
  }

  // =========================
  // ADD TO CART
  // =========================
  async addToCart(userId: string, addToCartDto: AddToCartDto) {
    const product = await this.productModel.findById(addToCartDto.productId);

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    const sellingPrice = this.getSellingPrice(product);

    const existingCart = await this.cartModel.findOne({
      user: userId,
      product: addToCartDto.productId,
    });

    if (existingCart) {
      existingCart.quantity += addToCartDto.quantity;
      existingCart.price = sellingPrice;
      existingCart.totalPrice = sellingPrice * existingCart.quantity;

      await existingCart.save();
      await this.cacheCart(userId);

      return existingCart;
    }

    const cart = await this.cartModel.create({
      user: userId,
      product: addToCartDto.productId,
      quantity: addToCartDto.quantity,
      price: sellingPrice,
      totalPrice: sellingPrice * addToCartDto.quantity,
    });

    await this.cacheCart(userId);

    return cart;
  }

  // =========================
  // GET USER CART
  // =========================
  async getUserCart(userId: string) {
    const cacheKey = `cart:${userId}`;

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return typeof cached === 'string'
        ? JSON.parse(cached)
        : cached;
    }

    const cart = await this.cartModel
      .find({ user: userId })
      .populate('product');

    await this.redisService.set(
      cacheKey,
      JSON.stringify(cart),
      300,
    );

    return cart;
  }

  // =========================
  // UPDATE QUANTITY
  // =========================
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

  // =========================
  // REMOVE ITEM
  // =========================
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

  // =========================
  // CACHE CART
  // =========================
  async cacheCart(userId: string) {
    const cart = await this.cartModel
      .find({ user: userId })
      .populate('product');

    await this.redisService.set(
      `cart:${userId}`,
      JSON.stringify(cart),
      300,
    );
  }
}