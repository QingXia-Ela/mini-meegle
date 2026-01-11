import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { WorkItem } from '../work-item/work-item.model';
import { WorkflowType } from 'src/workflow-type/workflow-type.model';

@Table({ tableName: 'tasks', timestamps: true })
export class Task extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => WorkItem)
  @Column({ type: DataType.STRING(10), allowNull: false })
  declare wid: string;

  @ForeignKey(() => WorkflowType)
  @Column({ type: DataType.INTEGER, allowNull: false })
  workflowType: string;

  // @Column({ type: DataType.TEXT('long'), allowNull: true })
  // nodeStatusList?: string;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  fieldStatusListRaw: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  declare creator: number;

  @Column({ type: DataType.VIRTUAL, allowNull: true })
  get fieldStatusList(): unknown[] {
    const raw = this.getDataValue('fieldStatusListRaw') as string;
    if (!raw) return [];
    try {
      return JSON.parse(raw) as unknown[];
    } catch {
      return [];
    }
  }

  set fieldStatusList(value: unknown[]) {
    this.setDataValue('fieldStatusListRaw', JSON.stringify(value || []));
  }

  @BelongsTo(() => WorkItem)
  declare workItem: WorkItem;
}
