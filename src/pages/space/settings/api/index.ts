import request from '@/api/request';
import type { UpdateSpaceDto } from '@backend/types';

export function apiGetSpace(id: string) {
  return request<any>(`/spaces/${id}`, {
    method: 'GET',
  });
}

export function apiUpdateSpace(id: string, data: UpdateSpaceDto) {
  return request<any>(`/spaces/${id}`, {
    method: 'PUT',
    body: data,
  });
}

export function apiGetWorkItemsBySpaceId(spaceId: string) {
  return request<any[]>(`/workItems/space/${spaceId}`, {
    method: 'GET',
  });
}

export function apiCreateWorkItem(data: {
  id?: string;
  sid: string;
  name: string;
  icon?: string;
  color?: string;
  description?: string;
}) {
  return request<any>('/workItems', {
    method: 'POST',
    body: data,
  });
}

export function apiUpdateWorkItem(id: string, data: any) {
  return request<any>(`/workItems/${id}`, {
    method: 'PUT',
    body: data,
  });
}

export function apiDeleteWorkItem(id: string) {
  return request<any>(`/workItems/${id}`, {
    method: 'DELETE',
  });
}

