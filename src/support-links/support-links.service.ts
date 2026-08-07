import { Injectable, NotFoundException } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';

import {
  SupportLink,
  SupportLinkDocument,
} from './schemas/support-link.schema';

import { UpdateSupportLinkDto } from './dto/update-support-link.dto';
import { SocketGateway } from 'src/socket/socket.gateway';

@Injectable()
export class SupportLinksService {
  constructor(
    @InjectModel(SupportLink.name)
    private readonly model: Model<SupportLinkDocument>,

    private readonly socketGateway: SocketGateway,
  ) {}

  // ==========================
  // CREATE / UPDATE
  // ==========================
async updateLinks(dto: UpdateSupportLinkDto) {
  const existing = await this.model.findOne();

  let result;

  if (!existing) {
    result = await this.model.create(dto);
  } else {
    Object.assign(existing, dto);
    result = await existing.save();
  }

  this.socketGateway.emitSupportLinksUpdated(result);

    return result;
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
