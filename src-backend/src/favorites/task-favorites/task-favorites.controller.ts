import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { TaskFavoritesService } from './task-favorites.service';
import { CreateTaskFavoriteDto } from './dto/create-task-favorite.dto';

@Controller('task-favorites')
export class TaskFavoritesController {
  constructor(private readonly service: TaskFavoritesService) {}

  @Post()
  create(@Body() dto: CreateTaskFavoriteDto) {
    return this.service.create(Number(dto.tid));
  }

  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':tid/status')
  async getStatus(@Param('tid') tid: string) {
    const favorited = await this.service.isFavorited(Number(tid));
    return { favorited };
  }

  @Delete(':tid')
  remove(@Param('tid') tid: string) {
    return this.service.remove(Number(tid));
  }
}
