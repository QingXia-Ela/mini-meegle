import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Space } from './space.model';
import { SpaceService } from './space.service';
import { SpaceController } from './space.controller';
import { SpaceUserModule } from '../space-user/space-user.module';
import { WorkItemModule } from '../work-item/work-item.module';
import { WorkItemFieldModule } from '../work-item-field/work-item-field.module';
import { WorkItemRoleModule } from '../work-item-role/work-item-role.module';
import { WorkflowTypeModule } from '../workflow-type/workflow-type.module';
import { TaskModule } from '../task/task.module';
import { WorkItem } from '../work-item/work-item.model';
import { WorkItemSpace } from '../work-item/work-item-space.model';
import { WorkItemField } from '../work-item-field/work-item-field.model';
import { WorkItemRole } from '../work-item-role/work-item-role.model';
import { WorkflowType } from '../workflow-type/workflow-type.model';
import { Task } from '../task/task.model';
import { TaskNodeStatus } from '../task-nodestatus/task-nodestatus.model';

@Module({
  imports: [
    SequelizeModule.forFeature([
      Space,
      WorkItem,
      WorkItemSpace,
      WorkItemField,
      WorkItemRole,
      WorkflowType,
      Task,
      TaskNodeStatus,
    ]),
    SpaceUserModule,
    WorkItemModule,
    WorkItemFieldModule,
    WorkItemRoleModule,
    WorkflowTypeModule,
    TaskModule,
  ],
  providers: [SpaceService],
  controllers: [SpaceController],
  exports: [SpaceService],
})
export class SpaceModule {}
