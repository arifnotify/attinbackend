import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SupportLink, SupportLinkSchema } from './schemas/support-link.schema';

import { SupportLinksService } from './support-links.service';
import { SupportLinksController } from './support-links.controller';

import { AuthModule } from '../auth/auth.module'; // 🔥 ADD THIS
import { SocketGateway } from 'src/socket/socket.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SupportLink.name,
        schema: SupportLinkSchema,
      },
    ]),
    AuthModule, // 🔥 THIS IS THE FIX
  ],

  controllers: [SupportLinksController],
  providers: [SupportLinksService, SocketGateway],
})
export class SupportLinksModule {}
