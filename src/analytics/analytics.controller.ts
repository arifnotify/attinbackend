import { Controller, Get, UseGuards } from '@nestjs/common';

import { AnalyticsService } from './analytics.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  // DASHBOARD SUMMARY
  @UseGuards(JwtAuthGuard)
  @Get('summary')
  getDashboardSummary() {
    return this.analyticsService.getDashboardSummary();
  }

  // MONTHLY SALES
  @UseGuards(JwtAuthGuard)
  @Get('monthly-sales')
  getMonthlySales() {
    return this.analyticsService.getMonthlySales();
  }

  // RECENT ORDERS
  @UseGuards(JwtAuthGuard)
  @Get('recent-orders')
  getRecentOrders() {
    return this.analyticsService.getRecentOrders();
  }

  // TOP PRODUCTS
  @UseGuards(JwtAuthGuard)
  @Get('top-products')
  getTopProducts() {
    return this.analyticsService.getTopProducts();
  }
}
