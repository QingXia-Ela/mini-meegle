import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Favorite } from '../favorite.model';
import { TaskService } from '../../task/task.service';

const TASK_FAVORITE_TYPE = 'task';

@Injectable()
export class TaskFavoritesService {
  constructor(
    @InjectModel(Favorite) private favoriteModel: typeof Favorite,
    private taskService: TaskService,
  ) {}

  async create(tid: number, uid: number) {
    await this.taskService.findOne(tid);
    const existing = await this.favoriteModel.findOne({
      where: { type: TASK_FAVORITE_TYPE, tid, uid },
    });
    if (existing) return existing;
    return this.favoriteModel.create({
      uid,
      type: TASK_FAVORITE_TYPE,
      tid,
    });
  }

  async findAll(uid: number) {
    return this.favoriteModel.findAll({
      where: { type: TASK_FAVORITE_TYPE, uid },
      order: [['createdAt', 'DESC']],
    });
  }

  async isFavorited(tid: number, uid: number) {
    const count = await this.favoriteModel.count({
      where: { type: TASK_FAVORITE_TYPE, tid, uid },
    });
    return count > 0;
  }

  async remove(tid: number, uid: number) {
    const existing = await this.favoriteModel.findOne({
      where: { type: TASK_FAVORITE_TYPE, tid, uid },
    });
    if (!existing) throw new NotFoundException('Favorite not found');
    await existing.destroy();
  }
}
