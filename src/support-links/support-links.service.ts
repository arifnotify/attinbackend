import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  SupportLink,
  SupportLinkDocument,
} from './schemas/support-link.schema';

import { UpdateSupportLinkDto } from './dto/update-support-link.dto';

@Injectable()
export class SupportLinksService {
  constructor(
    @InjectModel(SupportLink.name)
    private readonly model: Model<SupportLinkDocument>,
  ) {}

  // ==========================
  // CREATE / UPDATE
  // ==========================
  async updateLinks(dto: UpdateSupportLinkDto) {
    const existing = await this.model.findOne();

    if (!existing) {
      return await this.model.create(dto);
    }

    Object.assign(existing, dto);

    return await existing.save();
  }

  // ==========================
  // GET LINKS
  // ==========================
  async getLinks() {
    const links = await this.model.findOne();

    if (!links) {
      throw new NotFoundException('Support links not found');
    }

    return links;
  }
}
