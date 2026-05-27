import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';

import { FlashSaleService } from './flash-sale.service';

import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('flash-sale')
export class FlashSaleController {
  constructor(private flashSaleService: FlashSaleService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(
    @Body()
    createFlashSaleDto: CreateFlashSaleDto,
  ) {
    return this.flashSaleService.create(createFlashSaleDto);
  }

  @Get()
  findAll() {
    return this.flashSaleService.findAll();
  }

  // MANUAL TEST
  @Get('restore')
  restoreExpiredSales() {
    return this.flashSaleService.restoreExpiredFlashSales();
  }
}
