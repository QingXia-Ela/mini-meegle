import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { SpaceUser } from './space-user.model';
import { User } from '../user/user.model';
import { QuerySpaceUserDto } from './dto/query-space-user.dto';

import { SpacePermission } from './space-user-permission.enum';

@Injectable()
export class SpaceUserService {
  constructor(
    @InjectModel(SpaceUser)
    private spaceUserModel: typeof SpaceUser,
  ) {}

  async findSpaceUsers(query: QuerySpaceUserDto) {
    const { sid, permission, offset = 0, limit = 20 } = query;
    
    // 强制限制最大 100
    const safeLimit = Math.min(Number(limit), 100);
    const safeOffset = Number(offset);

    const where: any = { sid };
    if (permission) {
      where.space_permission = permission;
    }

    const { rows, count } = await this.spaceUserModel.findAndCountAll({
      where,
      include: [
        {
          model: User,
          attributes: ['id', 'name', 'email', 'avatar'],
        },
      ],
      offset: safeOffset,
      limit: safeLimit,
    });

    return {
      items: rows,
      total: count,
    };
  }

  async addSpaceUsers(sid: string, uids: number[], permission: SpacePermission = SpacePermission.MEMBER) {
    const records = uids.map((uid) => ({
      sid,
      uid,
      space_permission: permission,
    }));

    return this.spaceUserModel.bulkCreate(records, {
      ignoreDuplicates: true,
    });
  }

  async findAllSpaceUserIds(sid: string): Promise<number[]> {
    const users = await this.spaceUserModel.findAll({
      where: { sid },
      attributes: ['uid'],
    });
    return users.map((u) => u.uid);
  }
}

