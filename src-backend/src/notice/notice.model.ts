import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { User } from '../user/user.model';
import { NoticeType } from './notice-type.enum';

@Table({ tableName: 'notices', timestamps: true })
export class Notice extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  receiverId: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  senderId?: number;

  @Column({ type: DataType.STRING, allowNull: false })
  type: NoticeType; // 使用 NoticeType 枚举

  @Column({ type: DataType.TEXT, allowNull: false })
  content: string;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  declare payloadRaw?: string;

  @Column({ type: DataType.VIRTUAL, allowNull: true })
  get payload(): Record<string, any> | null {
    const raw = this.getDataValue('payloadRaw') as string;
    if (!raw) return null;
    try {
      return JSON.parse(raw) as Record<string, any>;
    } catch {
      return null;
    }
  }

  set payload(value: any) {
    this.setDataValue('payloadRaw', value ? JSON.stringify(value) : null);
  }

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  isRead: boolean;

  @BelongsTo(() => User, 'receiverId')
  receiver: User;

  @BelongsTo(() => User, 'senderId')
  sender: User;
}
