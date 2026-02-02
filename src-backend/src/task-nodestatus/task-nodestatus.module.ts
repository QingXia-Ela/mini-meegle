import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { TaskNodeStatus } from './task-nodestatus.model';
import { TaskNodeStatusService } from './task-nodestatus.service';
import { TaskNodeStatusController } from './task-nodestatus.controller';
import { TaskModule } from '../task/task.module';
import { WorkflowTypeModule } from '../workflow-type/workflow-type.module';

@Module({
  imports: [
    SequelizeModule.forFeature([TaskNodeStatus]),
    TaskModule,
    WorkflowTypeModule,
  ],
  providers: [TaskNodeStatusService],
  controllers: [TaskNodeStatusController],
  exports: [SequelizeModule, TaskNodeStatusService],
})
export class TaskNodeStatusModule {}
