import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';

import { SupportLink, SupportLinkSchema } from './schemas/support-link.schema';

import { SupportLinksService } from './support-links.service';
import { SupportLinksController } from './support-links.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: SupportLink.name,
        schema: SupportLinkSchema,
      },
    ]),
  ],

  controllers: [SupportLinksController],
  providers: [SupportLinksService],
})
export class SupportLinksModule {}
