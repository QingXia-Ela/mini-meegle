import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
} from 'sequelize-typescript';
import { Space } from './space.model';
import { User } from '../user/user.model';

@Table({
  tableName: 'space_user',
  timestamps: false,
})
export class SpaceUser extends Model {
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, primaryKey: true })
  declare uid: number;

  @ForeignKey(() => Space)
  @Column({
    type: DataType.STRING(10),
    allowNull: false,
    primaryKey: true,
  })
  declare sid: string;
}
