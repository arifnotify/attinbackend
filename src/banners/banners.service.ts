import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Banner, BannerDocument } from './schemas/banner.schema';

import { CreateBannerDto } from './dto/create-banner.dto';

import { UpdateBannerDto } from './dto/update-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name)
    private bannerModel: Model<BannerDocument>,
  ) {}

  // CREATE BANNER
  async createBanner(createBannerDto: CreateBannerDto) {
    return this.bannerModel.create(createBannerDto);
  }

  // GET ACTIVE BANNERS
  async getActiveBanners() {
    return this.bannerModel.find({
      isActive: true,
    });
  }

  // GET ALL BANNERS
  async getAllBanners() {
    return this.bannerModel.find().sort({
      createdAt: -1,
    });
  }

  // GET SINGLE BANNER
  async getSingleBanner(id: string) {
    const banner = await this.bannerModel.findById(id);

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    return banner;
  }

  // UPDATE BANNER
  async updateBanner(id: string, updateBannerDto: UpdateBannerDto) {
    const banner = await this.bannerModel.findByIdAndUpdate(
      id,
      updateBannerDto,
      {
        new: true,
      },
    );

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    return banner;
  }

  // DELETE BANNER
  async deleteBanner(id: string) {
    const banner = await this.bannerModel.findById(id);

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    await this.bannerModel.findByIdAndDelete(id);

    return {
      success: true,
      message: 'Banner deleted successfully',
    };
  }
}
