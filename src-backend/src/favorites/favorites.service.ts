import { Injectable } from '@nestjs/common';
import { TaskFavoritesService } from './task-favorites/task-favorites.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly taskFavoritesService: TaskFavoritesService) {}

  async findAll() {
    const taskFavorites = await this.taskFavoritesService.findAll();
    return taskFavorites;
  }
}
