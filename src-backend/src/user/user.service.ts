import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  async create(dto: CreateUserDto): Promise<User> {
    return this.userModel.create(dto as any);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async findOne(id: number): Promise<User> {
    const u = await this.userModel.findByPk(id);
    if (!u) throw new NotFoundException('User not found');
    return u;
  }

  async update(id: number, dto: UpdateUserDto): Promise<User> {
    const u = await this.findOne(id);
    return u.update(dto as any);
  }

  async remove(id: number): Promise<void> {
    const u = await this.findOne(id);
    await u.destroy();
  }
}
