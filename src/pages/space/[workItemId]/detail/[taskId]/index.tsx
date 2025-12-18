import TaskDetailPage from '@/components/TaskDetailPage';
import { useParams } from 'react-router';

function TaskDetailRoutePage() {
  const { workItemId, taskId, spaceId } = useParams<{ workItemId: string; taskId: string; spaceId: string }>();
  if (!workItemId || !taskId || !spaceId) {
    return <div>参数缺失</div>;
  }
  return <TaskDetailPage spaceId={spaceId} workItemId={workItemId} taskId={taskId} />;
}

export default TaskDetailRoutePage;