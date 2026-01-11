import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WorkItemField } from './work-item-field.model';
import { WorkItemFieldService } from './work-item-field.service';
import { WorkItemFieldController } from './work-item-field.controller';
import { WorkItemModule } from '../work-item/work-item.module';

@Module({
  imports: [
    SequelizeModule.forFeature([WorkItemField]),
    WorkItemModule,
  ],
  providers: [WorkItemFieldService],
  controllers: [WorkItemFieldController],
  exports: [WorkItemFieldService],
})
export class WorkItemFieldModule {}

