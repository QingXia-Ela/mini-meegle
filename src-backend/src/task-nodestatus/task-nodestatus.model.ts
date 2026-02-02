import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Task } from '../task/task.model';
import { WorkflowType } from '../workflow-type/workflow-type.model';
import { User } from '../user/user.model';

export interface SubTaskInfo {
  name: string;
  maintainer?: string | null;
  schedule?: string | null;
}

export enum NodeStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

@Table({ tableName: 'task_node_statuses', timestamps: true })
export class TaskNodeStatus extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
    defaultValue: DataType.UUIDV4,
  })
  declare id: string;

  @ForeignKey(() => Task)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare taskId: number;

  @ForeignKey(() => WorkflowType)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare workFlowType: number;

  @Column({ type: DataType.STRING, allowNull: false })
  declare nodeId: string;

  @Column({
    type: DataType.ENUM(...Object.values(NodeStatus)),
    allowNull: false,
    defaultValue: NodeStatus.PENDING,
  })
  declare node_status: NodeStatus;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  declare maintainerId: number | null;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  declare maintainerSchedule: string | null;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  subTaskListRaw?: string;

  @Column({ type: DataType.VIRTUAL, allowNull: true })
  get subTaskList(): SubTaskInfo[] {
    const raw = this.getDataValue('subTaskListRaw') as string | undefined;
    if (!raw) return [];
    try {
      return JSON.parse(raw) as SubTaskInfo[];
    } catch {
      return [];
    }
  }

  set subTaskList(value: SubTaskInfo[]) {
    this.setDataValue('subTaskListRaw', JSON.stringify(value || []));
  }

  @BelongsTo(() => Task)
  declare task: Task;

  @BelongsTo(() => WorkflowType)
  declare workflowType: WorkflowType;

  @BelongsTo(() => User)
  declare maintainer?: User;
}
