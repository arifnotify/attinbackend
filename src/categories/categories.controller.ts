import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { CategoriesService } from './categories.service';

import { ProductsService } from '../products/products.service';

import { CreateCategoryDto } from './dto/create-category.dto';

import { UpdateCategoryDto } from './dto/update-category.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('categories')
export class CategoriesController {
  constructor(
    private categoriesService: CategoriesService,

    private productsService: ProductsService,
  ) {}

  // CREATE CATEGORY
  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body()
    createCategoryDto: CreateCategoryDto,
  ) {
    return this.categoriesService.create(createCategoryDto);
  }

  // GET ALL CATEGORIES
  @Get()
  findAll() {
    return this.categoriesService.findAll();
  }

  // GET SINGLE CATEGORY
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  // UPDATE CATEGORY
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,

    @Body()
    updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.categoriesService.update(id, updateCategoryDto);
  }

  // DELETE CATEGORY
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.categoriesService.remove(id);
  }

  // CATEGORY PRODUCTS
  @Get(':category/products')
  getCategoryProducts(
    @Param('category')
    category: string,
  ) {
    return this.productsService.findByCategory(category);
  }
}
