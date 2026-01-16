import request from '@/api/request';

export interface NoticeSender {
  id: number;
  name: string;
  avatar?: string | null;
}

export interface NoticePayload {
  taskId?: number;
  commentId?: number;
  workItemId?: string;
  spaceId?: string;
  [key: string]: any;
}

export interface NoticeItem {
  id: number;
  type: string;
  content: string;
  payload?: NoticePayload | null;
  isRead: boolean;
  createdAt: string;
  sender?: NoticeSender | null;
}

export interface NoticeListResponse {
  items: NoticeItem[];
  total: number;
  offset: number;
  limit: number;
  hasMore: boolean;
}

export function apiGetNoticeList(params: { offset?: number; limit?: number }) {
  const { offset = 0, limit = 20 } = params;
  const searchParams = new URLSearchParams({
    offset: String(offset),
    limit: String(limit),
  });
  return request<NoticeListResponse>(`/notices?${searchParams.toString()}`, {
    method: 'GET',
  });
}

export function apiMarkNoticeRead(id: number) {
  return request<{ success: boolean }>(`/notices/${id}/read`, {
    method: 'PATCH',
  });
}

export function apiMarkAllNoticesRead() {
  return request<{ success: boolean }>('/notices/read-all', {
    method: 'PATCH',
  });
}

export function apiGetUnreadCount(): Promise<{ count: number }> {
  return request<{ count: number }>('/notices/unread-count', {
    method: 'GET',
  });
}
