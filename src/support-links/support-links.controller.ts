import { Body, Controller, Get, Patch } from '@nestjs/common';

import { SupportLinksService } from './support-links.service';
import { UpdateSupportLinkDto } from './dto/update-support-link.dto';

//import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('support-links')
export class SupportLinksController {
  constructor(private readonly service: SupportLinksService) {}

  // UPDATE
  //@UseGuards(JwtAuthGuard)
  @Patch()
  update(@Body() dto: UpdateSupportLinkDto) {
    return this.service.updateLinks(dto);
  }

  // GET
  @Get()
  get() {
    return this.service.getLinks();
  }
}
