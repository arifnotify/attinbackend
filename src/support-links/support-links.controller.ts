import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';

import { SupportLinksService } from './support-links.service';
import { UpdateSupportLinkDto } from './dto/update-support-link.dto';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';

@Controller('support-links')
export class SupportLinksController {
  constructor(private readonly service: SupportLinksService) {}

  // =====================================
  // ADMIN: UPDATE SUPPORT LINKS
  // =====================================
  @UseGuards(JwtAuthGuard)
  @Patch()
  async update(@Body() dto: UpdateSupportLinkDto) {
    return this.service.updateLinks(dto);
  }

  // =====================================
  // USER APP: GET SUPPORT LINKS
  // =====================================
  @Get()
  async get() {
    return this.service.getLinks();
  }
}
