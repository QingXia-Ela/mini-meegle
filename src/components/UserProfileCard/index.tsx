import { Avatar, Popover, Spin } from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { get } from '@/api/request';

type UserInfo = {
  id: number;
  name: string;
  email: string;
  avatar?: string;
};

const userCache = new Map<string, UserInfo>();
const pendingRequest = new Map<string, Promise<UserInfo>>();

async function fetchUserInfo(userId: string): Promise<UserInfo> {
  if (userCache.has(userId)) return userCache.get(userId)!;
  if (pendingRequest.has(userId)) return pendingRequest.get(userId)!;

  const request = get<UserInfo>(`/users/${userId}`).then((data) => {
    if (data) {
      userCache.set(userId, data);
    }
    pendingRequest.delete(userId);
    return data;
  });

  pendingRequest.set(userId, request);
  return request;
}

const getAvatarFallback = (name?: string) => {
  if (!name) return '?';
  return name.trim().slice(0, 1).toUpperCase();
};

interface UserProfileCardProps {
  userId?: string | number | null;
  className?: string;
}

function UserProfileCard({ userId, className }: UserProfileCardProps) {
  const normalizedId = useMemo(() => {
    if (userId === null || userId === undefined) return '';
    return String(userId);
  }, [userId]);

  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let canceled = false;

    if (!normalizedId) {
      setUser(null);
      return;
    }

    if (userCache.has(normalizedId)) {
      setUser(userCache.get(normalizedId)!);
      return;
    }

    setLoading(true);
    fetchUserInfo(normalizedId)
      .then((data) => {
        if (!canceled) setUser(data ?? null);
      })
      .catch(() => {
        if (!canceled) setUser(null);
      })
      .finally(() => {
        if (!canceled) setLoading(false);
      });

    return () => {
      canceled = true;
    };
  }, [normalizedId]);

  if (!normalizedId) return <span className="text-gray-400">-</span>;

  const popoverContent = (
    <div className="flex items-center gap-3">
      <Avatar size={48} src={user?.avatar} className="bg-blue-500">
        {getAvatarFallback(user?.name)}
      </Avatar>
      <div className="min-w-0">
        <div className="truncate text-base font-semibold text-gray-900">
          {user?.name || '未知用户'}
        </div>
        <div className="truncate text-xs text-gray-500">{user?.email || '-'}</div>
      </div>
    </div>
  );

  return (
    <Popover content={popoverContent} trigger="hover" placement="bottomLeft">
      <div className={`inline-flex items-center gap-2 ${className ?? ''}`}>
        <Avatar size={24} src={user?.avatar} className="bg-blue-500">
          {getAvatarFallback(user?.name)}
        </Avatar>
        <span className="max-w-[120px] truncate text-sm text-gray-900">
          {loading ? <Spin size="small" /> : (user?.name || '未知用户')}
        </span>
      </div>
    </Popover>
  );
}

export default UserProfileCard;