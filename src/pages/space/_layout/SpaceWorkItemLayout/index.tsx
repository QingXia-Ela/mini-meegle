import { HomeFilled } from '@ant-design/icons';
import { Select } from 'antd';
import { Outlet, useParams } from 'react-router';
import SidebarSelectItem from './components/SidebarSelectItem';

function SpaceWorkItemLayout() {
  return (
    <div className='w-full h-full flex'>
      <div className="w-60 h-full p-4 border-r border-[#cacbcd]">
        <Select className='w-full' size='large' placeholder="选择一个工作空间" options={[
          { value: 'jack', label: 'Jack' },
          { value: 'lucy', label: 'Lucy' },
          { value: 'Yiminghe', label: 'yiminghe' },
          { value: 'disabled', label: 'Disabled', disabled: true },
        ]} />
        <div className='text-gray-400 my-4'>功能</div>
        <div className="space-y-2">
          <SidebarSelectItem icon={<HomeFilled style={{ color: '#fff', fontSize: '12px' }} />} label="空间主页" />
          <SidebarSelectItem icon={<HomeFilled style={{ color: '#fff', fontSize: '12px' }} />} label="需求" />
          <SidebarSelectItem icon={<HomeFilled style={{ color: '#fff', fontSize: '12px' }} />} label="缺陷" active />
        </div>
      </div>
      <div className='flex-1 max-h-screen max-w-[calc(100vw-20rem)] flex flex-col'>
        <Outlet />
      </div>
    </div>
  );
}

export default SpaceWorkItemLayout;