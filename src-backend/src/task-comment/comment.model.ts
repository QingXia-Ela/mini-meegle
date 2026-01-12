import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
} from 'sequelize-typescript';
import { Task } from '../task/task.model';
import { User } from '../user/user.model';

@Table({ tableName: 'task_comments', timestamps: true })
export class Comment extends Model {
  @Column({ type: DataType.INTEGER, autoIncrement: true, primaryKey: true })
  declare id: number;

  @ForeignKey(() => Task)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare tid: number;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  declare uid: number;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  declare rid?: number;

  @Column({ type: DataType.TEXT, allowNull: false })
  declare content: string;

  @Column({ type: DataType.TEXT('long'), allowNull: true })
  declare additionDataRaw?: string;

  @Column({ type: DataType.VIRTUAL, allowNull: true })
  get additionData(): any {
    const raw = this.getDataValue('additionDataRaw') as string;
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }
  set additionData(value: any) {
    this.setDataValue('additionDataRaw', JSON.stringify(value || {}));
  }

  @BelongsTo(() => Task)
  declare task: Task;

  @BelongsTo(() => User)
  declare user: User;

  @BelongsTo(() => Comment, {
    foreignKey: 'rid',
    as: 'parentComment',
    constraints: false,
  })
  declare parentComment?: Comment;

  @Column({ type: DataType.VIRTUAL })
  get replyComment(): any {
    if (this.parentComment) {
      return {
        id: this.parentComment.id,
        content: this.parentComment.content,
        user: this.parentComment.user
          ? {
              id: this.parentComment.user.id,
              name: this.parentComment.user.name,
            }
          : null,
      };
    }

    // 如果有 rid 但 parentComment 为空，说明被回复的评论已从数据库移除
    if (this.rid) {
      return {
        id: this.rid,
        content: '已删除的评论',
        user: {
          id: 0,
          name: '未知用户',
        },
      };
    }

    return null;
  }
}
