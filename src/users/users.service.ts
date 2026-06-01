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

  // GET ALL USERS
  async getUsers() {
    return this.userModel.find().sort({
      createdAt: -1,
    });
  }

  // FIND USER
  async findByPhone(phone: string) {
    return this.userModel.findOne({
      phone,
    });
  }

  // CREATE USER
  async create(phone: string) {
    return this.userModel.create({
      phone,
    });
  }

  // BLOCK USER
  async blockUser(phone: string, reason: string) {
    return this.userModel.findOneAndUpdate(
      { phone },
      {
        isBlocked: true,
        blockReason: reason,
      },
      {
        new: true,
      },
    );
  }

  // UNBLOCK USER
  async unblockUser(phone: string) {
    return this.userModel.findOneAndUpdate(
      { phone },
      {
        isBlocked: false,
        blockReason: '',
      },
      {
        new: true,
      },
    );
  }

  async getUserById(id: string) {
    return this.userModel.findById(id);
  }
}
