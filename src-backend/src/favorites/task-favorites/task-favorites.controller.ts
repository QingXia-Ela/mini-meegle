import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Req,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { TaskFavoritesService } from './task-favorites.service';
import { CreateTaskFavoriteDto } from './dto/create-task-favorite.dto';

@Controller('task-favorites')
export class TaskFavoritesController {
  constructor(private readonly service: TaskFavoritesService) {}

  @Post()
  create(@Body() dto: CreateTaskFavoriteDto, @Req() req: any) {
    const uid = req.user?.sub ?? dto.uid;
    if (!uid) {
      throw new BadRequestException('Missing user id');
    }
    return this.service.create(Number(dto.tid), Number(uid));
  }

  @Get()
  findAll(@Req() req: any, @Query('uid') uid?: string) {
    const userId = req.user?.sub ?? (uid ? Number(uid) : undefined);
    if (!userId) return [];
    return this.service.findAll(Number(userId));
  }

  @Get(':tid/status')
  async getStatus(
    @Param('tid') tid: string,
    @Req() req: any,
    @Query('uid') uid?: string,
  ) {
    const userId = req.user?.sub ?? (uid ? Number(uid) : undefined);
    if (!userId) return { favorited: false };
    const favorited = await this.service.isFavorited(Number(tid), Number(userId));
    return { favorited };
  }

  @Delete(':tid')
  remove(@Param('tid') tid: string, @Req() req: any, @Query('uid') uid?: string) {
    const userId = req.user?.sub ?? (uid ? Number(uid) : undefined);
    if (!userId) {
      throw new BadRequestException('Missing user id');
    }
    return this.service.remove(Number(tid), Number(userId));
  }
}
