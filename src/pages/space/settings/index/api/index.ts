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

