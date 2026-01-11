import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WorkItemField } from './work-item-field.model';
import { CreateWorkItemFieldDto } from './dto/create-work-item-field.dto';
import { UpdateWorkItemFieldDto } from './dto/update-work-item-field.dto';
import { WorkItemService } from '../work-item/work-item.service';

@Injectable()
export class WorkItemFieldService {
  constructor(
    @InjectModel(WorkItemField)
    private workItemFieldModel: typeof WorkItemField,
    private workItemService: WorkItemService,
  ) {}

  async findByWorkItemId(wid: string): Promise<WorkItemField[]> {
    await this.workItemService.findOne(wid); // 确保工作项存在
    return this.workItemFieldModel.findAll({
      where: { wid },
      order: [['createdAt', 'ASC']],
    });
  }

  async findOne(wid: string, id: string): Promise<WorkItemField> {
    const field = await this.workItemFieldModel.findOne({
      where: { id, wid },
    });
    if (!field) throw new NotFoundException('Field not found in this work item');
    return field;
  }

  async create(wid: string, dto: CreateWorkItemFieldDto): Promise<WorkItemField> {
    await this.workItemService.findOne(wid); // 确保工作项存在
    return this.workItemFieldModel.create({
      ...dto,
      wid,
    });
  }

  async update(wid: string, id: string, dto: UpdateWorkItemFieldDto): Promise<WorkItemField> {
    const field = await this.findOne(wid, id);
    return field.update(dto);
  }

  async remove(wid: string, id: string): Promise<void> {
    const field = await this.findOne(wid, id);
    if (field.systemType === 'system') {
      throw new Error('System fields cannot be deleted');
    }
    await field.destroy();
  }
}

