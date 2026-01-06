import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  BeforeCreate,
} from 'sequelize-typescript';
import { Space } from '../space/space.model';
import { generateUniqueId } from '../utils/id-generator';

@Table({ tableName: 'workItems', timestamps: true })
export class WorkItem extends Model {
  @Column({
    type: DataType.STRING(10),
    primaryKey: true,
    allowNull: false,
  })
  declare id: string;

  @ForeignKey(() => Space)
  @Column({ type: DataType.STRING(10), allowNull: false })
  declare sid: string;

  @BeforeCreate
  static async generateId(instance: WorkItem) {
    if (!instance.id) {
      instance.id = await generateUniqueId(WorkItem, 8);
    }
  }

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @Column({ type: DataType.STRING, allowNull: true })
  icon?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  color?: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  description?: string;

  @BelongsTo(() => Space)
  declare space: Space;
}
