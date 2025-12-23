import React, { type HTMLAttributes } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router';
import { Avatar, Popover, Button, notification } from 'antd';
import { HomeFilled, AppstoreFilled, StarFilled, BellFilled, UserAddOutlined } from '@ant-design/icons';
import MeegleLogo from '@/assets/meegle.svg'
import { cleanLoginToken } from '@/api/request';

const UserPopoverContent: React.FC = () => {
  function logout() {
    notification.info({ message: '已退出登录' });
    cleanLoginToken()
    window.location.href = '/login';
  }
  return (
    <div className="w-60 text-[16px]">
      <div className="flex items-center justify-between space-x-3 p-2">
        <div className="flex items-center space-x-3">
          <Avatar size={48}>S</Avatar>
          <div className='ml-2 flex flex-col'>
            <div className="font-semibold">spark xiao</div>
            <div className="text-xs text-gray-500">goo03092514593gle@gmail...</div>
          </div>
        </div>
      </div>
      <div className="border-t border-[#cacbcd]" />
      <div className="py-2">
        <div className="py-2 hover:bg-gray-100 rounded px-4 cursor-pointer flex items-center justify-between">
          <span>个人信息</span>
        </div>
        <div className="py-2 hover:bg-gray-100 rounded px-4 cursor-pointer">偏好设置</div>
        <div className="py-2 hover:bg-gray-100 rounded px-4 cursor-pointer text-red-500" onClick={logout}>退出登录</div>
      </div>
    </div>
  );
};

const LeftToolSelectButton = ({
  active,
  icon,
  content,
  ...props
}: {
  active?: boolean,
  icon: React.ReactNode,
  content?: string
} & HTMLAttributes<HTMLDivElement>) => {
  // #3250eb
  return (
    <div className="w-16 rounded-lg hover:bg-gray-100 flex flex-col items-center gap-3 px-1 py-2 cursor-pointer" {...props}>
      {icon}
      <span className={`font-bold ${active ? 'text-[#3250eb]' : 'text-[#7f7f7f]'} text-xs`}>{content}</span>
    </div>
  )
}

export const MainLayout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const isActive = (path: string, mode: 'exact' | 'includes' = 'includes') => {
    if (mode === 'exact') {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  }

  return (
    <div className="flex h-full bg-white">
      <aside className="w-20 border-r border-[#cacbcd] bg-white flex flex-col items-center gap-4 px-2 relative" aria-label="侧边栏">
        <div className="h-16 flex items-center">
          <img src={MeegleLogo} alt="" width={32} />
        </div>
        <div className="border-t border-[#cacbcd] w-full" />
        <LeftToolSelectButton
          onClick={() => navigate('/')}
          content='工作台'
          active={isActive('/', 'exact')}
          icon={<HomeFilled style={{ fontSize: 24, color: isActive('/', 'exact') ? '#3250eb' : '#cacbcd' }} />}
        />
        <LeftToolSelectButton
          onClick={() => navigate('/space')}
          content='空间'
          active={isActive('/space')}
          icon={<AppstoreFilled style={{ fontSize: 24, color: isActive('/space') ? '#3250eb' : '#cacbcd' }} />}
        />
        <LeftToolSelectButton
          onClick={() => navigate('/favorites')}
          content='收藏'
          active={isActive('/favorites')}
          icon={<StarFilled style={{ fontSize: 24, color: isActive('/favorites') ? '#3250eb' : '#cacbcd' }} />}
        />
        <LeftToolSelectButton
          onClick={() => navigate('/notifications')}
          content='通知'
          active={isActive('/notifications')}
          icon={<BellFilled style={{ fontSize: 24, color: isActive('/notifications') ? '#3250eb' : '#cacbcd' }} />}
        />
        <div className="absolute bottom-4">
          <div className="flex flex-col items-center space-x-4 gap-6">
            <Popover content="邀请同事" placement="right" trigger="hover">
              <UserAddOutlined style={{ fontSize: 26, color: '#7f7f7f', margin: 0, cursor: 'pointer' }} />
            </Popover>
            <Popover content={<UserPopoverContent />} placement="rightBottom" trigger="hover">
              <div className="flex items-center space-x-2 cursor-pointer">
                <Avatar size='large'> S </Avatar>
              </div>
            </Popover>
          </div>
        </div>
      </aside>

      <div className="w-[calc(100%-5rem)] flex flex-col max-h-screen">
        <main className="bg-white flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
