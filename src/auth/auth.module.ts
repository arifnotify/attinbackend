import { Module } from '@nestjs/common';

import { JwtModule } from '@nestjs/jwt';

import { PassportModule } from '@nestjs/passport';

import { AuthService } from './auth.service';

import { UsersModule } from '../users/users.module';

import { AdminModule } from '../admin/admin.module';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    UsersModule,
    AdminModule,

    PassportModule,

    JwtModule.register({
      secret: process.env.JWT_SECRET,

      signOptions: {
        expiresIn: '7d',
      },
    }),
  ],

  providers: [AuthService, JwtStrategy],

  exports: [JwtModule],
})
export class AuthModule {}
