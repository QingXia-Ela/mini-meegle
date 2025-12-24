import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { WorkItem } from '../work-item/work-item.model';

@Table({ tableName: 'tasks', timestamps: true })
export class Task extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => WorkItem)
  @Column({ type: DataType.STRING(10), allowNull: false })
  declare wid: string;

  @Column({ type: DataType.INTEGER, allowNull: true })
  taskType?: number;

  @Column({ type: DataType.DATE, allowNull: true })
  timestamp?: Date;

  @BelongsTo(() => WorkItem)
  declare workItem: WorkItem;
}
