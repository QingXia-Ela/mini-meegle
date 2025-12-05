import { SettingFilled } from '@ant-design/icons';
import { useParams } from 'react-router';

function SpaceSettingsPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  return (<>
    <header className="flex py-3 px-5 w-full bg-white border-b border-[#cacbcd] items-center">
      <div className="bg-gray-400 w-8 h-8 flex items-center justify-center rounded-lg">
        <SettingFilled style={{ color: '#fff' }} />
      </div>
      <span className='ml-3 text-lg'>空间设置: {spaceId}</span>
    </header>
    <div className='py-8 flex flex-col items-center w-full'>
      123
    </div>
  </>);
}

export default SpaceSettingsPage;