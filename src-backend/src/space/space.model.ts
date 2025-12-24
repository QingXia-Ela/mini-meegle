import {
  Table,
  Column,
  Model,
  DataType,
  BelongsToMany,
  BeforeCreate,
} from 'sequelize-typescript';
import { User } from '../user/user.model';
import { SpaceUser } from './space-user.model';
import { generateUniqueId } from '../utils/id-generator';

@Table({ tableName: 'spaces', timestamps: true })
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

  @Column({ type: DataType.STRING, allowNull: true })
  icon: string;

  @Column({ type: DataType.STRING, allowNull: false })
  name: string;

  @BelongsToMany(() => User, () => SpaceUser)
  declare users: User[];

  // @Column({ type: DataType.JSON, allowNull: true })
  // workItems?: any;

  // @Column({ type: DataType.JSON, allowNull: true })
  // managers?: number[];

  // @Column({ type: DataType.JSON, allowNull: true })
  // members?: number[];
}
