import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Op } from 'sequelize';

@Injectable()
export class UserService {
  constructor(@InjectModel(User) private userModel: typeof User) {}

  async create(dto: CreateUserDto): Promise<User> {
    return this.userModel.create(dto as any);
  }

  async findAll(): Promise<User[]> {
    return this.userModel.findAll();
  }

  async findAndCount(query: {
    keyword?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ items: User[]; total: number }> {
    const { keyword, offset = 0, limit = 20 } = query;
    const safeLimit = Math.min(Number(limit), 100);
    const safeOffset = Number(offset);

    const where: any = {};
    if (keyword) {
      where[Op.or] = [
        { name: { [Op.like]: `%${keyword}%` } },
        { email: { [Op.like]: `%${keyword}%` } },
      ];
    }

    const { rows, count } = await this.userModel.findAndCountAll({
      where,
      offset: safeOffset,
      limit: safeLimit,
      attributes: { exclude: ['md5pwd'] },
    });

    return {
      items: rows,
      total: count,
    };
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
