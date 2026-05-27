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

import { BannersService } from './banners.service';

import { CreateBannerDto } from './dto/create-banner.dto';

import { UpdateBannerDto } from './dto/update-banner.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('banners')
export class BannersController {
  constructor(private bannersService: BannersService) {}

  // CREATE BANNER
  @UseGuards(JwtAuthGuard)
  @Post()
  createBanner(
    @Body()
    createBannerDto: CreateBannerDto,
  ) {
    return this.bannersService.createBanner(createBannerDto);
  }

  // ACTIVE BANNERS
  @Get()
  getActiveBanners() {
    return this.bannersService.getActiveBanners();
  }

  // ALL BANNERS ADMIN
  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  getAllBanners() {
    return this.bannersService.getAllBanners();
  }

  // SINGLE BANNER
  @UseGuards(JwtAuthGuard)
  @Get(':id')
  getSingleBanner(@Param('id') id: string) {
    return this.bannersService.getSingleBanner(id);
  }

  // UPDATE BANNER
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  updateBanner(
    @Param('id') id: string,

    @Body()
    updateBannerDto: UpdateBannerDto,
  ) {
    return this.bannersService.updateBanner(id, updateBannerDto);
  }

  // DELETE BANNER
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteBanner(@Param('id') id: string) {
    return this.bannersService.deleteBanner(id);
  }
}
