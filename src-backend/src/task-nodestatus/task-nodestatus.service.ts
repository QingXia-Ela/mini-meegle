import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import {
  TaskNodeStatus,
  SubTaskInfo,
  NodeStatus,
} from './task-nodestatus.model';
import { CreateSubTaskDto } from './dto/create-sub-task.dto';
import { UpdateSubTaskDto } from './dto/update-sub-task.dto';
import { UpdateNodeStatusDto } from './dto/update-node-status.dto';
import { TransitionNodeStatusDto } from './dto/transition-node-status.dto';
import { TaskService } from '../task/task.service';
import { WorkflowTypeService } from '../workflow-type/workflow-type.service';

@Injectable()
export class TaskNodeStatusService {
  constructor(
    @InjectModel(TaskNodeStatus)
    private taskNodeStatusModel: typeof TaskNodeStatus,
    private readonly taskService: TaskService,
    private readonly workflowTypeService: WorkflowTypeService,
  ) {}

  private async getByTaskAndNode(
    taskId: number,
    nodeId: string,
  ): Promise<TaskNodeStatus> {
    let record = await this.taskNodeStatusModel.findOne({
      where: { taskId, nodeId },
    });
    if (!record) {
      const task = await this.taskService.findOne(taskId);
      if (!task) throw new NotFoundException('Task not found');

      const workflowType = await this.workflowTypeService.findOne(
        task.workflowType,
      );

      record = await this.taskNodeStatusModel.create({
        taskId,
        nodeId,
        workFlowType: workflowType.id,
        node_status: nodeId === 'start' ? 'in_progress' : 'pending',
        maintainerId: null,
        maintainerSchedule: null,
        subTaskList: [],
      });

      if (record.node_status === NodeStatus.IN_PROGRESS) {
        const eventsMap = this.normalizeEventsData(workflowType.eventsData);
        await this.triggerNodeEvents(
          taskId,
          eventsMap,
          String(nodeId),
          'onReach',
        );
      }
    }
    return record;
  }

  private isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === 'object' && value !== null;
  }

  private toIdArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value
      .map((item) =>
        item !== undefined && item !== null ? String(item) : null,
      )
      .filter((item): item is string => item !== null);
  }

  private normalizeNodesData(
    nodesData: unknown,
  ): Record<string, { prevNodes?: string[]; nextNodes?: string[] }> {
    const map: Record<string, { prevNodes?: string[]; nextNodes?: string[] }> =
      {};
    if (!nodesData) return map;
    if (Array.isArray(nodesData)) {
      for (const node of nodesData) {
        if (!this.isRecord(node)) continue;
        const rawId = node.id;
        if (typeof rawId !== 'string' && typeof rawId !== 'number') continue;
        map[String(rawId)] = {
          prevNodes: this.toIdArray(node.prevNodes),
          nextNodes: this.toIdArray(node.nextNodes),
        };
      }
      return map;
    }
    if (this.isRecord(nodesData)) {
      for (const [key, rawNode] of Object.entries(nodesData)) {
        if (!this.isRecord(rawNode)) continue;
        map[String(key)] = {
          prevNodes: this.toIdArray(rawNode.prevNodes),
          nextNodes: this.toIdArray(rawNode.nextNodes),
        };
      }
      return map;
    }
    return map;
  }

  private normalizeEventsData(eventsData: unknown): Record<
    string,
    {
      onReach?: Array<{ type?: string; to?: unknown }>;
      onComplete?: Array<{ type?: string; to?: unknown }>;
    }
  > {
    const map: Record<
      string,
      {
        onReach?: Array<{ type?: string; to?: unknown }>;
        onComplete?: Array<{ type?: string; to?: unknown }>;
      }
    > = {};
    if (!eventsData) return map;
    if (!this.isRecord(eventsData)) return map;
    for (const [key, value] of Object.entries(eventsData)) {
      if (!this.isRecord(value)) continue;
      map[String(key)] = {
        onReach: Array.isArray(value.onReach) ? value.onReach : [],
        onComplete: Array.isArray(value.onComplete) ? value.onComplete : [],
      };
    }
    return map;
  }

  private getStatusTransitionTarget(
    events: Array<{ type?: string; to?: unknown }>,
  ): string | null {
    if (!Array.isArray(events) || events.length === 0) return null;
    for (let i = events.length - 1; i >= 0; i -= 1) {
      const event = events[i];
      if (!event || event.type !== 'status_transition') continue;
      if (typeof event.to === 'string') return event.to;
      if (this.isRecord(event.to) && typeof event.to.id === 'string') {
        return event.to.id;
      }
    }
    return null;
  }

  private async applyStatusTransitionEvent(
    taskId: number,
    targetStatus: string,
  ) {
    const task = await this.taskService.findOne(taskId);
    const list = task.fieldStatusList || [];
    const nextList = [...list];
    const index = nextList.findIndex((item) => item.fieldId === 'status');
    if (index >= 0) {
      nextList[index] = { ...nextList[index], value: targetStatus };
    } else {
      nextList.push({ fieldId: 'status', value: targetStatus });
    }
    task.fieldStatusList = nextList;
    await task.save();
  }

  private async triggerNodeEvents(
    taskId: number,
    eventsMap: Record<
      string,
      {
        onReach?: Array<{ type?: string; to?: unknown }>;
        onComplete?: Array<{ type?: string; to?: unknown }>;
      }
    >,
    nodeId: string,
    eventType: 'onReach' | 'onComplete',
  ) {
    const nodeEvents = eventsMap[nodeId];
    if (!nodeEvents) return;
    const events = nodeEvents[eventType] || [];
    const targetStatus = this.getStatusTransitionTarget(events);
    if (targetStatus === null) return;
    await this.applyStatusTransitionEvent(taskId, targetStatus);
  }

  async listSubTasks(taskId: number, nodeId: string): Promise<SubTaskInfo[]> {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    return record.subTaskList || [];
  }

  async listNodeStatuses(taskId: number) {
    const records = await this.taskNodeStatusModel.findAll({
      where: { taskId },
    });

    return records.map((record) => {
      const json: TaskNodeStatus = record.toJSON();
      return {
        id: json.id,
        taskId: json.taskId,
        nodeId: json.nodeId,
        workFlowType: json.workFlowType,
        node_status: json.node_status,
        maintainerId: json.maintainerId ?? null,
        maintainerSchedule: json.maintainerSchedule ?? null,
        subTaskList: json.subTaskList || [],
      };
    });
  }

  async getNodeStatus(taskId: number, nodeId: string) {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    return {
      id: record.id,
      taskId: record.taskId,
      nodeId: record.nodeId,
      workFlowType: record.workFlowType,
      node_status: record.node_status,
      maintainerId: record.maintainerId ?? null,
      maintainerSchedule: record.maintainerSchedule ?? null,
      subTaskList: record.subTaskList || [],
    };
  }

  async updateNodeStatus(
    taskId: number,
    nodeId: string,
    dto: UpdateNodeStatusDto,
  ) {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    if (dto.maintainerId !== undefined) {
      record.maintainerId = dto.maintainerId ?? null;
    }
    if (dto.maintainerSchedule !== undefined) {
      record.maintainerSchedule = dto.maintainerSchedule ?? null;
    }
    await record.save();
    return {
      id: record.id,
      taskId: record.taskId,
      nodeId: record.nodeId,
      workFlowType: record.workFlowType,
      node_status: record.node_status,
      maintainerId: record.maintainerId ?? null,
      maintainerSchedule: record.maintainerSchedule ?? null,
      subTaskList: record.subTaskList || [],
    };
  }

  async transitionNodeStatus(
    taskId: number,
    nodeId: string,
    dto: TransitionNodeStatusDto,
  ): Promise<{ success: boolean }> {
    const task = await this.taskService.findOne(taskId);
    if (!task) throw new NotFoundException('Task not found');
    const workflowType = await this.workflowTypeService.findOne(
      task.workflowType,
    );
    const nodesMap = this.normalizeNodesData(workflowType.nodesData);
    const eventsMap = this.normalizeEventsData(workflowType.eventsData);
    const nodeKey = String(nodeId);
    const nodeInfo = nodesMap[nodeKey];
    if (!nodeInfo) throw new NotFoundException('Node not found in workflow');

    const record = await this.getByTaskAndNode(taskId, nodeKey);
    const nextNodeIds = this.toIdArray(nodeInfo.nextNodes);

    if (dto.status === NodeStatus.COMPLETED) {
      if (record.node_status !== NodeStatus.IN_PROGRESS) {
        throw new BadRequestException('Node must be in progress to complete');
      }
      record.node_status = NodeStatus.COMPLETED;
      await record.save();
      await this.triggerNodeEvents(taskId, eventsMap, nodeKey, 'onComplete');

      for (const nextId of nextNodeIds) {
        const nextInfo = nodesMap[nextId];
        if (!nextInfo) continue;
        const prevNodeIds = this.toIdArray(nextInfo.prevNodes);
        const prevCompleted = await Promise.all(
          prevNodeIds.map(async (prevId) => {
            const prevRecord = await this.getByTaskAndNode(taskId, prevId);
            return prevRecord.node_status === NodeStatus.COMPLETED;
          }),
        );
        if (prevCompleted.every(Boolean)) {
          const nextRecord = await this.getByTaskAndNode(taskId, nextId);
          const wasInProgress =
            nextRecord.node_status === NodeStatus.IN_PROGRESS;
          if (nextRecord.node_status !== NodeStatus.COMPLETED) {
            nextRecord.node_status = NodeStatus.IN_PROGRESS;
            if (!wasInProgress) {
              await nextRecord.save();
              await this.triggerNodeEvents(
                taskId,
                eventsMap,
                nextId,
                'onReach',
              );
            } else {
              await nextRecord.save();
            }
          }
        }
      }

      return { success: true };
    }

    if (dto.status === NodeStatus.IN_PROGRESS) {
      if (record.node_status !== NodeStatus.COMPLETED) {
        throw new BadRequestException('Node must be completed to rollback');
      }
      const visited = new Set<string>();
      const queue = [...nextNodeIds];
      while (queue.length > 0) {
        const currentId = queue.shift();
        if (!currentId || visited.has(currentId)) continue;
        visited.add(currentId);

        const currentRecord = await this.getByTaskAndNode(taskId, currentId);
        if (currentRecord.node_status !== NodeStatus.PENDING) {
          currentRecord.node_status = NodeStatus.PENDING;
          await currentRecord.save();
        }

        const currentInfo = nodesMap[currentId];
        if (!currentInfo) continue;
        const currentNext = this.toIdArray(currentInfo.nextNodes);
        queue.push(...currentNext);
      }
      record.node_status = NodeStatus.IN_PROGRESS;
      await record.save();
      await this.triggerNodeEvents(taskId, eventsMap, nodeKey, 'onReach');
      return { success: true };
    }

    throw new BadRequestException('Unsupported target status');
  }

  async getSubTask(
    taskId: number,
    nodeId: string,
    name: string,
  ): Promise<SubTaskInfo> {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    const item = (record.subTaskList || []).find((s) => s.name === name);
    if (!item) {
      return { name: '', maintainer: null, schedule: null };
    }
    return item;
  }

  async createSubTask(
    taskId: number,
    nodeId: string,
    dto: CreateSubTaskDto,
  ): Promise<SubTaskInfo[]> {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    const list = record.subTaskList || [];
    if (list.some((s) => s.name === dto.name)) {
      throw new BadRequestException('SubTask already exists');
    }
    list.push({
      name: dto.name,
      maintainer: dto.maintainer ?? null,
      schedule: dto.schedule ?? null,
    });
    record.subTaskList = list;
    await record.save();
    return record.subTaskList || [];
  }

  async updateSubTask(
    taskId: number,
    nodeId: string,
    name: string,
    dto: UpdateSubTaskDto,
  ): Promise<SubTaskInfo> {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    const list = record.subTaskList || [];
    const index = list.findIndex((s) => s.name === name);
    if (index < 0) throw new NotFoundException('SubTask not found');

    const nextName = dto.name ?? list[index].name;
    if (nextName !== name && list.some((s) => s.name === nextName)) {
      throw new BadRequestException('SubTask name already exists');
    }

    list[index] = {
      name: nextName,
      maintainer:
        dto.maintainer !== undefined ? dto.maintainer : list[index].maintainer,
      schedule:
        dto.schedule !== undefined ? dto.schedule : list[index].schedule,
    };
    record.subTaskList = list;
    await record.save();
    return list[index];
  }

  async removeSubTask(
    taskId: number,
    nodeId: string,
    name: string,
  ): Promise<void> {
    const record = await this.getByTaskAndNode(taskId, nodeId);
    const list = record.subTaskList || [];
    const nextList = list.filter((s) => s.name !== name);
    if (nextList.length === list.length) {
      throw new NotFoundException('SubTask not found');
    }
    record.subTaskList = nextList;
    await record.save();
  }
}
