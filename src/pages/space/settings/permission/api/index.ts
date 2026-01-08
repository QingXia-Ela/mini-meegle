import request from '@/api/request';

export function apiListSpaceUsers(params: {
  sid: string;
  permission?: string;
  offset?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      query.append(key, String(value));
    }
  });
  return request<{ items: any[]; total: number }>(`/space-user/list?${query.toString()}`, {
    method: 'GET',
  });
}

export function apiSearchUsers(params: {
  keyword?: string;
  offset?: number;
  limit?: number;
}) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) {
      query.append(key, String(value));
    }
  });
  return request<{ items: any[]; total: number }>(`/users/search?${query.toString()}`, {
    method: 'GET',
  });
}

export function apiAddSpaceUsers(sid: string, uids: number[], permission?: string) {
  return request<any>('/space-user/add', {
    method: 'POST',
    body: { sid, uids, permission },
  });
}

export function apiGetSpaceUserIds(sid: string) {
  return request<number[]>(`/space-user/ids?sid=${sid}`, {
    method: 'GET',
  });
}

