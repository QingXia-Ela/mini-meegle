import { Injectable } from '@nestjs/common';
import { TaskFavoritesService } from './task-favorites/task-favorites.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly taskFavoritesService: TaskFavoritesService) {}

  async findAll(uid: number) {
    const taskFavorites = await this.taskFavoritesService.findAll(uid);
    return taskFavorites;
  }
}
