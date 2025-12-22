import { HomeFilled } from '@ant-design/icons';
import { Select } from 'antd';
import { Outlet, useNavigate } from 'react-router';
import SidebarSelectItem from './components/SidebarSelectItem';
import useRouteActive from '@/hooks/useRouteActive';

function SpaceWorkItemLayout() {
  const navigate = useNavigate();

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
          <SidebarSelectItem active={useRouteActive('/space/123/overview')} onClick={() => navigate('/space/123/overview')} icon={<HomeFilled style={{ color: '#fff', fontSize: '12px' }} />} label="空间主页" />
          <SidebarSelectItem active={useRouteActive('/space/123/story')} onClick={() => navigate('/space/123/story')} icon={<HomeFilled style={{ color: '#fff', fontSize: '12px' }} />} label="需求" />
          <SidebarSelectItem active={useRouteActive('/space/123/defects')} onClick={() => navigate('/space/123/defects')} icon={<HomeFilled style={{ color: '#fff', fontSize: '12px' }} />} label="缺陷" />
        </div>
      </div>
      <div className='flex-1 max-h-screen max-w-[calc(100vw-20rem)] flex flex-col'>
        <Outlet />
      </div>
    </div>
  );
}

export default SpaceWorkItemLayout;