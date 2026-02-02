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

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  nodesDataRaw: string;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  eventsDataRaw: string;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  rolesDataRaw: string;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      const raw = this.getDataValue('nodesDataRaw') as string | null;
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
  })
  declare nodesData: any;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      const raw = this.getDataValue('eventsDataRaw') as string | null;
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
  })
  declare eventsData: any;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      const raw = this.getDataValue('rolesDataRaw') as string | null;
      if (!raw) return null;
      try {
        return JSON.parse(raw);
      } catch {
        return null;
      }
    },
  })
  declare rolesData: any;

  @BelongsTo(() => WorkItem)
  declare workItem: WorkItem;
}
