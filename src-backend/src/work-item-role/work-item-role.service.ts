import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Transaction } from 'sequelize';
import { WorkItemRole } from './work-item-role.model';
import { CreateWorkItemRoleDto } from './dto/create-work-item-role.dto';
import { UpdateWorkItemRoleDto } from './dto/update-work-item-role.dto';
import { WorkItemService } from '../work-item/work-item.service';

@Injectable()
export class WorkItemRoleService {
  constructor(
    @InjectModel(WorkItemRole)
    private workItemRoleModel: typeof WorkItemRole,
    private workItemService: WorkItemService,
  ) {}

  async findByWorkItemId(wid: string): Promise<WorkItemRole[]> {
    await this.workItemService.findOne(wid); // 确保工作项存在
    return this.workItemRoleModel.findAll({
      where: { wid },
      order: [['createdAt', 'ASC']],
    });
  }

  async create(
    wid: string,
    dto: CreateWorkItemRoleDto,
    transaction?: Transaction,
  ): Promise<WorkItemRole> {
    await this.workItemService.findOne(wid, transaction); // 确保工作项存在
    return this.workItemRoleModel.create(
      {
        ...dto,
        wid,
      },
      { transaction },
    );
  }

  async update(id: string, dto: UpdateWorkItemRoleDto): Promise<WorkItemRole> {
    const role = await this.workItemRoleModel.findByPk(id);
    if (!role) throw new NotFoundException('Role not found');
    return role.update(dto);
  }

  async remove(id: string): Promise<void> {
    const role = await this.workItemRoleModel.findByPk(id);
    if (!role) throw new NotFoundException('Role not found');
    await role.destroy();
  }
}
