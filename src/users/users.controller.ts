import { Controller, Get, Param, Patch, Body } from '@nestjs/common';

import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  @Get(':id')
  getUserById(@Param('id') id: string) {
    return this.usersService.getUserById(id);
  }

  @Patch('block')
  blockUser(@Body() body: any) {
    return this.usersService.blockUser(body.phone, body.reason);
  }

  @Patch('unblock')
  unblockUser(@Body() body: any) {
    return this.usersService.unblockUser(body.phone);
  }
}
