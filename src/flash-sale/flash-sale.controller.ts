import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { FlashSaleService } from './flash-sale.service';

import { CreateFlashSaleDto } from './dto/create-flash-sale.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('flash-sale')
export class FlashSaleController {
  constructor(private flashSaleService: FlashSaleService) {}

  // CREATE FLASH SALE
  @UseGuards(JwtAuthGuard)
  @Post()
  createFlashSale(
    @Body()
    createFlashSaleDto: CreateFlashSaleDto,
  ) {
    return this.flashSaleService.createFlashSale(createFlashSaleDto);
  }

  // ACTIVE FLASH SALES
  @Get()
  getActiveFlashSales() {
    return this.flashSaleService.getActiveFlashSales();
  }

  // ADMIN ALL FLASH SALES
  @UseGuards(JwtAuthGuard)
  @Get('admin/all')
  getAllFlashSales() {
    return this.flashSaleService.getAllFlashSales();
  }

  // EXPIRE SALES
  @Post('expire')
  expireFlashSales() {
    return this.flashSaleService.expireFlashSales();
  }

  // DELETE FLASH SALE
  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  deleteFlashSale(@Param('id') id: string) {
    return this.flashSaleService.deleteFlashSale(id);
  }
}
