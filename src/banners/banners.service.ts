import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { Banner, BannerDocument } from './schemas/banner.schema';

import { CreateBannerDto } from './dto/create-banner.dto';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name)
    private bannerModel: Model<BannerDocument>,
  ) {}

  create(createBannerDto: CreateBannerDto) {
    return this.bannerModel.create(createBannerDto);
  }

  findAll() {
    return this.bannerModel.find({
      isActive: true,
    });
  }
}
