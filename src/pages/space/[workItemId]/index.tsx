import { HomeFilled } from '@ant-design/icons';
import { useParams } from 'react-router';
import WorkItemStatusView from './components/WorkItemStatusView';
import { Button, Table, Tabs, type TabsProps } from 'antd';
import MeegleCardFrame from '@/components/workItem/MeegleCardFrame';

const items: TabsProps['items'] = [
  {
    key: 'all',
    label: '全部',
    children: 'Content of Tab Pane 1',
  },
  {
    key: 'recently',
    label: '最近浏览',
    children: 'Content of Tab Pane 2',
  },
  {
    key: 'created',
    label: '我创建的',
    children: 'Content of Tab Pane 3',
  },
  {
    key: 'assigned',
    label: '我参与的',
    children: 'Content of Tab Pane 4',
  },
  {
    key: 'favorite',
    label: '我收藏的',
    children: 'Content of Tab Pane 5',
  }
];

const columns = [
  {
    title: '待办事项',
    dataIndex: 'name',
    key: 'name',
    editable: true,
    width: 240
  },
  // {
  //   title: '状态',
  //   dataIndex: 'status',
  //   key: 'status',
  // },
  {
    title: '负责人',
    dataIndex: 'owner',
    key: 'owner',
  },
  {
    title: '优先级',
    dataIndex: 'priority',
    key: 'priority',
    editable: true,
  },
  {
    title: '创建时间',
    dataIndex: 'createdAt',
    key: 'createdAt',
  },
  {
    title: '创建人',
    dataIndex: 'createdBy',
    key: 'createdBy',
  },
  {
    title: '排期',
    dataIndex: 'schedule',
    key: 'schedule',
    editable: true,
  },
  {
    title: '进行中节点',
    dataIndex: 'currentNode',
    key: 'currentNode',
  },
  {
    title: '需求类型',
    dataIndex: 'type',
    key: 'type',
  },
  {
    title: '描述',
    dataIndex: 'description',
    key: 'description',
    editable: true,
  },
]

function WorkItemList() {
  return (
    <Table
      className='mt-4'
      rowKey="id"
      dataSource={[]}
      columns={columns}
      pagination={{
        pageSize: 30
      }}
      bordered={false}
    />
  )
}

function WorkItemPage() {
  const { spaceId, workItemId } = useParams<{ spaceId: string, workItemId: string }>();
  return (
    <>
      <header className="flex py-3 px-5 w-full bg-white border-b border-[#cacbcd] items-center">
        <div className="bg-[#3250eb] w-8 h-8 flex items-center justify-center rounded-lg">
          <HomeFilled style={{ color: '#fff' }} />
        </div>
        <span className='ml-3 text-lg'>工作项: {workItemId}: {spaceId}</span>
      </header>
      <div className='py-8 flex flex-col w-full px-4'>
        <WorkItemStatusView items={[
          {
            name: '总数',
            value: '123'
          },
          {
            name: '已完成',
            value: 456
          },
          {
            name: '参与人员总数',
            value: 1
          },
          {
            name: '我参与的',
            value: 5
          }
        ]} />
        <MeegleCardFrame>
          <div className='flex justify-between'>
            <Tabs defaultActiveKey="1" items={items} />;
            <Button type='primary'>刷新</Button>
          </div>
          <WorkItemList />
        </MeegleCardFrame>
      </div>
    </>
  );
}

export default WorkItemPage;