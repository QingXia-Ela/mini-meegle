import request from '@/api/request';

export interface FavoriteItem {
  id: number;
  type: string;
  tid: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface TaskItem {
  id: number;
  wid: string;
}

export interface WorkItem {
  id: string;
  sid: string;
  name?: string;
  icon?: string;
}

export interface SpaceItem {
  id: string;
  name: string;
  icon?: string;
}

export function apiGetFavorites() {
  return request<FavoriteItem[]>('/favorites', {
    method: 'GET',
  });
}

export function apiGetTask(taskId: number) {
  return request<TaskItem>(`/tasks/${taskId}`, {
    method: 'GET',
  });
}

export function apiGetWorkItem(workItemId: string) {
  return request<WorkItem>(`/workItems/${workItemId}`, {
    method: 'GET',
  });
}

export function apiGetMySpaces() {
  return request<SpaceItem[]>('/spaces/my', {
    method: 'GET',
  });
}
