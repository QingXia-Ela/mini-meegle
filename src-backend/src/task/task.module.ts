import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Task } from './task.model';
import { Favorite } from '../favorites/favorite.model';
import { RecentView } from '../recent-view/recent-view.model';
import { TaskNodeStatus } from '../task-nodestatus/task-nodestatus.model';
import { WorkItem } from '../work-item/work-item.model';
import { Space } from '../space/space.model';
import { WorkItemField } from '../work-item-field/work-item-field.model';
import { TaskService } from './task.service';
import { TaskController } from './task.controller';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Task,
      Favorite,
      RecentView,
      TaskNodeStatus,
      WorkItem,
      Space,
      WorkItemField,
    ]),
  ],
  providers: [TaskService],
  controllers: [TaskController],
  exports: [TaskService],
})
export class TaskModule {}
