import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Category, CategoryDocument } from './schemas/category.schema';

import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

import { RedisService } from '../redis/redis.service';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,

    private redisService: RedisService,

    private readonly socketGateway: SocketGateway,
  ) {}

  // =========================
  // CREATE CATEGORY
  // =========================
// =========================
// CREATE CATEGORY
// =========================
async create(createCategoryDto: CreateCategoryDto) {
  // যদি sortOrder না আসে তাহলে শেষের পরে বসবে
  if (
    createCategoryDto.sortOrder === undefined ||
    createCategoryDto.sortOrder === null
  ) {
    const lastCategory = await this.categoryModel
      .findOne()
      .sort({ sortOrder: -1 });

    createCategoryDto.sortOrder = lastCategory
      ? lastCategory.sortOrder + 1
      : 1;
  }

  const category = await this.categoryModel.create(createCategoryDto);

  await this.redisService.del('all_categories');

  this.socketGateway.emitHomeUpdated();

  return category;
}

  // =========================
  // GET ALL CATEGORIES (CACHE)
  // =========================
  async findAll() {
    const cacheKey = 'all_categories';

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      console.log('🔥 FROM REDIS CACHE');

      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }

    console.log('🟢 FROM MONGODB');

    const categories = await this.categoryModel
      .find()
      .populate('parentCategory')
      .sort({
  sortOrder: 1,
});

    await this.redisService.set(cacheKey, JSON.stringify(categories), 300);

    return categories;
  }

  // =========================
  // GET MAIN CATEGORIES
  // (parentCategory = null)
  // =========================
  async getMainCategories() {
    return this.categoryModel
      .find({
        parentCategory: null,
        isActive: true,
      })
      .sort({
  sortOrder: 1,
});
  }

  // =========================
  // GET SUBCATEGORIES
  // =========================
  async getSubCategories(parentId: string) {
    return this.categoryModel
      .find({
        parentCategory: parentId,
        isActive: true,
      })
      .sort({
  sortOrder: 1,
});
  }

  // =========================
  // GET SINGLE CATEGORY
  // =========================
  async findOne(id: string) {
    const category = await this.categoryModel
      .findById(id)
      .populate('parentCategory');

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // =========================
  // UPDATE CATEGORY
  // =========================
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      updateCategoryDto,
      { new: true },
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.redisService.del('all_categories');

    // 🔥 SOCKET EVENT
    this.socketGateway.emitHomeUpdated();

    return category;
  }

  // =========================
  // DELETE CATEGORY
  // =========================
  async remove(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    await this.redisService.del('all_categories');

    // 🔥 SOCKET EVENT
    this.socketGateway.emitHomeUpdated();

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }

  // =========================
// UPDATE SORT ORDER
// =========================
async updateSortOrders(
  categories: {
    id: string;
    sortOrder: number;
  }[],
) {
  for (const item of categories) {
    await this.categoryModel.findByIdAndUpdate(
      item.id,
      {
        sortOrder: item.sortOrder,
      },
    );
  }

  await this.redisService.del('all_categories');

  this.socketGateway.emitHomeUpdated();

  return {
    success: true,
    message: 'Category order updated successfully',
  };
}
}
