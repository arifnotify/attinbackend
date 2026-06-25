import { Controller, Get, Post, Body } from '@nestjs/common';
import { SupportLinksService } from './support-links.service';
import { UpdateSupportLinkDto } from './dto/update-support-link.dto';

@Controller('support-links')
export class SupportLinksController {
  constructor(private readonly service: SupportLinksService) {}

  // =========================
  // ADMIN: UPDATE LINKS
  // =========================
  @Post('admin/update')
  update(@Body() dto: UpdateSupportLinkDto) {
    return this.service.updateLinks(dto);
  }

  // USER: GET LINKS
  // =========================
  @Get()
  get() {
    return this.service.getLinks();
  }
}
