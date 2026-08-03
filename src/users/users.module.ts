import { Module } from '@nestjs/common';

import { UsersService } from './users.service';

import { UsersController } from './users.controller';

import { MongooseModule } from '@nestjs/mongoose';

import { User, UserSchema } from './schemas/user.schema';
import { RewardSettingsModule } from 'src/reward-settings/reward-settings.module';
import { SocketModule } from 'src/socket/socket.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: User.name,
        schema: UserSchema,
      },
    ]),
    RewardSettingsModule,
    SocketModule,
  ],

  controllers: [UsersController],

  providers: [UsersService],

  exports: [UsersService],
})
export class UsersModule {}
