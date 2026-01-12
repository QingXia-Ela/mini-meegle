import { getColorByStatus } from '../../../ProcessView/utils';
import GrayBorderCard from '../../../GrayBorderCard';
import { Button, Collapse, Form, Input, Popover, Select, Table, Tabs, Tag, InputNumber, DatePicker, Switch, message, Spin, List } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import ProcessViewComment, { CommentItem } from './Comment';
import type { ProcessNodeType } from '@/components/ProcessView/types';
import { useEffect, useState, useCallback } from 'react';
import { get, put, del } from '@/api/request';
import { FieldType, SystemFieldId, ReadonlyFieldId } from '@/constants/field';
import MemberSelect from '@/components/MemberSelect';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

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

interface BasicInfoFormProps {
  taskId: string;
  workItemId: string;
}

function BasicInfoForm({ taskId, workItemId }: BasicInfoFormProps) {
  const [form] = Form.useForm();
  const [fields, setFields] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [workflowTypes, setWorkflowTypes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [taskData, fieldsData, usersData, workflowTypesData] = await Promise.all([
        get(`/tasks/${taskId}`),
        get(`/workItems/${workItemId}/fields`),
        get('/users'),
        get(`/workflow-types/workItem/${workItemId}`),
      ]);

      setFields(fieldsData || []);
      setUsers(usersData || []);
      setWorkflowTypes(workflowTypesData || []);

      // Prepare form values
      const initialValues: any = {};
      if (taskData) {
        // System fields (Workflow Type is stored at top level)
        initialValues[SystemFieldId.WORKFLOW_TYPE] = taskData.workflowType;

        // Custom fields AND System fields (name, description) from fieldStatusList
        if (taskData.fieldStatusList) {
          taskData.fieldStatusList.forEach((fs: any) => {
            let val = fs.value;
            // Handle date types
            const field = fieldsData?.find((f: any) => f.id === fs.fieldId);
            if (field && val) {
              if (field.type === FieldType.DATE) {
                val = dayjs(val);
              } else if (field.type === FieldType.DATE_RANGE && Array.isArray(val)) {
                val = val.map((v: any) => dayjs(v));
              }
            }
            initialValues[fs.fieldId] = val;
          });
        }
      }
      form.setFieldsValue(initialValues);
    } catch {
      console.error('Failed to fetch task detail data');
      message.error('加载任务详情失败');
    } finally {
      setLoading(false);
    }
  }, [taskId, workItemId, form]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleUpdate = async () => {
    try {
      // For now, simplify update logic. Usually you'd want to debounced update or have a save button.
      // Here we update immediately on change for simplicity as requested "rendering corresponding components".
      const allValues = form.getFieldsValue();
      
      const fieldStatusList = Object.entries(allValues)
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

      await put(`/tasks/${taskId}`, {
        workflowType: allValues[SystemFieldId.WORKFLOW_TYPE],
        fieldStatusList,
      });
      message.success('更新成功');
    } catch {
      console.error('Update task failed');
      message.error('更新失败');
    }
  };

  const renderFieldInput = (field: any) => {
    const { type, name, jsonConfig } = field;
    const placeholder = field.id === SystemFieldId.WORKFLOW_TYPE ? '请选择流程类型' : `请输入${name}`;
    const isReadonly = Object.values(ReadonlyFieldId).includes(field.id);

    if (field.id === SystemFieldId.WORKFLOW_TYPE) {
      return (
        <Select placeholder={placeholder} onChange={() => handleUpdate()} disabled={isReadonly}>
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
        return <Input placeholder={placeholder} onBlur={() => handleUpdate()} disabled={isReadonly} />;
      case FieldType.TEXTAREA:
        return <TextArea placeholder={placeholder} rows={4} onBlur={() => handleUpdate()} disabled={isReadonly} />;
      case FieldType.NUMBER:
        return <InputNumber placeholder={placeholder} style={{ width: '100%' }} onChange={() => handleUpdate()} disabled={isReadonly} />;
      case FieldType.SELECT:
        return (
          <Select placeholder={placeholder} onChange={() => handleUpdate()} disabled={isReadonly}>
            {jsonConfig?.options?.map((opt: any) => (
              <Select.Option key={opt.id} value={opt.id}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        );
      case FieldType.MULTI_SELECT:
        return (
          <Select mode="multiple" placeholder={placeholder} onChange={() => handleUpdate()} disabled={isReadonly}>
            {jsonConfig?.options?.map((opt: any) => (
              <Select.Option key={opt.id} value={opt.id}>
                {opt.label}
              </Select.Option>
            ))}
          </Select>
        );
      case FieldType.DATE:
        return <DatePicker placeholder={placeholder} style={{ width: '100%' }} onChange={() => handleUpdate()} disabled={isReadonly} />;
      case FieldType.DATE_RANGE:
        return <RangePicker style={{ width: '100%' }} onChange={() => handleUpdate()} disabled={isReadonly} />;
      case FieldType.SWITCH:
        return <Switch onChange={() => handleUpdate()} disabled={isReadonly} />;
      case FieldType.MEMBER:
      case FieldType.MULTI_MEMBER:
        return (
          <MemberSelect
            options={users.map(u => ({ id: u.id.toString(), name: u.name, avatar: u.avatar }))}
            placeholder={placeholder}
            onChange={() => handleUpdate()}
            disabled={isReadonly}
          />
        );
      default:
        return <Input placeholder={placeholder} onBlur={() => handleUpdate()} disabled={isReadonly} />;
    }
  };

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

  if (loading) return <div className="p-10 text-center"><Spin /></div>;

  return (
    <Form form={form} layout="vertical" className="max-w-2xl">
      {displayFields.map(field => (
        <Form.Item
          key={field.id}
          name={field.id}
          label={<span className="font-bold">{field.name}</span>}
        >
          {renderFieldInput(field)}
        </Form.Item>
      ))}
    </Form>
  );
}

function CommentList({ 
  comments, 
  loading, 
  onReply, 
  onDelete, 
  onEdit 
}: { 
  comments: any[], 
  loading: boolean,
  onReply: (comment: any) => void,
  onDelete: (id: number) => void,
  onEdit: (comment: any) => void
}) {
  return (
    <div className="p-4 pb-24">
      <List
        loading={loading}
        dataSource={comments}
        renderItem={(item) => (
          <CommentItem 
            comment={item} 
            onReply={onReply} 
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )}
      />
    </div>
  );
}

interface ProcessBottomInfoProps {
  workItemId: string;
  taskId: string;
}

function ProcessBottomInfo({ workItemId, taskId }: ProcessBottomInfoProps) {
  const [activeTab, setActiveTab] = useState('basic-info');
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingComment, setEditingComment] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const data = await get(`/comments/task/${taskId}`);
      setComments(data || []);
    } catch {
      console.error('Failed to fetch comments');
    } finally {
      setLoading(false);
    }
  }, [taskId]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  const handleDelete = async (id: number) => {
    try {
      await del(`/comments/${id}`);
      message.success('删除成功');
      fetchComments();
    } catch {
      message.error('删除失败');
    }
  };

  const handleEdit = (comment: any) => {
    setEditingComment(comment);
    setActiveTab('comments'); // Switch to comments tab when editing/replying if not already there
  };

  const handleReply = (comment: any) => {
    setReplyingTo(comment);
    setActiveTab('comments');
  };

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
        <Tabs 
          size='large' 
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
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
          ]} 
        />
        {activeTab === 'basic-info' && <BasicInfoForm taskId={taskId} workItemId={workItemId} />}
        {activeTab === 'node-details' && <div className="p-4">节点详情建设中...</div>}
        {activeTab === 'comments' && (
          <CommentList 
            comments={comments}
            loading={loading}
            onReply={handleReply}
            onDelete={handleDelete}
            onEdit={handleEdit}
          />
        )}
      </div>
      <ProcessViewComment 
        taskId={taskId} 
        onSuccess={fetchComments}
        replyingTo={replyingTo}
        onCancelReply={() => setReplyingTo(null)}
        editingComment={editingComment}
        onCancelEdit={() => setEditingComment(null)}
      />
    </>
  );
}

export default ProcessBottomInfo;
