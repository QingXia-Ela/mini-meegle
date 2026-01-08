import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Space } from './space.model';
import { SpaceUser } from '../space-user/space-user.model';
import { CreateSpaceDto } from './dto/create-space.dto';
import { UpdateSpaceDto } from './dto/update-space.dto';
import { generateUniqueId } from '../utils/id-generator';
import { SpacePermission } from '../space-user/space-user-permission.enum';

@Injectable()
export class SpaceService {
  constructor(
    @InjectModel(Space) private spaceModel: typeof Space,
    @InjectModel(SpaceUser) private spaceUserModel: typeof SpaceUser,
  ) {}

  async create(dto: CreateSpaceDto, userId: number): Promise<Space> {
    // 生成唯一ID
    const id = await generateUniqueId(this.spaceModel, 6);

    // 创建空间，明确设置ID
    const space = await this.spaceModel.create({
      ...dto,
      id,
    } as any);

    // 将创建者添加到空间-用户关系表，并设为管理员
    await this.spaceUserModel.create({
      uid: userId,
      sid: space.id,
      space_permission: SpacePermission.MANAGER,
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

  async join(spaceId: string, userId: number): Promise<void> {
    // 检查空间是否存在
    const space = await this.findOne(spaceId);

    // 检查用户是否已经在空间中
    const existingUser = await this.spaceUserModel.findOne({
      where: { sid: spaceId, uid: userId },
    });

    if (existingUser) {
      // 用户已经在空间中，不需要重复加入
      return;
    }

    // 将用户添加到空间中，默认权限为member
    await this.spaceUserModel.create({
      uid: userId,
      sid: spaceId,
      space_permission: SpacePermission.MEMBER,
    });
  }
}
