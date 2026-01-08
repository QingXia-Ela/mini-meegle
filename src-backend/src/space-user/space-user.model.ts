import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Space } from '../space/space.model';
import { User } from '../user/user.model';
import { SpacePermission } from './space-user-permission.enum';

@Table({
  tableName: 'space_user',
  timestamps: false,
})
export class SpaceUser extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true })
  declare uid: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Space)
  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    primaryKey: true,
  })
  declare sid: string;

  @BelongsTo(() => Space)
  space: Space;

  @Column({
    type: DataType.ENUM(...Object.values(SpacePermission)),
    allowNull: false,
    defaultValue: SpacePermission.MEMBER,
  })
  declare space_permission: SpacePermission;

  @Column(DataType.VIRTUAL)
  get display_permission(): string {
    const p = this.getDataValue('space_permission');
    return p === SpacePermission.MANAGER ? '管理员' : '普通成员';
  }
}
