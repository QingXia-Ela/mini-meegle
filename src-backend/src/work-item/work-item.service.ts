import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WorkItem } from './work-item.model';
import { WorkItemSpace } from './work-item-space.model';
import { CreateWorkItemDto } from './dto/create-work-item.dto';
import { UpdateWorkItemDto } from './dto/update-work-item.dto';

@Injectable()
export class WorkItemService {
  constructor(
    @InjectModel(WorkItem) private workItemModel: typeof WorkItem,
    @InjectModel(WorkItemSpace)
    private workItemSpaceModel: typeof WorkItemSpace,
  ) {}

  async create(dto: CreateWorkItemDto): Promise<WorkItem> {
    if (dto.id) {
      const existing = await this.workItemModel.findByPk(dto.id);
      if (existing) {
        throw new ConflictException('Work item ID already exists');
      }
    }
    const workItem = await this.workItemModel.create(dto as any);
    // 添加到工作项-空间关系表
    await this.workItemSpaceModel.create({
      sid: dto.sid,
      wid: workItem.id,
    });
    return workItem;
  }

  async findAll(): Promise<WorkItem[]> {
    return this.workItemModel.findAll();
  }

  async findOne(id: string): Promise<WorkItem> {
    const w = await this.workItemModel.findByPk(id);
    if (!w) throw new NotFoundException('WorkItem not found');
    return w;
  }

  async findBySpaceId(spaceId: string): Promise<WorkItem[]> {
    return this.workItemModel.findAll({
      where: { sid: spaceId },
    });
  }

  async update(id: string, dto: UpdateWorkItemDto): Promise<WorkItem> {
    const w = await this.findOne(id);
    return w.update(dto as any);
  }

  async remove(id: string): Promise<void> {
    const w = await this.findOne(id);
    await w.destroy();
  }
}
