import React from 'react';
import { useNavigate } from 'react-router';
import { Avatar, Button } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

interface MentionMeNotificationProps {
  senderName: string;
  senderAvatar?: string;
  taskName: string;
  commentContent: string;
  time: string | Date;
  spaceId: string;
  workItemId: string;
  taskId: string;
  isRead?: boolean;
  isMarkingRead?: boolean;
  onMarkRead?: () => void;
}

const MentionMeNotification: React.FC<MentionMeNotificationProps> = ({
  senderName,
  senderAvatar,
  taskName,
  commentContent,
  time,
  spaceId,
  workItemId,
  taskId,
  isRead = false,
  isMarkingRead = false,
  onMarkRead,
}) => {
  const navigate = useNavigate();
  const isLinkable = Boolean(spaceId && workItemId && taskId);
  const isMarkReadDisabled = isRead || !onMarkRead || isMarkingRead;

  const handleCommentClick = () => {
    if (!isLinkable) return;
    navigate(`/space/${spaceId}/${workItemId}/${taskId}/detail`);
  };

  const handleMarkRead = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (isMarkReadDisabled) return;
    onMarkRead?.();
  };

  return (
    <div
      className={`group flex items-start p-4 bg-white rounded-lg border border-gray-100 hover:border-blue-200 hover:shadow-md transition-all relative ${
        !isRead ? 'border-l-4 border-l-blue-500' : ''
      }`}
    >
      <div className="mr-3 flex-shrink-0">
        <Avatar
          size={40}
          src={senderAvatar}
          icon={<UserOutlined />}
          className="shadow-sm"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1 gap-3">
          <div className="text-sm">
            <span className="font-semibold text-gray-900 mr-1">{senderName}</span>
            <span className="text-gray-500">在任务</span>
            <span className="mx-1 font-medium text-blue-600 hover:underline">
              {taskName}
            </span>
            <span className="text-gray-500">中提及了你</span>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <span className="text-xs text-gray-400 whitespace-nowrap">
              {dayjs(time).format('YYYY-MM-DD HH:mm')}
            </span>
            <Button
              type="text"
              size='small'
              onClick={handleMarkRead}
              disabled={isMarkReadDisabled}
              className="text-xs text-blue-600 hover:text-blue-700 disabled:text-gray-300 disabled:cursor-not-allowed"
            >
              {isRead ? '已读' : isMarkingRead ? '标记中...' : '标为已读'}
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={handleCommentClick}
          disabled={!isLinkable}
          className={`mt-2 w-full text-left p-3 bg-gray-50 rounded-md border border-gray-100 group-hover:bg-blue-50/30 group-hover:border-blue-100 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-300 ${
            isLinkable ? 'cursor-pointer' : 'cursor-not-allowed opacity-60'
          }`}
        >
          <div className="text-xs text-gray-400 mb-1">评论原文</div>
          <p className="text-sm text-gray-700 line-clamp-3 leading-relaxed">
            {commentContent}
          </p>
        </button>

        <div className="mt-2 flex items-center text-xs text-gray-400">
          <span className="hover:text-blue-500 transition-colors">点击评论查看详情</span>
          {!isRead && (
            <span className="ml-2 w-2 h-2 bg-blue-500 rounded-full" />
          )}
        </div>
      </div>
    </div>
  );
};

export default MentionMeNotification;
