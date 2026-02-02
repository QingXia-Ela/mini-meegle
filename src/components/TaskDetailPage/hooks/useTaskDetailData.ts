import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ProcessNodeType } from '@/components/ProcessView/types';
import type { TaskNodeStatusDetail } from '../types';
import {
  addTaskFavorite,
  fetchFavoriteStatus,
  fetchTaskDetail,
  fetchTaskNodeStatuses,
  fetchWorkflowType,
  removeTaskFavorite,
} from '../api';

const buildStatusMap = (list: TaskNodeStatusDetail[]) => {
  const map = new Map<string, TaskNodeStatusDetail>();
  list.forEach((item) => {
    map.set(String(item.nodeId), item);
  });
  return map;
};

const mergeNodesWithStatus = (
  nodes: ProcessNodeType[],
  statusMap: Map<string, TaskNodeStatusDetail>,
) =>
  nodes.map((node) => {
    const matched = statusMap.get(String(node.id));
    return matched ? { ...node, status: matched.node_status || node.status } : node;
  });

export const useTaskDetailData = (taskId: string) => {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [workflowNodes, setWorkflowNodes] = useState<ProcessNodeType[]>([]);
  const [taskNodeStatusList, setTaskNodeStatusList] = useState<TaskNodeStatusDetail[]>([]);

  const fetchWorkflowNodes = useCallback(async (workflowType?: number) => {
    if (!workflowType) return [];
    const workflow = await fetchWorkflowType(workflowType);
    if (!workflow?.nodesData) return [];
    return Object.values(workflow.nodesData);
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const task = await fetchTaskDetail(taskId);
      const workflowNodeList = await fetchWorkflowNodes(task?.workflowType);
      const statusList = await fetchTaskNodeStatuses(taskId);
      const statusMap = buildStatusMap(statusList || []);
      setTaskNodeStatusList(statusList || []);
      setWorkflowNodes(
        workflowNodeList.length > 0
          ? mergeNodesWithStatus(workflowNodeList, statusMap)
          : workflowNodeList,
      );
      const fav = await fetchFavoriteStatus(taskId);
      setIsFavorited(Boolean(fav?.favorited));
    } catch (err) {
      console.error('Failed to fetch task detail or workflow:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchWorkflowNodes, taskId]);

  useEffect(() => {
    let active = true;
    const run = async () => {
      if (!active) return;
      await refresh();
    };
    run();
    return () => {
      active = false;
    };
  }, [refresh]);

  const toggleFavorite = useCallback(async () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await removeTaskFavorite(taskId);
        setIsFavorited(false);
      } else {
        await addTaskFavorite(taskId);
        setIsFavorited(true);
      }
    } finally {
      setFavoriteLoading(false);
    }
  }, [favoriteLoading, isFavorited, taskId]);

  const nodeStatusMap = useMemo(
    () => buildStatusMap(taskNodeStatusList),
    [taskNodeStatusList],
  );

  return {
    loading,
    isFavorited,
    favoriteLoading,
    workflowNodes,
    taskNodeStatusList,
    nodeStatusMap,
    refresh,
    toggleFavorite,
  };
};
