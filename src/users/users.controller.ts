import { Body, Controller, Get, Param, Patch } from '@nestjs/common';

import { UsersService } from './users.service';

import { CustomerType } from './schemas/user.schema';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // ===========================
  // GET ALL USERS
  // ===========================
  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  // ===========================
  // GET SINGLE USER
  // ===========================
  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  // ===========================
  // BLOCK USER
  // ===========================
  @Patch('block')
  blockUser(@Body() body: { phone: string; reason: string }) {
    return this.usersService.blockUser(body.phone, body.reason);
  }

  // ===========================
  // UNBLOCK USER
  // ===========================
  @Patch('unblock')
  unblockUser(@Body() body: { phone: string }) {
    return this.usersService.unblockUser(body.phone);
  }

  // ===========================
  // UPDATE CUSTOMER TYPE
  // ===========================
  @Patch(':id/customer-type')
  updateCustomerType(
    @Param('id') id: string,
    @Body()
    body: {
      customerType: CustomerType;
    },
  ) {
    return this.usersService.updateCustomerType(id, body.customerType);
  }

  // ===========================
  // UPDATE CUSTOMER LEVEL
  // ===========================
  @Patch(':id/check-level')
  checkCustomerLevel(@Param('id') id: string) {
    return this.usersService.checkCustomerLevel(id);
  }
}
