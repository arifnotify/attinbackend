import { Body, Controller, Post } from '@nestjs/common';
import { AdminService } from './admin.service';

@Controller('admin')
export class AdminController {
  constructor(private adminService: AdminService) {}

  @Post('signup')
  signup(@Body() body: any) {
    return this.adminService.signup(body);
  }

  @Post('login')
  login(@Body() body: any) {
    return this.adminService.login(body);
  }
}
