import { getColorByStatus } from '../../../ProcessView/utils';
import GrayBorderCard from '../../../GrayBorderCard';
import { Button, Collapse, Form, Input, Popover, Select, Table, Tabs, Tag } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import ProcessViewComment from './Comment';
import type { ProcessNodeType } from '@/components/ProcessView/types';

function NodeTitleBar({
  title,
  status,
}: {
  title: string,
  status: ProcessNodeType['status']
}) {
  return <div className='flex gap-2 items-center '>
    <div className='h-4 w-4 rounded-full' style={getColorByStatus(status)}></div>
    <span className='font-bold'>{title}</span>
    {status === 'in_progress' ?
      <Tag color="yellow-inverse" className='!text-black'>进行中</Tag> :
      status === 'completed' ?
        <Tag color="green" className='!text-black'>已完成</Tag> :
        <Tag color="gray" className='!text-black'>未开始</Tag>}
  </div>
}

const options = [
  {
    label: 'China',
    value: 'china',
    emoji: '🇨🇳',
    desc: 'China (中国)',
  },
  {
    label: 'USA',
    value: 'usa',
    emoji: '🇺🇸',
    desc: 'USA (美国)',
  },
  {
    label: 'Japan',
    value: 'japan',
    emoji: '🇯🇵',
    desc: 'Japan (日本)',
  },
  {
    label: 'Korea',
    value: 'korea',
    emoji: '🇰🇷',
    desc: 'Korea (韩国)',
  },
];

function MemberSelector({
  name
}: {
  name: string
}) {
  return <div className='flex items-center'>
    <span className='mr-2 w-50 font-bold'>{name}</span>
    <Select mode="multiple" options={options} placeholder="待填"></Select>
  </div>
}

function BasicInfoForm() {
  return <Form>
    <Form.Item label="名称" name="name">
      <Input />
    </Form.Item>
    <Form.Item label="描述" name="description">
      <Input.TextArea rows={4} />
    </Form.Item>
    <Form.Item label="需求类型" name="requirementType">
      <Tag color='blue'>测试需求</Tag>
    </Form.Item>
    <Form.Item label="需求文档" name="requireDocument">
      <Input />
    </Form.Item>
    <Form.Item label="角色与人员" name="rolesAndPersonnel">
      <MemberSelector name="DM" />
    </Form.Item>
  </Form>
}
function ProcessBottomInfo() {
  return (
    <>
      <div className='py-2 px-4 w-full'>
        <GrayBorderCard>
          <div className='flex justify-between mb-4'>
            <NodeTitleBar title='测试' status='in_progress' />
            <div className='flex items-center gap-2'>
              <Button className='w-40' type='primary'>完成</Button>
              <Popover placement='bottomRight' content="123">
                <Button icon={<MoreOutlined />} className='rotate-90'></Button>
              </Popover>
            </div>
          </div>
          <GrayBorderCard className='!px-2 !py-0 mb-4'>
            <Table size='small' pagination={false} columns={[
              {
                title: '负责人',
                dataIndex: 'assignee',
                key: 'assignee',
                width: 300,
              },
              {
                title: '总排期',
                dataIndex: 'totalSchedule',
                key: 'totalSchedule',
              }
            ]} dataSource={[
              {
                id: 1,
                assignee: 'Spark',
                totalSchedule: '2024-01-01 to 2024-02-01'
              },
            ]}></Table>
          </GrayBorderCard>
          <Collapse items={[
            {
              key: '1',
              label: '子任务',
              children:
                <>
                  <Table size='small' pagination={false} columns={[
                    {
                      title: '名称',
                      dataIndex: 'taskName',
                      key: 'taskName',
                    },
                    {
                      title: '负责人',
                      dataIndex: 'assignee',
                      key: 'assignee',
                    },
                    {
                      title: '排期',
                      dataIndex: 'schedule',
                      key: 'schedule',
                    }
                  ]} dataSource={[
                    {
                      id: 1,
                      taskName: '设计数据库',
                      assignee: 'Alice',
                      schedule: '2024-01-01 to 2024-01-10'
                    },
                  ]}></Table>
                  <Button type="link" size='large' className='relative -left-2'>+ 添加子任务</Button>
                </>
              ,
            }
          ]}></Collapse>
        </GrayBorderCard>
        <Tabs size='large' items={[
          {
            key: 'basic-info',
            label: '基本信息',
          },
          {
            key: 'node-details',
            label: '节点详情',
          },
          {
            key: 'comments',
            label: '评论',
          }
        ]} />
        <BasicInfoForm />
      </div>
      <ProcessViewComment />
    </>
  );
}

export default ProcessBottomInfo;