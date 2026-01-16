import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { Notice } from './notice.model';
import { User } from '../user/user.model';
import { OnEvent } from '@nestjs/event-emitter';
import { NoticeType } from './notice-type.enum';
import { Task } from '../task/task.model';
import { WorkItem } from '../work-item/work-item.model';
import type { CreationAttributes } from 'sequelize';

interface TaskCommentMentionPayload {
  comment: {
    id: number;
    tid: number;
    content: string;
  };
  mentions: { id: number; name: string }[];
  senderId: number;
}

type NoticeCreateInput = CreationAttributes<Notice> & {
  payload?: Record<string, any> | null;
};

@Injectable()
export class NoticeService {
  constructor(
    @InjectModel(Notice) private noticeModel: typeof Notice,
    @InjectModel(Task) private taskModel: typeof Task,
    @InjectModel(WorkItem) private workItemModel: typeof WorkItem,
  ) {}

  /**
   * 基础方法：创建单条通知
   */
  async create(data: NoticeCreateInput) {
    return this.noticeModel.create(data);
  }

  /**
   * ===========================================================================
   * 事件监听器示例 (Service 对接中心)
   * ===========================================================================
   * 当你需要增加新的通知逻辑时：
   * 1. 在 NoticeType 枚举中增加类型。
   * 2. 在相关业务 Service 中通过 eventEmitter.emit('事件名', payload) 抛出事件。
   * 3. 在下方添加对应的 @OnEvent 监听器处理逻辑。
   */

  /**
   * 监听任务评论中的 @ 提及事件
   * 事件来源: CommentService.create
   */
  @OnEvent('task_comments.mention')
  async handleTaskCommentMention(payload: TaskCommentMentionPayload) {
    const { comment, mentions, senderId } = payload;
    const task = await this.taskModel.findByPk(comment.tid);
    const workItem = task?.wid
      ? await this.workItemModel.findByPk(task.wid)
      : null;

    // 为每个被提及的用户生成通知
    const noticePromises = mentions.map(({ id: receiverId }) => {
      // 避免自己 @ 自己时产生通知 (可选)
      if (receiverId === senderId) return null;

      return this.create({
        receiverId,
        senderId,
        type: NoticeType.TASK_COMMENTS_MENTION,
        content: comment.content,
        payload: {
          taskId: comment.tid,
          commentId: comment.id,
          workItemId: task?.wid ?? '',
          spaceId: workItem?.sid ?? '',
        },
      });
    });

    await Promise.all(noticePromises.filter((p) => p !== null));
  }

  /**
   * 查询用户通知列表
   */
  async findAllByUser(userId: number, offset = 0, limit = 20) {
    const safeLimit = Math.min(Number(limit) || 20, 100);
    const safeOffset = Math.max(Number(offset) || 0, 0);
    const { rows, count } = await this.noticeModel.findAndCountAll({
      where: { receiverId: userId },
      include: [
        { model: User, as: 'sender', attributes: ['id', 'name', 'avatar'] },
      ],
      order: [['createdAt', 'DESC']],
      limit: safeLimit,
      offset: safeOffset,
    });

    return {
      items: rows,
      total: count,
      offset: safeOffset,
      limit: safeLimit,
      hasMore: safeOffset + rows.length < count,
    };
  }

  async getUnreadCount(userId: number) {
    return this.noticeModel.count({
      where: { receiverId: userId, isRead: false },
    });
  }

  async markAsRead(id: number, userId: number) {
    return this.noticeModel.update(
      { isRead: true },
      { where: { id, receiverId: userId } },
    );
  }

  async markAllAsRead(userId: number) {
    return this.noticeModel.update(
      { isRead: true },
      { where: { receiverId: userId, isRead: false } },
    );
  }
}
