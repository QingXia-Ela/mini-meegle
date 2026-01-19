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

  async create(tid: number) {
    await this.taskService.findOne(tid);
    const existing = await this.favoriteModel.findOne({
      where: { type: TASK_FAVORITE_TYPE, tid },
    });
    if (existing) return existing;
    return this.favoriteModel.create({
      type: TASK_FAVORITE_TYPE,
      tid,
    });
  }

  async findAll() {
    return this.favoriteModel.findAll({
      where: { type: TASK_FAVORITE_TYPE },
      order: [['createdAt', 'DESC']],
    });
  }

  async isFavorited(tid: number) {
    const count = await this.favoriteModel.count({
      where: { type: TASK_FAVORITE_TYPE, tid },
    });
    return count > 0;
  }

  async remove(tid: number) {
    const existing = await this.favoriteModel.findOne({
      where: { type: TASK_FAVORITE_TYPE, tid },
    });
    if (!existing) throw new NotFoundException('Favorite not found');
    await existing.destroy();
  }
}
