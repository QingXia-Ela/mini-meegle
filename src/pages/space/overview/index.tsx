import { HomeFilled } from '@ant-design/icons';
import { useParams } from 'react-router';

function SpaceOverviewPage() {
  const { spaceId } = useParams<{ spaceId: string }>();
  return (
    <>
      <header className="flex py-3 px-5 w-full bg-white border-b border-[#cacbcd] items-center">
        <div className="bg-[#3250eb] w-8 h-8 flex items-center justify-center rounded-lg">
          <HomeFilled style={{ color: '#fff' }} />
        </div>
        <span className='ml-3 text-lg'>空间主页: {spaceId}</span>
      </header>
      <div className='py-8 flex flex-col items-center w-full'>
        123
      </div>
    </>
  );
}

export default SpaceOverviewPage;