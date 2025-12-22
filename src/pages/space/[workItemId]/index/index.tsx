import { EditOutlined, HomeFilled } from '@ant-design/icons';
import { data, useNavigate, useParams, useRoutes } from 'react-router';
import WorkItemStatusView from './components/WorkItemStatusView';
import { Button, Form, Input, Table, Tabs, type InputRef, type TabsProps, type FormInstance, Select, DatePicker } from 'antd';
import MeegleCardFrame from '@/components/workItem/MeegleCardFrame';
import { createContext, use, useEffect, useRef, useState } from 'react';
import router from '@/router';

const items: TabsProps['items'] = [
  {
    key: 'all',
    label: '全部',
  },
  {
    key: 'recently',
    label: '最近浏览',
  },
  {
    key: 'created',
    label: '我创建的',
  },
  {
    key: 'assigned',
    label: '我参与的',
  },
  {
    key: 'favorite',
    label: '我收藏的',
  }
];

const editTypeMap = {
  input: {
    Component: Input
  },
  select: {
    Component: Select
  },
  date: {
    Component: DatePicker
  }
}

const defaultColumns = [
  {
    title: '待办事项',
    dataIndex: 'name',
    key: 'name',
    editable: true,
    width: 240,
    clickJumpToWorkItem: true,
  },
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
    editType: 'select',
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

const EditableContext = createContext<FormInstance<any> | null>(null);

type DataType = {
  id: number;
  name: string;
  owner: string;
  priority: string;
  createdAt: string;
  createdBy: string;
  schedule: string;
  currentNode: string;
  type: string;
  description: string;
};

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index: _index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext value={form}>
        <tr {...props} />
      </EditableContext>
    </Form>
  );
};


interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  dataIndex: keyof DataType;
  record: DataType;
  handleSave: (record: DataType) => void;
}

const EditableCell: React.FC<React.PropsWithChildren<EditableCellProps>> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = use(EditableContext)!;
  const navigate = useNavigate();
  const { workItemId, spaceId } = useParams<{ workItemId: string; spaceId: string }>();

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      const values = await form.validateFields();

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[{ required: true, message: `${title} is required.` }]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} size='small' />
      </Form.Item>
    ) : (
      <div
        className="group editable-cell-value-wrap relative w-full"
        style={{ paddingInlineEnd: 24 }}
      >
        <span className='hover:text-[#3250eb] cursor-pointer' onClick={dataIndex === 'name' ? () => navigate(`/space/${spaceId}/${workItemId}/${record.id}/detail`) : undefined}>{children}</span>
        <div className='!absolute right-0 top-0 group-hover:block hidden'>
          <Button icon={<EditOutlined />} onClick={(e) => (e.preventDefault(), toggleEdit())} size='small' />
        </div>
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

function WorkItemList() {
  const [dataSource, setDataSource] = useState<DataType[]>(Array.from({ length: 60 }).map((_, idx) => ({
    id: idx + 1,
    name: `待办事项 ${idx + 1}`,
    owner: `负责人 ${idx + 1}`,
    priority: ['高', '中', '低'][idx % 3],
    createdAt: '2024-01-01',
    createdBy: `创建人 ${idx + 1}`,
    schedule: '2024-01-10 to 2024-01-20',
    currentNode: `节点 ${idx + 1}`,
    type: ['功能', '缺陷', '任务'][idx % 3],
    description: `这是待办事项 ${idx + 1} 的描述。`,
  })));

  const handleSave = (row: DataType) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => row.id === item.id);
    const item = newData[index];
    newData.splice(index, 1, {
      ...item,
      ...row,
    });
    setDataSource(newData);
  };

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });


  const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
  };

  return (
    <Table
      className='flex-1'
      rowKey="id"
      dataSource={dataSource}
      columns={columns}
      pagination={{
        pageSize: 10
      }}
      bordered={false}
      components={components}
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
      <div className='flex flex-col w-full h-full p-4 flex-1'>
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
        <MeegleCardFrame className='flex-1 flex flex-col pt-0'>
          <div className='flex justify-between items-center'>
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