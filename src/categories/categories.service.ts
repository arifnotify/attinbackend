import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Category, CategoryDocument } from './schemas/category.schema';

import { CreateCategoryDto } from './dto/create-category.dto';

import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  // CREATE CATEGORY
  async create(createCategoryDto: CreateCategoryDto) {
    return this.categoryModel.create(createCategoryDto);
  }

  // GET ALL CATEGORIES
  async findAll() {
    return this.categoryModel.find().populate('parentCategory').sort({
      createdAt: -1,
    });
  }

  // GET SINGLE CATEGORY
  async findOne(id: string) {
    const category = await this.categoryModel
      .findById(id)
      .populate('parentCategory');

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // UPDATE CATEGORY
  async update(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.categoryModel.findByIdAndUpdate(
      id,
      updateCategoryDto,
      {
        new: true,
      },
    );

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return category;
  }

  // DELETE CATEGORY
  async remove(id: string) {
    const category = await this.categoryModel.findByIdAndDelete(id);

    if (!category) {
      throw new NotFoundException('Category not found');
    }

    return {
      success: true,
      message: 'Category deleted successfully',
    };
  }
}
