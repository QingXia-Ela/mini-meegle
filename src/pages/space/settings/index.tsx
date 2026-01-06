import { PlusOutlined, SettingFilled } from '@ant-design/icons';
import { Button, Space, Tabs } from 'antd';
import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import SpaceInfo from './components/SpaceInfo';
import PermissionSettings from './components/PermissionSettings';
import WorkItemSettings from './components/WorkItemSettings';

function SpaceSettingsPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  const navigate = useNavigate();
  const { tab = 'info' } = useParams<{ tab: string }>();
  const [activeKey, setActiveKey] = useState(tab);

  const tabItems = useMemo(
    () => [
      { key: 'info', label: '空间信息' },
      { key: 'workItem', label: '工作项管理' },
      { key: 'permission', label: '权限管理' },
    ],
    []
  );

  return (<>
    <header className="flex px-5 w-full bg-white border-b border-[#cacbcd] items-center justify-between">
      <div className="flex items-center">
        <div className="bg-gray-400 w-8 h-8 flex items-center justify-center rounded-lg">
          <SettingFilled style={{ color: '#fff' }} />
        </div>
        <span className='ml-3 text-lg text-[#262626] font-medium'>空间设置</span>
        <span className='ml-2 text-sm text-[#8c8c8c]'>ID: {spaceId}</span>
      </div>

      <div className="flex-1 flex justify-center">
        <Tabs
          items={tabItems}
          activeKey={activeKey}
          onChange={(key) => {
            setActiveKey(key);
            navigate(`/space/${spaceId}/settings/${key}`);
          }}
          tabBarGutter={32}
          tabBarStyle={{ marginBottom: 0 }}
          size='large'
        />
      </div>

      <Space>
        <Button>操作记录</Button>
        <Button type="primary" icon={<PlusOutlined />}>新建</Button>
      </Space>
    </header>
    <div className='py-8 flex flex-col items-center w-full'>
      {activeKey === 'info' && <SpaceInfo />}
      {activeKey === 'workItem' && <WorkItemSettings />}
      {activeKey === 'permission' && <PermissionSettings />}
      {['info', 'workItem', 'permission'].indexOf(activeKey) === -1 && <div className="text-gray-400">建设中...</div>}
    </div>
  </>);
}

export default SpaceSettingsPage;