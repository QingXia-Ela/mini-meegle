import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Notice } from './notice.model';
import { Task } from '../task/task.model';
import { WorkItem } from '../work-item/work-item.model';
import { NoticeService } from './notice.service';
import { NoticeController } from './notice.controller';

@Module({
  imports: [SequelizeModule.forFeature([Notice, Task, WorkItem])],
  providers: [NoticeService],
  controllers: [NoticeController],
  exports: [NoticeService],
})
export class NoticeModule {}
