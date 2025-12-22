import { HomeFilled, StarFilled } from '@ant-design/icons';
import { Outlet, useNavigate } from 'react-router';
import SidebarSelectItem from './components/SidebarSelectItem';
import useRouteActive from '@/hooks/useRouteActive';

function FavoritesLayout() {
  const navigate = useNavigate();

  return (
    <div className='w-full h-full'>
      <div className="w-60 h-full p-4 border-r border-[#cacbcd]  flex flex-col">
        <div className='flex items-center mb-4 gap-2'>
          <div className='rounded-xl h-7 w-7 bg-amber-400 flex justify-center items-center'>
            <StarFilled style={{ color: 'white' }} />
          </div>
          <span className='font-bold'>收藏</span>
        </div>
        <div className="space-y-2">
          <SidebarSelectItem active={useRouteActive('/space/123/overview')} onClick={() => navigate('/space/123/overview')} icon={<HomeFilled style={{ color: '#fff', fontSize: '12px' }} />} label="空间主页" />
        </div>
      </div>
      <div className='flex-1 max-h-screen max-w-[calc(100vw-20rem)] flex flex-col'>
        <Outlet />
      </div>
    </div>
  );
}

export default FavoritesLayout;
