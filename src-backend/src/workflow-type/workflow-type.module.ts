import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WorkflowType } from './workflow-type.model';
import { WorkflowTypeService } from './workflow-type.service';
import { WorkflowTypeController } from './workflow-type.controller';
import { Task } from 'src/task/task.model';

@Module({
  imports: [SequelizeModule.forFeature([WorkflowType, Task])],
  controllers: [WorkflowTypeController],
  providers: [WorkflowTypeService],
  exports: [WorkflowTypeService],
})
export class WorkflowTypeModule {}
