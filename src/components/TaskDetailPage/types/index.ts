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
  approvalInfo?: ApprovalInfo;
}

export interface SubTaskInfo {
  name: string;
  maintainer?: string | null;
  schedule?: string | null;
}

export type ApprovalMode = 'none' | 'merge_request' | 'document' | 'ai_material';

export interface ApprovalCheckResult {
  passed: boolean;
  message: string;
  checkedAt: string;
  detail?: {
    conversation?: Array<{ role: string; content: string }>;
    raw?: string;
    issues?: Array<{ file: string; line?: number; message: string }>;
    aiReview?: {
      passed?: boolean;
      message?: string;
      conversation?: Array<{ role: string; content: string }>;
      raw?: string;
      issues?: Array<{ file: string; line?: number; message: string }>;
      commentedCount?: number;
    };
    [key: string]: any;
  };
}

export interface ApprovalInfo {
  mode?: ApprovalMode;
  prompt?: string;
  aiReviewMr?: boolean;
  aiReviewMrPrompt?: string;
  giteeMrUrl?: string | null;
  documentUrl?: string | null;
  materialUrl?: string | null;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  lastCheckResult?: ApprovalCheckResult | null;
}
