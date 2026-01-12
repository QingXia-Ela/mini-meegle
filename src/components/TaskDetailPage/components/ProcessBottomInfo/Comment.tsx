import { SendOutlined, MoreOutlined, EditOutlined, DeleteOutlined, RollbackOutlined } from '@ant-design/icons';
import { Avatar, Button, Input, message, Tag, Dropdown, Popconfirm, List } from 'antd';
import MemberSelect from '@/components/MemberSelect';
import type { Member } from '@/components/MemberSelect';
import { useEffect, useState, useCallback } from 'react';
import { get, post, put } from '@/api/request';
import dayjs from 'dayjs';
import { useUserStore } from '@/store/user';

interface UserResponse {
  id: number | string;
  name: string;
  avatar?: string;
  color?: string;
}

interface SearchResponse {
  items: UserResponse[];
  total: number;
}

export interface CommentItemProps {
  comment: any;
  onReply: (comment: any) => void;
  onDelete: (id: number) => void;
  onEdit: (comment: any) => void;
}

export function CommentItem({ comment, onReply, onDelete, onEdit }: CommentItemProps) {
  const { userInfo } = useUserStore();
  // 根据后端的逻辑，当前用户 ID 可能在 userInfo.user.id 或 userInfo.sub 中
  // 这里优先尝试使用 userInfo.user.id (登录返回的用户信息) 
  // 或者 userInfo.sub (JWT payload 中的 ID)
  const currentUserId = userInfo?.user?.id || (userInfo as any)?.sub || userInfo?.id;
  const isAuthor = currentUserId && Number(currentUserId) === Number(comment.uid);

  const menuItems = [
    {
      key: 'edit',
      label: '修改',
      icon: <EditOutlined />,
      onClick: () => onEdit(comment),
    },
    {
      key: 'delete',
      label: (
        <Popconfirm
          title="确定删除评论吗？"
          description="删除后内容将显示为“已删除的评论”。"
          onConfirm={() => onDelete(comment.id)}
          okText="确定"
          cancelText="取消"
        >
          <span className="text-red-500">删除</span>
        </Popconfirm>
      ),
      icon: <DeleteOutlined className="text-red-500" />,
    },
  ];

  return (
    <List.Item className="!px-0">
      <div className="flex w-full gap-4">
        <Avatar src={comment.user?.avatar} className="flex-shrink-0">
          {comment.user?.name?.[0]}
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <span className="font-bold">{comment.user?.name}</span>
              <span className="text-gray-400 text-xs">
                {dayjs(comment.createdAt).format('YYYY-MM-DD HH:mm')}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                type="text" 
                size="small" 
                icon={<RollbackOutlined />} 
                onClick={() => onReply(comment)}
              >
                回复
              </Button>
              {isAuthor && comment.content !== '已删除的评论' && (
                <Dropdown menu={{ items: menuItems }} placement="bottomRight">
                  <Button type="text" size="small" icon={<MoreOutlined />} />
                </Dropdown>
              )}
            </div>
          </div>
          
          {comment.replyComment && (
            <div className="bg-gray-50 border-l-2 border-gray-200 px-3 py-1 mb-2 text-sm text-gray-500 rounded">
              <span className="font-medium mr-1">@{comment.replyComment.user?.name || '未知用户'}:</span>
              {comment.replyComment.content}
            </div>
          )}

          <div className="text-gray-700 whitespace-pre-wrap break-words">
            {comment.additionData?.mentions?.length > 0 && (
              <span className="text-blue-500 mr-2">
                {comment.additionData.mentions.map((m: any) => `@${m.name}`).join(' ')}
              </span>
            )}
            {comment.content}
          </div>
        </div>
      </div>
    </List.Item>
  );
}

interface ProcessViewCommentProps {
  taskId: string;
  onSuccess?: () => void;
  replyingTo?: any;
  onCancelReply?: () => void;
  editingComment?: any;
  onCancelEdit?: () => void;
}

function ProcessViewComment({
  taskId,
  onSuccess,
  replyingTo,
  onCancelReply,
  editingComment,
  onCancelEdit,
}: ProcessViewCommentProps) {
  const [users, setUsers] = useState<Member[]>([]);
  const [content, setContent] = useState('');
  const [mentions, setMentions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const { userInfo } = useUserStore();
  const currentUser = userInfo?.user || userInfo;

  useEffect(() => {
    if (editingComment) {
      setContent(editingComment.content);
      setMentions(editingComment.additionData?.mentions?.map((m: any) => m.id.toString()) || []);
    } else {
      setContent('');
      setMentions([]);
    }
  }, [editingComment]);

  const fetchUsers = useCallback((keyword?: string) => {
    const url = keyword ? `/users/search?keyword=${encodeURIComponent(keyword)}` : '/users';
    get<UserResponse[] | SearchResponse>(url).then((data) => {
      const items = Array.isArray(data) ? data : (data as SearchResponse)?.items || [];
      setUsers(items.map((u) => ({
        id: u.id.toString(),
        name: u.name,
        avatar: u.avatar,
        color: u.color
      })));
    });
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleSend = async () => {
    if (!content.trim()) return;
    setLoading(true);
    try {
      const selectedMentions = users
        .filter(u => mentions.includes(u.id))
        .map(u => ({ id: u.id, name: u.name }));

      const payload = {
        tid: Number(taskId),
        content,
        rid: replyingTo?.id || null,
        additionData: { mentions: selectedMentions },
      };

      if (editingComment) {
        await put(`/comments/${editingComment.id}`, {
          content,
          additionData: { mentions: selectedMentions },
        });
        message.success('修改成功');
        onCancelEdit?.();
      } else {
        await post('/comments', payload);
        message.success('发送成功');
        setContent('');
        setMentions([]);
        onCancelReply?.();
      }
      onSuccess?.();
    } catch {
      message.error(editingComment ? '修改失败' : '发送失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full border-t border-gray-300 absolute bottom-0 bg-white">
      <div className="h-20 flex items-center px-6 py-2 gap-4">
        <Avatar src={currentUser?.avatar}>{currentUser?.name?.[0] || 'S'}</Avatar>
        <Input 
          placeholder={editingComment ? '修改评论...' : (replyingTo ? '输入回复...' : '请输入评论')} 
          className="flex-1" 
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onPressEnter={handleSend}
        />
        <div className="w-60">
          <MemberSelect
            options={users}
            placeholder="@成员"
            value={mentions}
            onChange={setMentions}
            onSearchContentChange={fetchUsers}
          />
        </div>
        <div className="flex items-center gap-2">
          {(replyingTo || editingComment) && (
            <Tag 
              color="blue" 
              closable 
              onClose={(e) => {
                e.preventDefault();
                if (editingComment) {
                  onCancelEdit?.();
                } else {
                  onCancelReply?.();
                }
              }}
              className="m-0 py-1 flex items-center"
            >
              {editingComment ? '修改中' : `回复 @${replyingTo.user?.name}`}
            </Tag>
          )}
          <Button 
            icon={<SendOutlined />} 
            type="primary" 
            onClick={handleSend}
            loading={loading}
          >
            {editingComment ? '确认' : '发送'}
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ProcessViewComment;