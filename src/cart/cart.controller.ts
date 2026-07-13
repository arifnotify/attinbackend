import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

import { CartService } from './cart.service';

import { AddToCartDto } from './dto/add-to-cart.dto';

import { UpdateCartDto } from './dto/update-cart.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
export class CartController {
  constructor(private cartService: CartService) {}

  @Post('sync')
  @UseGuards(JwtAuthGuard)
  syncCart(@Req() req: any, @Body() body: any) {
    return this.cartService.syncCart(req.user.userId, body.items);
  }

  // ADD TO CART
  @UseGuards(JwtAuthGuard)
  @Post()
  addToCart(
    @Req() req: any,

    @Body()
    addToCartDto: AddToCartDto,
  ) {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  // USER CART
  @UseGuards(JwtAuthGuard)
  @Get()
  getUserCart(@Req() req: any) {
    return this.cartService.getUserCart(req.user.userId);
  }

  // UPDATE QUANTITY
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateQuantity(
    @Param('id') id: string,

    @Body()
    updateCartDto: UpdateCartDto,
  ) {
    return this.cartService.updateQuantity(id, updateCartDto);
  }

  // REMOVE ITEM
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  removeCartItem(@Param('id') id: string) {
    return this.cartService.removeCartItem(id);
  }

  //////////////////////////////////////////////
  @Get('refresh')
@UseGuards(JwtAuthGuard)
  refreshCart(@Req() req: any) {
    return this.cartService.refreshProductCart(req.user.userId);

}
}
