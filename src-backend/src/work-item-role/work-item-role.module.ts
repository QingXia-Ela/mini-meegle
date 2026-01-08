import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { WorkItemRole } from './work-item-role.model';
import { WorkItemRoleService } from './work-item-role.service';
import { WorkItemRoleController } from './work-item-role.controller';
import { WorkItemModule } from '../work-item/work-item.module';

@Module({
  imports: [
    SequelizeModule.forFeature([WorkItemRole]),
    WorkItemModule,
  ],
  providers: [WorkItemRoleService],
  controllers: [WorkItemRoleController],
  exports: [WorkItemRoleService],
})
export class WorkItemRoleModule {}
