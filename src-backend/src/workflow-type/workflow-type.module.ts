import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WorkflowType } from './workflow-type.model';
import { WorkflowTypeService } from './workflow-type.service';
import { WorkflowTypeController } from './workflow-type.controller';

@Module({
  imports: [SequelizeModule.forFeature([WorkflowType])],
  controllers: [WorkflowTypeController],
  providers: [WorkflowTypeService],
  exports: [WorkflowTypeService],
})
export class WorkflowTypeModule {}
