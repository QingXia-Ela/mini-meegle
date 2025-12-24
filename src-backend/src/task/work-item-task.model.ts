import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { WorkItem } from '../work-item/work-item.model';
import { Task } from './task.model';

@Table({ tableName: 'workItem_task', timestamps: false })
export class WorkItemTask extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => WorkItem)
  @Column({ type: DataType.STRING(10), allowNull: false })
  declare wid: string;

  @ForeignKey(() => Task)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare tid: number;
}
