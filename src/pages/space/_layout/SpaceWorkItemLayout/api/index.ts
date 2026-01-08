import request from '@/api/request';
import type {
  CreateSpaceDto,
  CreateSpaceResponse,
  UserSpacesResponse,
  WorkItemResponse,
} from '@backend/types';

export function apiGetMySpaces() {
  return request<UserSpacesResponse>('/spaces/my', {
    method: 'GET',
  });
}

export function apiCreateSpace(data: CreateSpaceDto) {
  return request<CreateSpaceResponse>('/spaces/create', {
    method: 'POST',
    body: data,
  });
}

export function apiGetSpaceWorkItems(spaceId: string) {
  return request<WorkItemResponse[]>('/workItems/space/' + spaceId, {
    method: 'GET',
  });
}

export function apiJoinSpace(spaceId: string) {
  return request('/spaces/join', {
    method: 'POST',
    body: { spaceId },
  });
}