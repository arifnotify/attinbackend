import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { ProductsService } from './products.service';

import { CreateProductDto } from './dto/create-product.dto';

import { UpdateProductDto } from './dto/update-product.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('products')
export class ProductsController {
  constructor(private productsService: ProductsService) {}

  // CREATE PRODUCT
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body()
    createProductDto: CreateProductDto,
  ) {
    return this.productsService.create(createProductDto);
  }

  // GET ALL PRODUCTS
  @Get()
  findAll(@Query('search') search?: string) {
    return this.productsService.findAll(search);
  }

  // SINGLE PRODUCT
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // UPDATE PRODUCT
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,

    @Body()
    updateProductDto: UpdateProductDto,
  ) {
    return this.productsService.update(id, updateProductDto);
  }

  // DELETE PRODUCT
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
