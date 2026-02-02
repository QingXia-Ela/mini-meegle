import { del, get, post } from '@/api/request';
import type { TaskDetail, TaskNodeStatusDetail, WorkflowTypeDetail } from '../types';

export const fetchTaskDetail = (taskId: string) =>
  get<TaskDetail>(`/tasks/${taskId}`);

export const fetchWorkflowType = (workflowTypeId: number) =>
  get<WorkflowTypeDetail>(`/workflow-types/${workflowTypeId}`);

export const fetchTaskNodeStatuses = (taskId: string) =>
  get<TaskNodeStatusDetail[]>(`/task-node-status/${taskId}/nodes`, {
    showError: false,
  });

export const fetchFavoriteStatus = (taskId: string) =>
  get<{ favorited: boolean }>(`/task-favorites/${taskId}/status`, {
    showError: false,
  });

export const addTaskFavorite = (taskId: string) =>
  post('/task-favorites', { tid: Number(taskId) }, { showError: false });

export const removeTaskFavorite = (taskId: string) =>
  del(`/task-favorites/${taskId}`, { showError: false });

export const transitionNodeStatus = (
  taskId: string,
  nodeId: string | number,
  status: 'pending' | 'in_progress' | 'completed',
) =>
  post(
    `/task-node-status/${taskId}/nodes/${encodeURIComponent(String(nodeId))}/transition`,
    { status },
  );
