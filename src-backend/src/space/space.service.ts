import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Space } from './space.model';
import { SpaceUser } from './space-user.model';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';

@Injectable()
export class SpaceService {
  constructor(
    @InjectModel(Space) private spaceModel: typeof Space,
    @InjectModel(SpaceUser) private spaceUserModel: typeof SpaceUser,
  ) {}

  async create(dto: CreateSpaceDto, userId: number): Promise<Space> {
    const space = await this.spaceModel.create(dto as any);
    // 将创建者添加到空间-用户关系表
    await this.spaceUserModel.create({
      uid: userId,
      sid: space.id,
    });
    return space;
  }

  async findAll(): Promise<Space[]> {
    return this.spaceModel.findAll();
  }

  async findOne(id: string): Promise<Space> {
    const s = await this.spaceModel.findByPk(id);
    if (!s) throw new NotFoundException('Space not found');
    return s;
  }

  async update(id: string, dto: UpdateSpaceDto): Promise<Space> {
    const s = await this.findOne(id);
    return s.update(dto as any);
  }

  async remove(id: string): Promise<void> {
    const s = await this.findOne(id);
    await s.destroy();
  }

  async findByUserId(userId: number): Promise<Space[]> {
    const spaceUsers = await this.spaceUserModel.findAll({
      where: { uid: userId },
    });
    const spaceIds = spaceUsers.map((su) => su.sid);
    if (spaceIds.length === 0) return [];
    return this.spaceModel.findAll({
      where: { id: spaceIds },
    });
  }
}
