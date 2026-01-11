import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Task } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task) private taskModel: typeof Task,
  ) {}

  async create(dto: CreateTaskDto, userId: number): Promise<Task> {
    return this.taskModel.create({
      ...dto,
      creator: userId,
    } as any);
  }

  async findAll(): Promise<Task[]> {
    return this.taskModel.findAll();
  }

  async findOne(id: number): Promise<Task> {
    const t = await this.taskModel.findByPk(id);
    if (!t) throw new NotFoundException('Task not found');
    return t;
  }

  async findByWorkItemId(
    workItemId: string,
    limit: number = 10,
    offset: number = 0,
  ): Promise<{ rows: Task[]; count: number }> {
    return this.taskModel.findAndCountAll({
      where: { wid: workItemId },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  }

  async getStats(workItemId: string, userId: number) {
    const total = await this.taskModel.count({
      where: { wid: workItemId },
    });

    const participants = await this.taskModel.count({
      where: { wid: workItemId },
      distinct: true,
      col: 'creator',
    });

    const myParticipated = await this.taskModel.count({
      where: { wid: workItemId, creator: userId },
    });

    return {
      total,
      participants,
      myParticipated,
    };
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
