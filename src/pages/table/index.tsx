import { BookOutlined, HomeFilled, HomeOutlined } from '@ant-design/icons';
import GreetingHeader from './components/GreetingHeader';
import CategoryList from './components/CategoryList';
import { Button, Table } from 'antd';
import dayjs from 'dayjs';
import { Tag } from 'antd';
import { useUserStore } from '@/store/user';

const data = Array.from({ length: 20 }).map((_, index) => ({
  id: 1,
  name: '数据项1',
  stage: '发起评审',
  startTime: '2025-11-19',
  endTime: '2025-11-23',
  workItemInfo: {
    id: 101,
    name: '需求',
  },
  spaceInfo: {
    id: 1,
    name: '空间A',
  }
}));
const columns = [
  {
    title: '待办事项',
    dataIndex: 'name',
    key: 'name',
    render: (text: string, item: any) => (
      <div className="flex items-start space-x-3 cursor-pointer hover:text-[#3250eb]">
        <div className="bg-[#3250eb] w-8 h-8 flex items-center justify-center rounded-lg flex-shrink-0">
          <HomeOutlined style={{ color: '#fff', fontSize: 14 }} />
        </div>
        <div className="flex-1">
          <div>
            <div className="flex items-center gap-2">
              <div className="text-base sm:text-lg font-semibold  truncate ">{text}</div>
              {dayjs().isAfter(item.endTime) ? (
                <Tag color="red" className="text-xs">已超期</Tag>
              ) : null}
            </div>
            <div className="text-sm text-gray-500 mt-1">{item.stage}</div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: '排期',
    dataIndex: 'schedule',
    key: 'schedule',
    render: (_: any, item: any) => <span className="text-lg">{`${dayjs(item.startTime).format('MM-DD')} - ${dayjs(item.endTime).format('MM-DD')}`}</span>,
    width: 180,
  },
  {
    title: '操作',
    key: 'actions',
    render: () => (
      <Button size='large' className='w-48'>完成</Button>
    ),
    width: 240,
  },
  {
    title: '所属工作项',
    dataIndex: 'workItemInfo',
    key: 'workItemInfo',
    render: (workItemInfo: any) => <Tag color='blue' className='text-lg'>{workItemInfo.name}</Tag>,
  },
  {
    title: '所属空间',
    dataIndex: 'spaceInfo',
    key: 'spaceInfo',
    render: (spaceInfo: any) => <span className="text-lg ">{spaceInfo.name}</span>,
  }
];

function DataList() {
  return (
    <Table
      rowKey="id"
      dataSource={data}
      columns={columns}
      pagination={{
        pageSize: 6
      }}
      bordered={false}
    />
  );
}

function MyWorkCard() {
  return (
    <div className='py-8 px-6 border border-[#cacbcd] rounded-xl w-full hover:shadow-lg transition-shadow max-w-[1920px]'>
      <div className="flex w-full items-center mb-6">
        <div className="bg-orange-400 w-12 h-12 flex items-center justify-center rounded-full">
          <BookOutlined style={{ color: '#fff', fontSize: 22 }} />
        </div>
        <span className='ml-3 text-2xl font-bold'>我的工作</span>
      </div>
      <div className="mb-4">
        <CategoryList />
      </div>
      <DataList />
    </div>
  )
}

function TablePage() {
  const { userInfo } = useUserStore();
  return (
    <>
      <header className="flex py-3 px-5 w-full bg-white border-b border-[#cacbcd] items-center">
        <div className="bg-[#3250eb] w-8 h-8 flex items-center justify-center rounded-lg">
          <HomeFilled style={{ color: '#fff' }} />
        </div>
        <span className='ml-3 text-lg'>工作台</span>
      </header>
      <div className='py-8 flex flex-col items-center w-full'>
        <GreetingHeader name={userInfo?.user.name} />
        <div className='mt-6 px-36 w-full flex flex-col items-center'>
          <MyWorkCard />
        </div>
      </div>
    </>
  );
}

export default TablePage;