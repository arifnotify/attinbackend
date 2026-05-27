import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { BannersService } from './banners.service';

import { CreateBannerDto } from './dto/create-banner.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('banners')
export class BannersController {
  constructor(private bannersService: BannersService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body()
    createBannerDto: CreateBannerDto,
  ) {
    return this.bannersService.create(createBannerDto);
  }

  @Get()
  findAll() {
    return this.bannersService.findAll();
  }
}
