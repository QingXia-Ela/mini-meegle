import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Favorite } from './favorite.model';
import { FavoritesService } from './favorites.service';
import { FavoritesController } from './favorites.controller';
import { TaskFavoritesModule } from './task-favorites/task-favorites.module';

@Module({
  imports: [SequelizeModule.forFeature([Favorite]), TaskFavoritesModule],
  providers: [FavoritesService],
  controllers: [FavoritesController],
  exports: [FavoritesService],
})
export class FavoritesModule {}
