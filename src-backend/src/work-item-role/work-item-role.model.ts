import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeCreate,
} from 'sequelize-typescript';
import { WorkItem } from '../work-item/work-item.model';
import { generateUniqueId } from '../utils/id-generator';

export enum RoleAppearance {
  DEFAULT = '默认出现',
  MANUAL = '自行添加',
}

@Table({ tableName: 'workItemRoles', timestamps: true })
export class WorkItemRole extends Model {
  @Column({
    type: DataType.STRING(10),
    primaryKey: true,
    allowNull: false,
  })
  declare id: string;

  @ForeignKey(() => WorkItem)
  @Column({ type: DataType.STRING(10), allowNull: false })
  declare wid: string;

  @BeforeCreate
  static async generateId(instance: WorkItemRole) {
    if (!instance.id) {
      instance.id = await generateUniqueId(WorkItemRole, 8);
    }
  }

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({
    type: DataType.ENUM(...Object.values(RoleAppearance)),
    allowNull: false,
    defaultValue: RoleAppearance.DEFAULT,
  })
  appearance: RoleAppearance;

  @Column({ type: DataType.STRING, allowNull: false, defaultValue: '自行添加' })
  allocation: string;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: false })
  isSingle: boolean;

  @Column({ type: DataType.BOOLEAN, allowNull: false, defaultValue: true })
  autoJoin: boolean;

  @BelongsTo(() => WorkItem)
  declare workItem: WorkItem;
}
