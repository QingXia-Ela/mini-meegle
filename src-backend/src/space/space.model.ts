import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
  BeforeCreate,
} from 'sequelize-typescript';
import { User } from '../user/user.model';
import { SpaceUser } from '../space-user/space-user.model';
import { generateUniqueId } from '../utils/id-generator';

@Table({
  tableName: 'spaces',
  timestamps: true,
  charset: 'utf8mb4',
  collate: 'utf8mb4_unicode_ci',
})
export class Space extends Model {
  @Column({
    type: DataType.STRING(10),
    primaryKey: true,
    allowNull: false,
  })
  declare id: string;

  @BeforeCreate
  static async generateId(instance: Space) {
    if (!instance.id) {
      instance.id = await generateUniqueId(Space, 6);
    }
  }

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  declare icon: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare name: string;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  declare overviewContentRaw: string;

  // 虚拟列：将 JSON 字符串反序列化为对象
  @Column({ type: DataType.VIRTUAL })
  get overviewContent(): any {
    if (!this.overviewContentRaw) return null;
    try {
      return JSON.parse(this.overviewContentRaw);
    } catch {
      return null;
    }
  }

  set overviewContent(value: any) {
    this.overviewContentRaw = value ? JSON.stringify(value) : '';
  }

  @BelongsToMany(() => User, () => SpaceUser)
  declare users: User[];

  // @Column({ type: DataType.JSON, allowNull: true })
  // workItems?: any;

  // @Column({ type: DataType.JSON, allowNull: true })
  // managers?: number[];

  // @Column({ type: DataType.JSON, allowNull: true })
  // members?: number[];
}
