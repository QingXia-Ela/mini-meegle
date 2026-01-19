import { CloseOutlined, HomeFilled, StarFilled, StarOutlined } from '@ant-design/icons';
import { Button } from 'antd';
import { useEffect, useState } from 'react';
import ProcessView from '../ProcessView';
import { BasicMap } from '../ProcessView/exampleMap';
import ProcessBottomInfo from './components/ProcessBottomInfo';
import { del, get, post } from '@/api/request';

interface TaskDetailPageProps {
  spaceId: string;
  workItemId: string;
  taskId: string;
  onClose?: () => void;
}


function TaskDetailPage({ spaceId, workItemId, taskId, onClose }: TaskDetailPageProps) {
  const [isFavorited, setIsFavorited] = useState(false);
  const [favoriteLoading, setFavoriteLoading] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchFavoriteState = async () => {
      try {
        const res = await get<{ favorited: boolean }>(
          `/task-favorites/${taskId}/status`,
          { showError: false },
        );
        if (!active) return;
        setIsFavorited(Boolean(res?.favorited));
      } catch {
        if (active) {
          setIsFavorited(false);
        }
      }
    };
    fetchFavoriteState();
    return () => {
      active = false;
    };
  }, [taskId]);

  const handleToggleFavorite = async () => {
    if (favoriteLoading) return;
    setFavoriteLoading(true);
    try {
      if (isFavorited) {
        await del(`/task-favorites/${taskId}`, { showError: false });
        setIsFavorited(false);
      } else {
        await post('/task-favorites', { tid: Number(taskId) }, { showError: false });
        setIsFavorited(true);
      }
    } finally {
      setFavoriteLoading(false);
    }
  };
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
            onClick={handleToggleFavorite}
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
        <div className='flex flex-col'>
          {/* <ProcessMemberSelector /> */}
          <div className="h-104 w-full">
            <ProcessView nodes={Object.values(BasicMap)} />
          </div>
          <ProcessBottomInfo spaceId={spaceId} workItemId={workItemId} taskId={taskId} />
        </div>
      </div>
    </div>
  );
}

export default TaskDetailPage;