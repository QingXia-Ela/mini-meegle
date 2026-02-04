import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Op, Transaction } from 'sequelize';
import { WorkflowType } from './workflow-type.model';
import { CreateWorkflowTypeDto } from './dto/create-workflow-type.dto';
import { UpdateWorkflowTypeDto } from './dto/update-workflow-type.dto';
import { Task } from 'src/task/task.model';

@Injectable()
export class WorkflowTypeService {
  constructor(
    @InjectModel(WorkflowType) private workflowTypeModel: typeof WorkflowType,
    @InjectModel(Task) private taskModel: typeof Task,
  ) {}

  async create(
    dto: CreateWorkflowTypeDto,
    transaction?: Transaction,
  ): Promise<WorkflowType> {
    return this.workflowTypeModel.create(dto as any, { transaction });
  }

  async findAll(): Promise<WorkflowType[]> {
    return this.workflowTypeModel.findAll();
  }

  async findByWorkItemId(wid: string): Promise<WorkflowType[]> {
    return this.workflowTypeModel.findAll({ where: { wid } });
  }

  async findOne(id: number): Promise<WorkflowType> {
    const tt = await this.workflowTypeModel.findByPk(id);
    if (!tt) throw new NotFoundException('WorkflowType not found');
    return tt;
  }

  async update(id: number, dto: UpdateWorkflowTypeDto): Promise<WorkflowType> {
    const tt = await this.findOne(id);
    return tt.update(dto as any);
  }

  async remove(id: number): Promise<void> {
    const tt = await this.findOne(id);

    // 检查是否有任务正在引用此流程
    // 同时检查物理列和 fieldStatusListRaw JSON 字符串
    const taskCount = await this.taskModel.count({
      where: { workflowType: id },
    });

    if (taskCount > 0) {
      throw new BadRequestException(
        `无法删除流程：当前有 ${taskCount} 个任务正在使用此流程。`,
      );
    }

    await tt.destroy();
  }
}
