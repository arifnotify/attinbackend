import { Injectable } from '@nestjs/common';

import { InjectModel } from '@nestjs/mongoose';

import { Model } from 'mongoose';

import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {}

  async findByPhone(phone: string) {
    return this.userModel.findOne({
      phone,
    });
  }

  async create(phone: string) {
    return this.userModel.create({
      phone,
    });
  }
}