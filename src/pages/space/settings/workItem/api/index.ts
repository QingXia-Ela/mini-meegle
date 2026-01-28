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

// Field APIs
export interface FieldConfig {
  options?: Array<{
    id: string;
    label: string;
    color: string;
  }>;
  [key: string]: string | number | boolean | object | Array<any> | undefined;
}

export interface WorkItemField {
  id: string;
  wid: string;
  name: string;
  type: string;
  config?: string;
  jsonConfig?: FieldConfig;
  systemType: 'system' | 'custom';
  createdAt?: string;
  updatedAt?: string;
}

export function apiGetWorkItemFields(workItemId: string) {
  return request<WorkItemField[]>(`/workItems/${workItemId}/fields`, {
    method: 'GET',
  });
}

export function apiCreateWorkItemField(workItemId: string, data: Partial<WorkItemField>) {
  return request<WorkItemField>(`/workItems/${workItemId}/field`, {
    method: 'POST',
    body: data,
  });
}

export function apiUpdateWorkItemField(workItemId: string, fieldId: string, data: Partial<WorkItemField>) {
  return request<WorkItemField>(`/workItems/${workItemId}/field/${fieldId}`, {
    method: 'PUT',
    body: data,
  });
}

export function apiDeleteWorkItemField(workItemId: string, fieldId: string) {
  return request<void>(`/workItems/${workItemId}/field/${fieldId}`, {
    method: 'DELETE',
  });
}

// Workflow Type APIs
export interface WorkflowType {
  id: number;
  wid: string;
  name: string;
  nodesDataRaw?: string;
  nodesData?: any;
  createdAt?: string;
  updatedAt?: string;
}

export function apiGetWorkflowTypes(workItemId: string) {
  return request<WorkflowType[]>(`/workflow-types/workItem/${workItemId}`, {
    method: 'GET',
  });
}

export function apiCreateWorkflowType(data: { wid: string; name: string }) {
  return request<WorkflowType>('/workflow-types', {
    method: 'POST',
    body: data,
  });
}

export function apiUpdateWorkflowType(id: number, data: { name?: string; nodesDataRaw?: string }) {
  return request<WorkflowType>(`/workflow-types/${id}`, {
    method: 'PUT',
    body: data,
  });
}

export function apiDeleteWorkflowType(id: number) {
  return request<void>(`/workflow-types/${id}`, {
    method: 'DELETE',
  });
}
