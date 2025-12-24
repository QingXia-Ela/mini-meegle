import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { Space } from '../space/space.model';
import { WorkItem } from './work-item.model';

@Table({ tableName: 'workItem_space', timestamps: false })
export class WorkItemSpace extends Model {
  @ForeignKey(() => Space)
  @Column({ type: DataType.STRING(10), allowNull: false, primaryKey: true })
  declare sid: string;

  @ForeignKey(() => WorkItem)
  @Column({ type: DataType.STRING(10), allowNull: false, primaryKey: true })
  declare wid: string;
}
