import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

import { AdminService } from './admin.service';

import { CreateAdminDto } from './dto/create-admin.dto';

import { LoginAdminDto } from './dto/login-admin.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  // SIGNUP
  @Post('signup')
  signup(
    @Body()
    createAdminDto: CreateAdminDto,
  ) {
    return this.adminService.signup(createAdminDto);
  }

  // LOGIN
  @Post('login')
  login(
    @Body()
    loginAdminDto: LoginAdminDto,
  ) {
    return this.adminService.login(loginAdminDto);
  }

  // CURRENT ADMIN
  @UseGuards(JwtAuthGuard)
  @Get('me')
  getMe(@Req() req: any) {
    return this.adminService.getCurrentAdmin(req.user.adminId);
  }
}
