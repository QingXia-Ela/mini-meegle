import { CloseOutlined, HomeFilled } from '@ant-design/icons';
import { Button } from 'antd';
import { useNavigate } from 'react-router';
import ProcessMemberSelector from './components/ProcessMemberSelector';
import ProcessView from '../ProcessView';
import { BasicMap } from '../ProcessView/exampleMap';
import ProcessBottomInfo from './components/ProcessBottomInfo';

interface TaskDetailPageProps {
  spaceId: string;
  workItemId: string;
  taskId: string;
}


function TaskDetailPage({ spaceId, workItemId, taskId }: TaskDetailPageProps) {
  const navigate = useNavigate();
  return (
    <div className="w-full h-full flex flex-col relative pb-20">
      <header className="flex py-3 px-5 w-full bg-white border-b border-[#cacbcd] items-center justify-between">
        <div className='flex items-center'>
          <div className="bg-[#3250eb] w-8 h-8 flex items-center justify-center rounded-lg">
            <HomeFilled style={{ color: '#fff' }} />
          </div>
          <span className='ml-3 text-lg font-bold'>任务: {taskId}</span>
        </div>
        <div className='flex items-center'>
          <Button onClick={() => navigate(`/space/${spaceId}/${workItemId}`)} icon={<CloseOutlined style={{ color: '#000' }} />} />
        </div>
      </header>
      <div className='flex-1 overflow-auto'>
        <div className='flex flex-col'>
          <ProcessMemberSelector />
          <div className="h-76 w-full">
            <ProcessView nodes={Object.values(BasicMap)} />
          </div>
          <ProcessBottomInfo />
        </div>
      </div>
    </div>
  );
}

export default TaskDetailPage;