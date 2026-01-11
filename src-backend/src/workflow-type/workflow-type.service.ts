import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { WorkflowType } from './workflow-type.model';
import { CreateWorkflowTypeDto } from './dto/create-workflow-type.dto';
import { UpdateWorkflowTypeDto } from './dto/update-workflow-type.dto';

@Injectable()
export class WorkflowTypeService {
  constructor(
    @InjectModel(WorkflowType) private workflowTypeModel: typeof WorkflowType,
  ) {}

  async create(dto: CreateWorkflowTypeDto): Promise<WorkflowType> {
    return this.workflowTypeModel.create(dto as any);
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
    await tt.destroy();
  }
}
