import { NotificationFilled } from '@ant-design/icons';
import { Button, Tabs } from 'antd';
import NotificationMessage from './components/Message/NotificationMessage';

function NoticeIndexPage() {
  return (
    <div className='h-full w-full flex flex-col'>
      <header className="flex py-3 px-5 w-full bg-white border-b border-[#cacbcd] items-center">
        <div className="bg-[#5789ff] w-8 h-8 flex items-center justify-center rounded-lg">
          <NotificationFilled style={{ color: '#fff' }} />
        </div>
        <span className='ml-3 text-lg font-bold'>通知</span>
      </header>
      <div className="flex w-[65%] mx-auto items-center justify-between">
        <Tabs
          className="flex-1"
          size="large"
          items={[
            { label: '全部通知', key: '1' },
            { label: '未读通知', key: '2' },
            { label: '催一催', key: '3' },
            { label: '@我', key: '4' },
            { label: '系统通知', key: '5' }
          ]}
        />
        <Button type="text" className="ml-4">全部标为已读</Button>
      </div>
      <div className="flex-1 flex flex-col w-[65%] mx-auto">
        <NotificationMessage />
      </div>
    </div>
  );
}

export default NoticeIndexPage;