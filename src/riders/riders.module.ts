import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';

import { RidersController } from './riders.controller';
import { RidersService } from './riders.service';

import { Rider, RiderSchema } from './schemas/rider.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Rider.name, schema: RiderSchema }]),
    JwtModule.register({
      secret: 'SECRET_KEY',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [RidersController],
  providers: [RidersService],
})
export class RidersModule {}
