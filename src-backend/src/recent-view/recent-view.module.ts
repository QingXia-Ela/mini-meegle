import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { RecentView } from './recent-view.model';
import { RecentViewService } from './recent-view.service';
import { RecentViewController } from './recent-view.controller';

@Module({
  imports: [SequelizeModule.forFeature([RecentView])],
  providers: [RecentViewService],
  controllers: [RecentViewController],
  exports: [RecentViewService],
})
export class RecentViewModule {}
