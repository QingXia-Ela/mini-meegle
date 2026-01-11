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
import { FieldType, RequireFieldId, SystemFieldId } from './enums';

@Table({ tableName: 'workItemFields', timestamps: true })
export class WorkItemField extends Model {
  @Column({
    type: DataType.STRING(16),
    primaryKey: true,
    allowNull: false,
  })
  declare id: string;

  @ForeignKey(() => WorkItem)
  @Column({ type: DataType.STRING(10), allowNull: false })
  declare wid: string;

  @BeforeCreate
  static async generateId(instance: WorkItemField) {
    if (!instance.id) {
      instance.id = await generateUniqueId(WorkItemField, 8);
    }
  }

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({
    type: DataType.ENUM(...Object.values(FieldType)),
    allowNull: false,
  })
  type: FieldType;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  config: string;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      const id = this.getDataValue('id') as string;
      const systemIds = Object.values(SystemFieldId) as string[];
      return systemIds.includes(id) ? 'system' : 'custom';
    },
  })
  declare systemType: 'system' | 'custom';

  @Column({
    type: DataType.VIRTUAL,
    get() {
      const id = this.getDataValue('id') as string;
      return Object.values(RequireFieldId).includes(id as RequireFieldId);
    },
  })
  declare isRequire: boolean;

  @Column({
    type: DataType.VIRTUAL,
    get() {
      const config = this.getDataValue('config') as string | undefined;
      if (!config) return null;
      try {
        return JSON.parse(config);
      } catch {
        return null;
      }
    },
  })
  declare jsonConfig: unknown;

  @BelongsTo(() => WorkItem)
  declare workItem: WorkItem;
}
