import { EditOutlined, HomeFilled, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router';
import WorkItemStatusView from './components/WorkItemStatusView';
import { Button, Form, Input, Table, Tabs, type InputRef, type TabsProps, type FormInstance, Select, DatePicker, Modal, message, InputNumber, Switch } from 'antd';
import MeegleCardFrame from '@/components/workItem/MeegleCardFrame';
import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { get, post } from '@/api/request';
import MemberSelect from '@/components/MemberSelect';
import dayjs from 'dayjs';
import { FieldType, SystemFieldId } from '@/constants/field';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

interface CreateTaskModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  workItemId: string;
}

const CreateTaskModal: React.FC<CreateTaskModalProps> = ({ visible, onCancel, onSuccess, workItemId }) => {
  const [form] = Form.useForm();
  const [fields, setFields] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [workflowTypes, setWorkflowTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchFields = useCallback(async () => {
    try {
      const data = await get(`/workItems/${workItemId}/fields`);
      setFields(data || []);
    } catch (e) {
      console.error('Failed to fetch fields', e);
    }
  }, [workItemId]);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await get('/users');
      setUsers(data || []);
    } catch (e) {
      console.error('Failed to fetch users', e);
    }
  }, []);

  const fetchWorkflowTypes = useCallback(async () => {
    try {
      const data = await get(`/workflow-types/workItem/${workItemId}`);
      setWorkflowTypes(data || []);
    } catch (e) {
      console.error('Failed to fetch workflow types', e);
    }
  }, [workItemId]);

  useEffect(() => {
    if (visible) {
      fetchFields();
      fetchUsers();
      fetchWorkflowTypes();
    }
  }, [visible, fetchFields, fetchUsers, fetchWorkflowTypes]);

  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const workflowType = values[SystemFieldId.WORKFLOW_TYPE];
      const fieldStatusList = Object.entries(values)
        .filter(([fieldId]) => fieldId !== SystemFieldId.WORKFLOW_TYPE)
        .map(([fieldId, value]) => {
          let finalValue = value;
          if (dayjs.isDayjs(value)) {
            finalValue = value.toISOString();
          } else if (Array.isArray(value) && value.length > 0 && dayjs.isDayjs(value[0])) {
            finalValue = value.map((v: any) => v.toISOString());
          }
          return {
            fieldId,
            value: finalValue === undefined ? null : finalValue,
          };
        });

      await post('/tasks', {
        wid: workItemId,
        workflowType,
        fieldStatusList,
      });

      message.success('创建成功');
      form.resetFields();
      onSuccess();
    } catch (e) {
      console.error('Create task failed', e);
    } finally {
      setLoading(false);
    }
  };

  const renderFieldInput = (field: any) => {
    const { type, name, jsonConfig } = field;
    const placeholder = field.id === SystemFieldId.WORKFLOW_TYPE ? '请选择流程类型' : `请输入${name}`;

    if (field.id === SystemFieldId.WORKFLOW_TYPE) {
      return (
        <Select placeholder={placeholder}>
          {workflowTypes.map((wt: any) => (
            <Select.Option key={wt.id} value={wt.id}>
              {wt.name}
            </Select.Option>
          ))}
        </Select>
      );
    }

    switch (type) {
      case FieldType.TEXT:
        return <Input placeholder={placeholder} />;
      case FieldType.TEXTAREA:
        return <TextArea placeholder={placeholder} rows={4} />;
      case FieldType.NUMBER:
        return <InputNumber placeholder={placeholder} style={{ width: '100%' }} />;
      case FieldType.SELECT:
        return (
          <Select placeholder={placeholder}>
            {jsonConfig?.options?.map((opt: any) => (
              <Select.Option key={opt.id} value={opt.id}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        );
      case FieldType.MULTI_SELECT:
        return (
          <Select mode="multiple" placeholder={placeholder}>
            {jsonConfig?.options?.map((opt: any) => (
              <Select.Option key={opt.id} value={opt.id}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        );
      case FieldType.DATE:
        return <DatePicker placeholder={placeholder} style={{ width: '100%' }} />;
      case FieldType.DATE_RANGE:
        return <RangePicker style={{ width: '100%' }} />;
      case FieldType.SWITCH:
        return <Switch />;
      case FieldType.MEMBER:
      case FieldType.MULTI_MEMBER:
        return (
          <MemberSelect
            options={users.map(u => ({ id: u.id.toString(), name: u.name, avatar: u.avatar }))}
            placeholder={placeholder}
          />
        );
      default:
        return <Input placeholder={placeholder} />;
    }
  };

  // 排序：name, description 优先，然后是自定义字段
  const sortedFields = [...fields].sort((a, b) => {
    if (a.id === SystemFieldId.NAME) return -1;
    if (b.id === SystemFieldId.NAME) return 1;
    if (a.id === SystemFieldId.DESCRIPTION) return -1;
    if (b.id === SystemFieldId.DESCRIPTION) return 1;
    return 0;
  });

  const displayFields = sortedFields.filter(f => 
    f.id === SystemFieldId.NAME || 
    f.id === SystemFieldId.DESCRIPTION || 
    f.id === SystemFieldId.WORKFLOW_TYPE || 
    f.systemType === 'custom'
  );

  return (
    <Modal
      title="新建任务"
      open={visible}
      onOk={handleOk}
      onCancel={onCancel}
      confirmLoading={loading}
      width={600}
      destroyOnClose
    >
      <Form form={form} layout="vertical" className="mt-4">
        {displayFields.map(field => (
          <Form.Item
            key={field.id}
            name={field.id}
            label={field.name}
            rules={[{ required: field.isRequire, message: `${field.name}是必填项` }]}
          >
            {renderFieldInput(field)}
          </Form.Item>
        ))}
      </Form>
    </Modal>
  );
};

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

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index: _index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};


interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  dataIndex: string;
  record: any;
  handleSave: (record: any) => void;
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
  const form = useContext(EditableContext)!;
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
const components = {
    body: {
      row: EditableRow,
      cell: EditableCell,
    },
};
  
function WorkItemList() {
  const { workItemId, spaceId } = useParams<{ workItemId: string; spaceId: string }>();
  const [dataSource, setDataSource] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
  });

  const fetchTasks = useCallback(async (current: number, pageSize: number) => {
    if (!workItemId) return;
    setLoading(true);
    try {
      const offset = (current - 1) * pageSize;
      const data = await get(`/tasks/workItem/${workItemId}?count=${pageSize}&offset=${offset}`);
      if (data && data.rows) {
        // 将 fieldStatusList 展开到任务对象上，方便表格显示
        const formattedRows = data.rows.map((row: any) => {
          const taskData = { ...row };
          if (row.fieldStatusList && Array.isArray(row.fieldStatusList)) {
            row.fieldStatusList.forEach((fs: any) => {
              taskData[fs.fieldId] = fs.value;
            });
          }
          return taskData;
        });
        setDataSource(formattedRows);
        setTotal(data.count);
      }
    } catch (e) {
      console.error('Failed to fetch tasks', e);
    } finally {
      setLoading(false);
    }
  }, [workItemId]);

  useEffect(() => {
    fetchTasks(pagination.current, pagination.pageSize);
  }, [fetchTasks, pagination.current, pagination.pageSize]);

  const handleTableChange = (newPagination: any) => {
    setPagination({
      current: newPagination.current,
      pageSize: newPagination.pageSize,
    });
  };

  const handleSave = (row: any) => {
    // TODO: 实现保存逻辑
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
      onCell: (record: any) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  return (
    <Table
      className='flex-1'
      rowKey="id"
      dataSource={dataSource}
      columns={columns}
      loading={loading}
      pagination={{
        current: pagination.current,
        pageSize: pagination.pageSize,
        total: total,
        showSizeChanger: true,
      }}
      onChange={handleTableChange}
      bordered={false}
      components={components}
    />
  );
}

function WorkItemPage() {
  const { spaceId, workItemId } = useParams<{ spaceId: string, workItemId: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({ total: 0, participants: 0, myParticipated: 0 });

  const fetchStats = useCallback(async () => {
    if (!workItemId) return;
    try {
      const data = await get(`/tasks/workItem/${workItemId}/stats`);
      if (data) {
        setStats(data);
      }
    } catch (e) {
      console.error('Failed to fetch stats', e);
    }
  }, [workItemId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const handleRefresh = () => {
    fetchStats();
    // 可以在这里添加刷新列表的逻辑，目前数据是 Mock 的
    window.location.reload();
  };

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
            value: stats.total
          },
          {
            name: '参与人员总数',
            value: stats.participants
          },
          {
            name: '我参与的',
            value: stats.myParticipated
          }
        ]} />
        <MeegleCardFrame className='flex-1 flex flex-col pt-0'>
          <div className='flex justify-between items-center'>
            <Tabs defaultActiveKey="1" items={items} />;
            <div className='flex gap-2'>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
              <Button type='primary' icon={<PlusOutlined />} onClick={() => setIsModalOpen(true)}>新增</Button>
            </div>
          </div>
          <WorkItemList />
        </MeegleCardFrame>
      </div>
      <CreateTaskModal
        visible={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        onSuccess={() => {
          setIsModalOpen(false);
          handleRefresh();
        }}
        workItemId={workItemId!}
      />
    </>

  );
}

export default WorkItemPage;