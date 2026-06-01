import { Controller, Patch, Body, Get } from '@nestjs/common';

import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

  // GET ALL USERS
  @Get()
  getUsers() {
    return this.usersService.getUsers();
  }

  // BLOCK USER
  @Patch('block')
  blockUser(@Body() body: any) {
    return this.usersService.blockUser(body.phone, body.reason);
  }

  // UNBLOCK USER
  @Patch('unblock')
  unblockUser(@Body() body: any) {
    return this.usersService.unblockUser(body.phone);
  }
}
