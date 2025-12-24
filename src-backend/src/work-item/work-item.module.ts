import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WorkItem } from './work-item.model';
import { WorkItemSpace } from './work-item-space.model';
import { WorkItemService } from './work-item.service';
import { WorkItemController } from './work-item.controller';

@Module({
  imports: [SequelizeModule.forFeature([WorkItem, WorkItemSpace])],
  providers: [WorkItemService],
  controllers: [WorkItemController],
  exports: [WorkItemService],
})
export class WorkItemModule {}
