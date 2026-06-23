import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import { Banner, BannerDocument } from './schemas/banner.schema';

import { CreateBannerDto } from './dto/create-banner.dto';
import { UpdateBannerDto } from './dto/update-banner.dto';

import { RedisService } from '../redis/redis.service';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class BannersService {
  constructor(
    @InjectModel(Banner.name)
    private bannerModel: Model<BannerDocument>,

    private redisService: RedisService,

    private readonly socketGateway: SocketGateway,
  ) {}

  // =========================
  // CREATE BANNER
  // =========================
  async createBanner(createBannerDto: CreateBannerDto) {
    const banner = await this.bannerModel.create(createBannerDto);

    // 🧠 CLEAR CACHE
    await this.redisService.del('banners_active');
    await this.redisService.del('banners_all');

    // 🔥 SOCKET EVENTS
    this.socketGateway.emitBannerUpdated();
    this.socketGateway.emitHomeUpdated();

    return banner;
  }

  // =========================
  // GET ACTIVE BANNERS (CACHED)
  // =========================
  async getActiveBanners() {
    const cacheKey = 'banners_active';

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      console.log('🔥 ACTIVE BANNERS FROM REDIS');

      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }

    console.log('🟢 ACTIVE BANNERS FROM DB');

    const banners = await this.bannerModel.find({
      isActive: true,
    });

    await this.redisService.set(
      cacheKey,
      JSON.stringify(banners),
      300, // 5 min
    );

    return banners;
  }

  // =========================
  // GET ALL BANNERS (CACHED)
  // =========================
  async getAllBanners() {
    const cacheKey = 'banners_all';

    const cached = await this.redisService.get(cacheKey);

    if (cached) {
      return typeof cached === 'string' ? JSON.parse(cached) : cached;
    }

    const banners = await this.bannerModel.find().sort({ createdAt: -1 });

    await this.redisService.set(cacheKey, JSON.stringify(banners), 300);

    return banners;
  }

  // =========================
  // SINGLE BANNER
  // =========================
  async getSingleBanner(id: string) {
    const banner = await this.bannerModel.findById(id);

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    return banner;
  }

  // =========================
  // UPDATE BANNER
  // =========================
  async updateBanner(id: string, updateBannerDto: UpdateBannerDto) {
    const banner = await this.bannerModel.findByIdAndUpdate(
      id,
      updateBannerDto,
      { new: true },
    );

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    // 🧠 CLEAR CACHE
    await this.redisService.del('banners_active');
    await this.redisService.del('banners_all');

    // 🔥 SOCKET EVENTS
    this.socketGateway.emitBannerUpdated();
    this.socketGateway.emitHomeUpdated();

    return banner;
  }

  // =========================
  // DELETE BANNER
  // =========================
  async deleteBanner(id: string) {
    const banner = await this.bannerModel.findById(id);

    if (!banner) {
      throw new NotFoundException('Banner not found');
    }

    await this.bannerModel.findByIdAndDelete(id);

    // 🧠 CLEAR CACHE
    await this.redisService.del('banners_active');
    await this.redisService.del('banners_all');

    // 🔥 SOCKET EVENTS
    this.socketGateway.emitBannerUpdated();
    this.socketGateway.emitHomeUpdated();

    return {
      success: true,
      message: 'Banner deleted successfully',
    };
  }
}
