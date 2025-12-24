import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Task } from './task.model';
import { WorkItemTask } from './work-item-task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task) private taskModel: typeof Task,
    @InjectModel(WorkItemTask) private workItemTaskModel: typeof WorkItemTask,
  ) {}

  async create(dto: CreateTaskDto): Promise<Task> {
    const task = await this.taskModel.create(dto as any);
    // 添加到工作项-任务关系表
    await this.workItemTaskModel.create({
      wid: dto.wid,
      tid: task.id,
    });
    return task;
  }

  async findAll(): Promise<Task[]> {
    return this.taskModel.findAll();
  }

  async findOne(id: number): Promise<Task> {
    const t = await this.taskModel.findByPk(id);
    if (!t) throw new NotFoundException('Task not found');
    return t;
  }

  async findByWorkItemId(workItemId: string): Promise<Task[]> {
    return this.taskModel.findAll({
      where: { wid: workItemId },
    });
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const t = await this.findOne(id);
    return t.update(dto as any);
  }

  async remove(id: number): Promise<void> {
    const t = await this.findOne(id);
    await t.destroy();
  }
}
