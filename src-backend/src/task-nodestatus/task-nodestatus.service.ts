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
          if (nextRecord.node_status !== NodeStatus.COMPLETED) {
            nextRecord.node_status = NodeStatus.IN_PROGRESS;
            await nextRecord.save();
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
