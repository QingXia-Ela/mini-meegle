import request from '@/api/request';

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

// Role APIs
export function apiGetWorkItemRoles(workItemId: string) {
  return request<any[]>(`/workItems/${workItemId}/roles`, {
    method: 'GET',
  });
}

export function apiCreateWorkItemRole(workItemId: string, data: any) {
  return request<any>(`/workItems/${workItemId}/roles`, {
    method: 'POST',
    body: data,
  });
}

export function apiUpdateWorkItemRole(roleId: string, data: any) {
  return request<any>(`/workItems/roles/${roleId}`, {
    method: 'PUT',
    body: data,
  });
}

export function apiDeleteWorkItemRole(roleId: string) {
  return request<any>(`/workItems/roles/${roleId}`, {
    method: 'DELETE',
  });
}

