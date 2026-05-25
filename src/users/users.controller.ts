import { Controller, Patch, Body } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  constructor(private usersService: UsersService) {}

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