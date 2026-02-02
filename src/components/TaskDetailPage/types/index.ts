import type { ProcessNodeStatusType, ProcessNodeType } from '@/components/ProcessView/types';

export interface TaskDetail {
  id: number;
  wid: string;
  workflowType: number;
  fieldStatusListRaw: string;
}

export interface WorkflowTypeDetail {
  id: number;
  name: string;
  nodesData: Record<string, ProcessNodeType> | ProcessNodeType[];
}

export interface TaskNodeStatusDetail {
  id: string;
  taskId: number;
  nodeId: string;
  workFlowType: number;
  node_status: ProcessNodeStatusType;
  maintainerId?: number | null;
  maintainerSchedule?: string | null;
  subTaskList?: { name: string; maintainer?: string | null; schedule?: string | null }[];
}

export interface SubTaskInfo {
  name: string;
  maintainer?: string | null;
  schedule?: string | null;
}
