import TaskDetailPage from '@/components/TaskDetailPage';
import { useNavigate, useParams } from 'react-router';

function TaskDetailRoutePage() {
  const { workItemId, taskId, spaceId } = useParams<{ workItemId: string; taskId: string; spaceId: string }>();
  const navigate = useNavigate();
  if (!workItemId || !taskId || !spaceId) {
    return <div>参数缺失</div>;
  }
  return (
    <TaskDetailPage
      spaceId={spaceId}
      workItemId={workItemId}
      taskId={taskId}
      onClose={() => navigate(`/space/${spaceId}/${workItemId}`)}
    />
  );
}

export default TaskDetailRoutePage;