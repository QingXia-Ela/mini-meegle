import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Task } from './task.model';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { Favorite } from '../favorites/favorite.model';
import { Op, Transaction } from 'sequelize';
import { RecentView, RecentViewType } from '../recent-view/recent-view.model';
import {
  TaskNodeStatus,
  NodeStatus,
} from '../task-nodestatus/task-nodestatus.model';
import { WorkItem } from '../work-item/work-item.model';
import { Space } from '../space/space.model';
import { WorkItemField } from '../work-item-field/work-item-field.model';

const TASK_FAVORITE_TYPE = 'task';

@Injectable()
export class TaskService {
  constructor(
    @InjectModel(Task) private taskModel: typeof Task,
    @InjectModel(Favorite) private favoriteModel: typeof Favorite,
    @InjectModel(RecentView) private recentViewModel: typeof RecentView,
    @InjectModel(TaskNodeStatus)
    private taskNodeStatusModel: typeof TaskNodeStatus,
    @InjectModel(WorkItemField)
    private workItemFieldModel: typeof WorkItemField,
  ) {}

  private getFieldValue(task: Task, fieldId: string) {
    const list = task.fieldStatusList || [];
    const matched = list.find((item) => item.fieldId === fieldId);
    return matched?.value ?? null;
  }

  private normalizeSchedule(value: unknown): [string, string] | null {
    if (!value) return null;
    if (Array.isArray(value) && value.length >= 2) {
      return [String(value[0]), String(value[1])];
    }
    if (typeof value === 'string') {
      try {
        const parsed = JSON.parse(value);
        if (Array.isArray(parsed) && parsed.length >= 2) {
          return [String(parsed[0]), String(parsed[1])];
        }
      } catch {
        return null;
      }
    }
    return null;
  }

  private getCurrentWeekRange() {
    const now = new Date();
    const day = now.getDay();
    const diff = (day + 6) % 7;
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    start.setDate(start.getDate() - diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);
    return { start, end };
  }

  private isValidDate(value?: string | null) {
    if (!value) return false;
    const date = new Date(value);
    return !Number.isNaN(date.getTime());
  }

  private isInWeek(value?: string | null) {
    if (!this.isValidDate(value)) return false;
    const date = new Date(value as string);
    const { start, end } = this.getCurrentWeekRange();
    return date >= start && date < end;
  }

  private isOverdue(value?: string | null) {
    if (!this.isValidDate(value)) return false;
    const date = new Date(value as string);
    return date.getTime() < Date.now();
  }

  private async getTaskIdsByNodeStatus(
    userId: number,
    status: NodeStatus,
  ): Promise<number[]> {
    const records = await this.taskNodeStatusModel.findAll({
      where: { maintainerId: userId, node_status: status },
      attributes: ['taskId'],
    });
    return Array.from(new Set(records.map((item) => item.taskId)));
  }

  private async getParticipantTaskIds(userId: number): Promise<number[]> {
    const tasks = await this.taskModel.findAll({
      where: {
        [Op.or]: [
          { creator: userId },
          { fieldStatusListRaw: { [Op.like]: `%"${userId}"%` } },
        ],
      },
      attributes: ['id'],
    });
    const nodeRecords = await this.taskNodeStatusModel.findAll({
      where: { maintainerId: userId },
      attributes: ['taskId'],
    });
    const ids = new Set<number>();
    tasks.forEach((task) => ids.add(task.id));
    nodeRecords.forEach((record) => ids.add(record.taskId));
    return Array.from(ids);
  }

  private buildDashboardItem(
    task: Task,
    statusLabelMap: Record<string, Record<string, string>>,
  ) {
    const scheduleValue = this.getFieldValue(task, 'schedule');
    const schedule = this.normalizeSchedule(scheduleValue);
    const nameValue = this.getFieldValue(task, 'name');
    const statusValue = this.getFieldValue(task, 'status');
    const statusId =
      statusValue === null || statusValue === undefined
        ? null
        : String(statusValue);
    const statusLabel = statusId ? statusLabelMap[task.wid]?.[statusId] : null;
    const workItem = (task as any).workItem as WorkItem | undefined;
    const space = (workItem as any)?.space as Space | undefined;

    return {
      id: task.id,
      wid: task.wid,
      name: nameValue || `任务 ${task.id}`,
      stage: statusLabel || statusValue || '-',
      schedule,
      workItemInfo: workItem ? { id: workItem.id, name: workItem.name } : null,
      spaceInfo: space ? { id: space.id, name: space.name } : null,
    };
  }

  private buildInclude() {
    return [
      {
        model: WorkItem,
        attributes: ['id', 'name', 'sid'],
        include: [{ model: Space, attributes: ['id', 'name'] }],
      },
    ];
  }

  private async getStatusLabelMap(wids: string[]) {
    if (wids.length === 0) return {};
    const fields = await this.workItemFieldModel.findAll({
      where: { wid: { [Op.in]: wids }, id: 'status' },
    });
    const map: Record<string, Record<string, string>> = {};
    fields.forEach((field) => {
      const config = field.jsonConfig as { options?: any[] } | null;
      const options = Array.isArray(config?.options) ? config?.options : [];
      const optionMap: Record<string, string> = {};
      options.forEach((opt) => {
        if (!opt) return;
        const id = opt.id ?? opt.value;
        if (id === undefined || id === null) return;
        optionMap[String(id)] = String(opt.label ?? opt.name ?? id);
      });
      map[field.wid] = optionMap;
    });
    return map;
  }

  private async buildDashboardItems(rows: Task[]) {
    if (rows.length === 0) return [];
    const wids = Array.from(new Set(rows.map((item) => item.wid)));
    const statusLabelMap = await this.getStatusLabelMap(wids);
    return rows.map((task) => this.buildDashboardItem(task, statusLabelMap));
  }

  async create(
    dto: CreateTaskDto,
    userId: number,
    transaction?: Transaction,
  ): Promise<Task> {
    return this.taskModel.create(
      {
        ...dto,
        creator: userId,
      } as any,
      { transaction },
    );
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
    type: string = 'all',
    userId?: number,
  ): Promise<{ rows: Task[]; count: number }> {
    const where: any = { wid: workItemId };
    const order: any = [['createdAt', 'DESC']];

    switch (type) {
      case 'recently':
        if (!userId) {
          return { rows: [], count: 0 };
        }
        const recentRecord = await this.recentViewModel.findByPk(userId);
        const recentViews = recentRecord?.recentView || [];
        const recentTaskIds = recentViews
          .filter((item) => item.type === RecentViewType.TASK)
          .map((item) => Number(item.id))
          .filter((id) => Number.isFinite(id));

        if (recentTaskIds.length === 0) {
          return { rows: [], count: 0 };
        }

        const matchedTasks = await this.taskModel.findAll({
          where: {
            wid: workItemId,
            id: { [Op.in]: recentTaskIds },
          },
          attributes: ['id'],
        });

        const matchedIdSet = new Set(matchedTasks.map((task) => task.id));
        const orderedIds = recentTaskIds.filter((id) => matchedIdSet.has(id));
        const total = orderedIds.length;
        const pageIds = orderedIds.slice(offset, offset + limit);

        if (pageIds.length === 0) {
          return { rows: [], count: total };
        }

        const rows = await this.taskModel.findAll({
          where: {
            wid: workItemId,
            id: { [Op.in]: pageIds },
          },
        });

        const orderIndex = new Map(pageIds.map((id, index) => [id, index]));
        rows.sort(
          (a, b) => (orderIndex.get(a.id) ?? 0) - (orderIndex.get(b.id) ?? 0),
        );

        return { rows, count: total };
      case 'created':
        if (!userId) {
          return { rows: [], count: 0 };
        }
        where.creator = userId;
        break;
      case 'assigned':
        if (!userId) {
          return { rows: [], count: 0 };
        }
        where.fieldStatusListRaw = { [Op.like]: `%"${userId}"%` };
        break;
      case 'favorite': {
        if (!userId) {
          return { rows: [], count: 0 };
        }
        const favorites = await this.favoriteModel.findAll({
          where: { type: TASK_FAVORITE_TYPE, uid: userId },
          attributes: ['tid'],
        });
        const taskIds = favorites.map((fav) => fav.tid);
        if (taskIds.length === 0) {
          return { rows: [], count: 0 };
        }
        where.id = { [Op.in]: taskIds };
        break;
      }
      default:
        break;
    }
    return this.taskModel.findAndCountAll({
      where,
      limit,
      offset,
      order,
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

    const myParticipated = userId
      ? await this.taskModel.count({
          where: {
            wid: workItemId,
            [Op.or]: [
              { creator: userId },
              { fieldStatusListRaw: { [Op.like]: `%"${userId}"%` } },
            ],
          },
        })
      : 0;

    return {
      total,
      participants,
      myParticipated,
    };
  }

  async getDashboardStats(userId?: number) {
    if (!userId) {
      return {
        todo: 0,
        done: 0,
        part: 0,
        created: 0,
        thisWeek: 0,
        overdue: 0,
        unscheduled: 0,
      };
    }

    const [todoIds, doneIds, participantIds, createdCount] = await Promise.all([
      this.getTaskIdsByNodeStatus(userId, NodeStatus.IN_PROGRESS),
      this.getTaskIdsByNodeStatus(userId, NodeStatus.COMPLETED),
      this.getParticipantTaskIds(userId),
      this.taskModel.count({ where: { creator: userId } }),
    ]);

    if (participantIds.length === 0) {
      return {
        todo: todoIds.length,
        done: doneIds.length,
        part: 0,
        created: createdCount,
        thisWeek: 0,
        overdue: 0,
        unscheduled: 0,
      };
    }

    const participantTasks = await this.taskModel.findAll({
      where: { id: { [Op.in]: participantIds } },
      attributes: ['id', 'fieldStatusListRaw'],
    });

    let thisWeek = 0;
    let overdue = 0;
    let unscheduled = 0;

    participantTasks.forEach((task) => {
      const scheduleValue = this.getFieldValue(task, 'schedule');
      const schedule = this.normalizeSchedule(scheduleValue);
      if (!schedule) {
        unscheduled += 1;
        return;
      }
      const end = schedule[1];
      if (this.isOverdue(end)) {
        overdue += 1;
      }
      if (this.isInWeek(end)) {
        thisWeek += 1;
      }
    });

    return {
      todo: todoIds.length,
      done: doneIds.length,
      part: participantIds.length,
      created: createdCount,
      thisWeek,
      overdue,
      unscheduled,
    };
  }

  async getDashboardTasks(
    limit = 6,
    offset = 0,
    type = 'todo',
    userId?: number,
  ): Promise<{ rows: any[]; count: number }> {
    if (!userId) {
      return { rows: [], count: 0 };
    }

    const order: any = [['createdAt', 'DESC']];
    const include = this.buildInclude();

    if (type === 'todo') {
      const ids = await this.getTaskIdsByNodeStatus(
        userId,
        NodeStatus.IN_PROGRESS,
      );
      if (ids.length === 0) return { rows: [], count: 0 };
      const data = await this.taskModel.findAndCountAll({
        where: { id: { [Op.in]: ids } },
        limit,
        offset,
        order,
        include,
      });
      return {
        rows: await this.buildDashboardItems(data.rows),
        count: data.count,
      };
    }

    if (type === 'done') {
      const ids = await this.getTaskIdsByNodeStatus(
        userId,
        NodeStatus.COMPLETED,
      );
      if (ids.length === 0) return { rows: [], count: 0 };
      const data = await this.taskModel.findAndCountAll({
        where: { id: { [Op.in]: ids } },
        limit,
        offset,
        order,
        include,
      });
      return {
        rows: await this.buildDashboardItems(data.rows),
        count: data.count,
      };
    }

    if (type === 'created') {
      const data = await this.taskModel.findAndCountAll({
        where: { creator: userId },
        limit,
        offset,
        order,
        include,
      });
      return {
        rows: await this.buildDashboardItems(data.rows),
        count: data.count,
      };
    }

    const participantIds = await this.getParticipantTaskIds(userId);
    if (participantIds.length === 0) {
      return { rows: [], count: 0 };
    }

    if (type === 'part') {
      const data = await this.taskModel.findAndCountAll({
        where: { id: { [Op.in]: participantIds } },
        limit,
        offset,
        order,
        include,
      });
      return {
        rows: await this.buildDashboardItems(data.rows),
        count: data.count,
      };
    }

    if (type === 'thisWeek' || type === 'overdue' || type === 'unscheduled') {
      const tasks = await this.taskModel.findAll({
        where: { id: { [Op.in]: participantIds } },
        order,
        include,
      });
      const filtered = tasks.filter((task) => {
        const scheduleValue = this.getFieldValue(task, 'schedule');
        const schedule = this.normalizeSchedule(scheduleValue);
        if (!schedule) return type === 'unscheduled';
        const end = schedule[1];
        if (type === 'overdue') return this.isOverdue(end);
        if (type === 'thisWeek') return this.isInWeek(end);
        return false;
      });
      const count = filtered.length;
      const pageRows = filtered.slice(offset, offset + limit);
      return {
        rows: await this.buildDashboardItems(pageRows),
        count,
      };
    }

    const data = await this.taskModel.findAndCountAll({
      where: { id: { [Op.in]: participantIds } },
      limit,
      offset,
      order,
      include,
    });
    return {
      rows: await this.buildDashboardItems(data.rows),
      count: data.count,
    };
  }

  async update(id: number, dto: UpdateTaskDto): Promise<Task> {
    const t = await this.findOne(id);
    return t.update(dto as any);
  }

  async remove(id: number): Promise<void> {
    const t = await this.findOne(id);
    await t.destroy();
    await this.favoriteModel.destroy({
      where: { type: TASK_FAVORITE_TYPE, tid: id },
    });
  }
}
