import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  SupportLink,
  SupportLinkDocument,
} from './schemas/support-link.schema';

@Injectable()
export class SupportLinksService {
  constructor(
    @InjectModel(SupportLink.name)
    private model: Model<SupportLinkDocument>,
  ) {}

  // =========================
  // ADMIN: CREATE / UPDATE LINKS
  // =========================
  async updateLinks(dto: any) {
    const existing = await this.model.findOne();

    if (!existing) {
      return this.model.create(dto);
    }

    return this.model.findByIdAndUpdate(existing._id, dto, { new: true });
  }

  // =========================
  // USER: GET LINKS
  // =========================
  async getLinks() {
    return this.model.findOne();
  }
}
