import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Favorite } from '../favorite.model';
import { TaskFavoritesService } from './task-favorites.service';
import { TaskFavoritesController } from './task-favorites.controller';
import { TaskModule } from '../../task/task.module';

@Module({
  imports: [SequelizeModule.forFeature([Favorite]), TaskModule],
  providers: [TaskFavoritesService],
  controllers: [TaskFavoritesController],
  exports: [TaskFavoritesService],
})
export class TaskFavoritesModule {}
