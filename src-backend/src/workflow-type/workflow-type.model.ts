import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { WorkItem } from '../work-item/work-item.model';

@Table({ tableName: 'workflowTypes', timestamps: true })
export class WorkflowType extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => WorkItem)
  @Column({ type: DataType.STRING(10), allowNull: false })
  declare wid: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @BelongsTo(() => WorkItem)
  declare workItem: WorkItem;
}
