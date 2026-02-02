import { CloseOutlined, HomeFilled, StarFilled, StarOutlined } from '@ant-design/icons';
import { Button, Spin } from 'antd';
import { useCallback, useMemo, useState } from 'react';
import ProcessView from '../ProcessView';
import { TestMap } from '../ProcessView/exampleMap';
import ProcessBottomInfo from './components/ProcessBottomInfo';
import type { ProcessNodeType } from '../ProcessView/types';
import { useTaskDetailData } from './hooks/useTaskDetailData';

interface TaskDetailPageProps {
  spaceId: string;
  workItemId: string;
  taskId: string;
  onClose?: () => void;
}

function TaskDetailPage({ spaceId, workItemId, taskId, onClose }: TaskDetailPageProps) {
  const [selectedNode, setSelectedNode] = useState<ProcessNodeType | null>(null);
  const {
    loading,
    isFavorited,
    favoriteLoading,
    workflowNodes,
    taskNodeStatusList,
    nodeStatusMap,
    refresh,
    toggleFavorite,
  } = useTaskDetailData(taskId);

  const displayNodes = useMemo(() => {
    const sourceNodes = workflowNodes.length > 0 ? workflowNodes : Object.values(TestMap);
    return sourceNodes.map((node) => {
      const baseStatus = node.status || 'pending';
      const matched = nodeStatusMap.get(String(node.id));
      if (matched) return { ...node, status: matched.node_status || baseStatus };
      return { ...node, status: baseStatus };
    });
  }, [workflowNodes, nodeStatusMap]);

  const currentNode = useMemo(() => {
    if (selectedNode) return selectedNode;
    if (displayNodes.length === 0) return null;
    const preferredId = taskNodeStatusList[0]?.nodeId;
    return preferredId
      ? displayNodes.find((node) => String(node.id) === String(preferredId)) || displayNodes[0]
      : displayNodes[0];
  }, [displayNodes, selectedNode, taskNodeStatusList]);

  const currentNodeStatus = useMemo(() => {
    if (!currentNode) return null;
    return nodeStatusMap.get(String(currentNode.id)) || null;
  }, [currentNode, nodeStatusMap]);

  const onNodeClick = useCallback((node: ProcessNodeType) => {
    setSelectedNode(node);
  }, []);
  return (
    <div className="w-full h-full flex flex-col relative pb-20">
      <header className="flex py-3 px-5 w-full bg-white border-b border-[#cacbcd] items-center justify-between">
        <div className='flex items-center'>
          <div className="bg-[#3250eb] w-8 h-8 flex items-center justify-center rounded-lg">
            <HomeFilled style={{ color: '#fff' }} />
          </div>
          <span className='ml-3 text-lg font-bold'>任务: {taskId}</span>
        </div>
        <div className='flex items-center gap-2'>
          <Button
            onClick={toggleFavorite}
            loading={favoriteLoading}
            icon={isFavorited ? <StarFilled style={{ color: '#f5a623' }} /> : <StarOutlined style={{ color: '#000' }} />}
          >
            {isFavorited ? '已收藏' : '收藏'}
          </Button>
          {onClose && (
            <Button onClick={onClose} icon={<CloseOutlined style={{ color: '#000' }} />} />
          )}
        </div>
      </header>
      <div className='flex-1 overflow-auto'>
        <Spin spinning={loading}>
          <div className='flex flex-col'>
            {/* <ProcessMemberSelector /> */}
            <div className="h-104 w-full">
              <ProcessView
                nodes={workflowNodes || []}
                onNodeClick={onNodeClick}
              />
            </div>
          </div>
        </Spin>
        <ProcessBottomInfo
          spaceId={spaceId}
          workItemId={workItemId}
          taskId={taskId}
          currentNode={currentNode}
          taskNodeStatus={currentNodeStatus}
          workflowNodes={displayNodes}
          taskNodeStatusList={taskNodeStatusList}
          onRefreshNodes={refresh}
        />
      </div>
    </div>
  );
}

export default TaskDetailPage;