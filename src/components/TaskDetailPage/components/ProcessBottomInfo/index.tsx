import { getColorByStatus } from '../../../ProcessView/utils';
import GrayBorderCard from '../../../GrayBorderCard';
import { Button, Collapse, Form, Input, Popover, Select, Table, Tabs, Tag, InputNumber, DatePicker, Switch, message, Spin, List, Modal, Upload } from 'antd';
import type { RangePickerProps } from 'antd/es/date-picker';
import { MoreOutlined, UploadOutlined } from '@ant-design/icons';
import ProcessViewComment, { CommentItem } from './Comment';
import type { ProcessNodeType } from '@/components/ProcessView/types';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { get, put, del, post } from '@/api/request';
import { FieldType, SystemFieldId, ReadonlyFieldId } from '@/constants/field';
import MemberSelect from '@/components/MemberSelect';
import dayjs from 'dayjs';
import type { ApprovalInfo, ApprovalMode, SubTaskInfo, TaskNodeStatusDetail } from '@/components/TaskDetailPage/types';
import { transitionNodeStatus } from '@/components/TaskDetailPage/api';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

type ScheduleRangeValue = RangePickerProps['value'];

const EMPTY_NODES: ProcessNodeType[] = [];
const EMPTY_STATUS_LIST: TaskNodeStatusDetail[] = [];

const formatScheduleRange = (value: ScheduleRangeValue) => {
  if (!value || !value[0] || !value[1]) return '';
  const [start, end] = value;
  return `${start.format('YYYY-MM-DD')} ~ ${end.format('YYYY-MM-DD')}`;
};

const parseScheduleRange = (value?: string | null): ScheduleRangeValue => {
  if (!value) return null;
  const parts = value.split('~').map((item) => item.trim());
  if (parts.length !== 2) return null;
  const [start, end] = parts;
  const startDate = dayjs(start);
  const endDate = dayjs(end);
  if (!startDate.isValid() || !endDate.isValid()) return null;
  return [startDate, endDate];
};

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
        <Tag color="#ccc" className='!text-black'>未开始</Tag>}
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

const APPROVAL_MODE_LABELS: Record<ApprovalMode, string> = {
  none: '无检查',
  merge_request: '合并请求检查',
  document: '填入相关文档检查',
  ai_material: '填入相关素材并引入 AI 审查',
};

type ApprovalStageStatus = 'pending' | 'running' | 'success' | 'error' | 'skipped';

const APPROVAL_STAGE_STATUS_LABELS: Record<ApprovalStageStatus, string> = {
  pending: '待检查',
  running: '检查中',
  success: '通过',
  error: '不通过',
  skipped: '已跳过',
};

const APPROVAL_STAGE_STATUS_COLORS: Record<ApprovalStageStatus, string> = {
  pending: 'default',
  running: 'processing',
  success: 'green',
  error: 'red',
  skipped: 'default',
};

interface ApprovalInfoPanelProps {
  taskId: string;
  nodeId?: string | number | null;
  nodeName?: string;
  approvalConfig?: {
    mode?: ApprovalMode;
    prompt?: string;
    aiReviewMr?: boolean;
  };
  onRefreshNodes?: () => Promise<void> | void;
}

function ApprovalInfoPanel({
  taskId,
  nodeId,
  nodeName,
  approvalConfig,
  onRefreshNodes,
}: ApprovalInfoPanelProps) {
  const [form] = Form.useForm();
  const [approvalInfo, setApprovalInfo] = useState<ApprovalInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);

  const mode = approvalConfig?.mode || 'none';
  const shouldRender = Boolean(nodeId) && mode !== 'none';
  const lastResult = approvalInfo?.lastCheckResult;
  const aiReviewDetail = lastResult?.detail?.aiReview;
  const issues = lastResult?.detail?.issues || aiReviewDetail?.issues || [];
  const conversation = lastResult?.detail?.conversation || aiReviewDetail?.conversation || [];
  const rawOutput = lastResult?.detail?.raw || aiReviewDetail?.raw;
  const giteeMrUrl = Form.useWatch('giteeMrUrl', form) || approvalInfo?.giteeMrUrl;
  const aiReviewMrEnabled = (approvalInfo?.aiReviewMr ?? approvalConfig?.aiReviewMr) === true;
  const stageItems = useMemo(() => {
    const detail = lastResult?.detail || {};
    const items: Array<{ name: string; status: ApprovalStageStatus; message: string }> = [];
    if (mode === 'merge_request') {
      items.push({
        name: '目标分支检查',
        status: !lastResult ? 'pending' : detail.targetBranch === 'main' || detail.targetBranch === 'master' ? 'success' : 'error',
        message: detail.targetBranch ? `目标分支：${detail.targetBranch}` : '等待检查',
      });
      items.push({
        name: '冲突检查',
        status: !lastResult ? 'pending' : detail.hasConflict ? 'error' : 'success',
        message: !lastResult ? '等待检查' : detail.hasConflict ? '存在冲突' : '未发现冲突',
      });
      items.push({
        name: '评论解决检查',
        status: !lastResult ? 'pending' : detail.unresolvedCommentCount > 0 ? 'error' : 'success',
        message: !lastResult ? '等待检查' : `未解决评论数：${detail.unresolvedCommentCount ?? 0}`,
      });
      items.push({
        name: 'AI review',
        status: checking
          ? 'running'
          : !aiReviewMrEnabled
            ? 'skipped'
            : detail.aiReviewSkipped
              ? 'skipped'
              : !lastResult
                ? 'pending'
                : aiReviewDetail?.passed
                  ? 'success'
                  : 'error',
        message: checking
          ? '正在执行'
          : !aiReviewMrEnabled
            ? '未开启'
            : detail.aiReviewSkipped
              ? '基础检查未通过，已跳过 AI review'
              : aiReviewDetail?.message || '等待检查',
      });
      return items;
    }
    if (mode === 'document') {
      items.push({
        name: '文档链接检查',
        status: !lastResult ? 'pending' : lastResult.passed ? 'success' : 'error',
        message: lastResult?.message || '等待检查',
      });
    }
    if (mode === 'ai_material') {
      items.push({
        name: '素材读取',
        status: !lastResult ? 'pending' : lastResult.passed || rawOutput ? 'success' : 'error',
        message: !lastResult ? '等待检查' : rawOutput ? '已获取 AI 输出' : lastResult.message,
      });
      items.push({
        name: 'AI 审查',
        status: checking ? 'running' : !lastResult ? 'pending' : lastResult.passed ? 'success' : 'error',
        message: lastResult?.message || '等待检查',
      });
    }
    return items;
  }, [aiReviewDetail, aiReviewMrEnabled, checking, lastResult, mode, rawOutput]);

  const fetchApprovalInfo = useCallback(async () => {
    if (!nodeId || mode === 'none') {
      setApprovalInfo(null);
      form.resetFields();
      return;
    }
    setLoading(true);
    try {
      const data = await get<ApprovalInfo>(
        `/task-node-status/${taskId}/nodes/${encodeURIComponent(String(nodeId))}/approval`,
        { showError: false },
      );
      setApprovalInfo(data || {});
      form.setFieldsValue(data || {});
    } catch {
      message.error('加载审批信息失败');
    } finally {
      setLoading(false);
    }
  }, [form, mode, nodeId, taskId]);

  useEffect(() => {
    fetchApprovalInfo();
  }, [fetchApprovalInfo]);

  const saveApprovalInfo = useCallback(async (extra?: Partial<ApprovalInfo>) => {
    if (!nodeId) return null;
    const values = form.getFieldsValue();
    const data = await put<ApprovalInfo>(
      `/task-node-status/${taskId}/nodes/${encodeURIComponent(String(nodeId))}/approval`,
      {
        ...values,
        ...extra,
        mode,
      },
    );
    setApprovalInfo(data || {});
    form.setFieldsValue(data || {});
    await onRefreshNodes?.();
    return data;
  }, [form, mode, nodeId, onRefreshNodes, taskId]);

  const handleCheck = useCallback(async () => {
    if (!nodeId) return;
    setChecking(true);
    try {
      await saveApprovalInfo();
      const data = await post<ApprovalInfo>(
        `/task-node-status/${taskId}/nodes/${encodeURIComponent(String(nodeId))}/approval/check`,
      );
      setApprovalInfo(data || {});
      form.setFieldsValue(data || {});
      if (data?.lastCheckResult?.passed) {
        message.success('审批检查通过');
      } else {
        message.warning(data?.lastCheckResult?.message || '审批检查未通过');
      }
      await onRefreshNodes?.();
    } catch {
      message.error('审批检查失败');
    } finally {
      setChecking(false);
    }
  }, [form, nodeId, onRefreshNodes, saveApprovalInfo, taskId]);

  if (!shouldRender) return null;

  return (
    <GrayBorderCard className="!px-3 !py-3 mb-4">
      <Spin spinning={loading}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="text-sm font-medium text-[#262626]">审批信息</div>
            <div className="text-xs text-[#8c8c8c] mt-1">
              {nodeName ? `${nodeName} · ` : ''}{APPROVAL_MODE_LABELS[mode]}
              {approvalInfo?.aiReviewMr ? ' · MR AI 扫描已开启' : ''}
            </div>
          </div>
          {lastResult && (
            <Tag color={lastResult.passed ? 'green' : 'red'}>
              {lastResult.passed ? '已通过' : '未通过'}
            </Tag>
          )}
        </div>

        <Form form={form} layout="vertical">
          {mode === 'merge_request' && (
            <Form.Item label="Gitee MR 链接" name="giteeMrUrl" className="mb-3">
              <Input placeholder="https://gitee.com/{owner}/{repo}/pulls/{number}" onBlur={() => saveApprovalInfo()} />
            </Form.Item>
          )}

          {mode === 'document' && (
            <Form.Item label="文档链接" name="documentUrl" className="mb-3">
              <Input placeholder="请输入文档链接" onBlur={() => saveApprovalInfo()} />
            </Form.Item>
          )}

          {mode === 'ai_material' && (
            <>
              <Form.Item label="文档链接" name="documentUrl" className="mb-3">
                <Input placeholder="可填写文档链接" onBlur={() => saveApprovalInfo()} />
              </Form.Item>
              <Form.Item label="素材链接" name="materialUrl" className="mb-3">
                <Input placeholder="可填写素材链接" onBlur={() => saveApprovalInfo()} />
              </Form.Item>
              <Form.Item label="上传附件" className="mb-3">
                <Upload
                  maxCount={1}
                  showUploadList={false}
                  beforeUpload={async (file) => {
                    const formData = new FormData();
                    formData.append('file', file);
                    try {
                      const uploaded = await post<{ url: string; name: string }>('/upload/file', formData);
                      await saveApprovalInfo({
                        attachmentUrl: uploaded.url,
                        attachmentName: uploaded.name || file.name,
                      });
                      message.success('附件已上传');
                    } catch {
                      message.error('附件上传失败');
                    }
                    return Upload.LIST_IGNORE;
                  }}
                >
                  <Button icon={<UploadOutlined />}>上传附件</Button>
                </Upload>
                {approvalInfo?.attachmentName && (
                  <div className="text-xs text-[#595959] mt-2">
                    当前附件：{approvalInfo.attachmentName}
                  </div>
                )}
              </Form.Item>
              {approvalConfig?.prompt && (
                <div className="text-xs text-[#8c8c8c] bg-[#fafafa] border border-[#f0f0f0] rounded px-3 py-2 mb-3 whitespace-pre-wrap">
                  提示词：{approvalConfig.prompt}
                </div>
              )}
            </>
          )}
        </Form>

        {lastResult && (
          <div className="text-xs text-[#595959] bg-[#fafafa] border border-[#f0f0f0] rounded px-3 py-2 mb-3">
            <div>{lastResult.message}</div>
            <div className="mt-1 text-[#8c8c8c]">检查时间：{lastResult.checkedAt}</div>
            {issues.length > 0 && (
              <div className="mt-1 text-[#ff4d4f]">问题数量：{issues.length}</div>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          <Button type="primary" loading={checking} onClick={handleCheck}>
            执行检查
          </Button>
          <Button onClick={() => setDetailOpen(true)}>查看卡点状态</Button>
          {mode === 'merge_request' && giteeMrUrl && (
            <Button href={giteeMrUrl} target="_blank">
              打开 Gitee MR
            </Button>
          )}
        </div>

        <Modal
          title="卡点状态与 AI 审查详情"
          open={detailOpen}
          onCancel={() => setDetailOpen(false)}
          footer={null}
          width={760}
        >
          <div className="space-y-4">
            <div>
              <div className="font-medium mb-2">阶段状态</div>
              {mode === 'merge_request' && giteeMrUrl && (
                <Button className="mb-2" size="small" href={giteeMrUrl} target="_blank">
                  打开 Gitee MR
                </Button>
              )}
              <List
                size="small"
                dataSource={stageItems}
                renderItem={(item) => (
                  <List.Item>
                    <div className="flex items-start justify-between gap-3 w-full">
                      <div>
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-[#8c8c8c] mt-1">{item.message}</div>
                      </div>
                      <Tag color={APPROVAL_STAGE_STATUS_COLORS[item.status]}>
                        {APPROVAL_STAGE_STATUS_LABELS[item.status]}
                      </Tag>
                    </div>
                  </List.Item>
                )}
              />
            </div>
            <div>
              <div className="font-medium mb-2">问题列表</div>
              {issues.length > 0 ? (
                <List
                  size="small"
                  dataSource={issues}
                  renderItem={(item) => (
                    <List.Item>
                      <div>
                        <div className="font-mono text-xs text-[#595959]">
                          {item.file}{item.line ? `:${item.line}` : ''}
                        </div>
                        <div>{item.message}</div>
                      </div>
                    </List.Item>
                  )}
                />
              ) : (
                <div className="text-[#8c8c8c]">暂无问题</div>
              )}
            </div>
            <div>
              <div className="font-medium mb-2">对话流程</div>
              {conversation.length > 0 ? (
                <div className="space-y-2 max-h-[360px] overflow-auto">
                  {conversation.map((item, index) => (
                    <div key={`${item.role}-${index}`} className="border border-[#f0f0f0] rounded p-2">
                      <div className="text-xs font-medium text-[#595959] mb-1">{item.role}</div>
                      <pre className="text-xs whitespace-pre-wrap m-0">{item.content}</pre>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-[#8c8c8c]">暂无对话记录</div>
              )}
            </div>
            {rawOutput && (
              <div>
                <div className="font-medium mb-2">AI 原始输出</div>
                <pre className="text-xs whitespace-pre-wrap bg-[#fafafa] border border-[#f0f0f0] rounded p-2 max-h-[240px] overflow-auto">
                  {rawOutput}
                </pre>
              </div>
            )}
          </div>
        </Modal>
      </Spin>
    </GrayBorderCard>
  );
}

interface ProcessBottomInfoProps {
  spaceId: string;
  workItemId: string;
  taskId: string;
  currentNode?: ProcessNodeType | null;
  taskNodeStatus?: TaskNodeStatusDetail | null;
  workflowNodes?: ProcessNodeType[];
  taskNodeStatusList?: TaskNodeStatusDetail[];
  onRefreshNodes?: () => Promise<void> | void;
}

function ProcessBottomInfo({
  workItemId,
  taskId,
  currentNode,
  taskNodeStatus,
  workflowNodes = EMPTY_NODES,
  taskNodeStatusList = EMPTY_STATUS_LIST,
  onRefreshNodes,
}: ProcessBottomInfoProps) {
  const [activeTab, setActiveTab] = useState('basic-info');
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingComment, setEditingComment] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  const [subTasks, setSubTasks] = useState<SubTaskInfo[]>([]);
  const [subTaskLoading, setSubTaskLoading] = useState(false);
  const [subTaskModalOpen, setSubTaskModalOpen] = useState(false);
  const [editingSubTask, setEditingSubTask] = useState<SubTaskInfo | null>(null);
  const [subTaskForm] = Form.useForm();
  const [subTaskNodeId, setSubTaskNodeId] = useState<string | number | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [nodeMaintainerIds, setNodeMaintainerIds] = useState<string[]>([]);
  const [nodeSchedule, setNodeSchedule] = useState('');
  const [nodeSaving, setNodeSaving] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [rollbackPopoverOpen, setRollbackPopoverOpen] = useState(false);
  const [nodeSavingId, setNodeSavingId] = useState<string | null>(null);
  const [statusUpdatingId, setStatusUpdatingId] = useState<string | null>(null);
  const [nodeMaintainerMap, setNodeMaintainerMap] = useState<Record<string, string[]>>({});
  const [nodeScheduleMap, setNodeScheduleMap] = useState<Record<string, string>>({});

  const currentStatus = taskNodeStatus?.node_status || currentNode?.status || 'pending';
  const canComplete = currentStatus === 'in_progress';
  const isCompleted = currentStatus === 'completed';
  const mainButtonText = isCompleted || canComplete ? '完成' : '未开始';

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

  const fetchSubTasks = useCallback(async () => {
    if (!currentNode?.id) {
      setSubTasks([]);
      return;
    }
    setSubTaskLoading(true);
    try {
      const data = await get<SubTaskInfo[]>(
        `/task-node-status/${taskId}/nodes/${encodeURIComponent(String(currentNode.id))}/sub-tasks`,
        { showError: false },
      );
      setSubTasks(data || []);
    } catch {
      message.error('加载子任务失败');
    } finally {
      setSubTaskLoading(false);
    }
  }, [taskId, currentNode?.id]);

  useEffect(() => {
    fetchSubTasks();
  }, [fetchSubTasks]);

  const fetchUsers = useCallback(async () => {
    try {
      const data = await get('/users');
      setUsers(data || []);
    } catch {
      message.error('加载成员失败');
    }
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const userOptions = useMemo(
    () => users.map((user) => ({
      id: String(user.id),
      name: user.name,
      avatar: user.avatar,
      color: user.color,
    })),
    [users],
  );

  const userNameMap = useMemo(() => {
    const map = new Map<string, string>();
    userOptions.forEach((user) => {
      map.set(user.id, user.name);
    });
    return map;
  }, [userOptions]);

  const nodeStatusMap = useMemo(() => {
    const map = new Map<string, TaskNodeStatusDetail>();
    taskNodeStatusList.forEach((item) => {
      map.set(String(item.nodeId), item);
    });
    return map;
  }, [taskNodeStatusList]);

  useEffect(() => {
    if (!taskNodeStatus) {
      setNodeMaintainerIds([]);
      setNodeSchedule('');
      return;
    }
    setNodeMaintainerIds(
      taskNodeStatus.maintainerId ? [String(taskNodeStatus.maintainerId)] : [],
    );
    setNodeSchedule(taskNodeStatus.maintainerSchedule || '');
  }, [taskNodeStatus?.maintainerId, taskNodeStatus?.maintainerSchedule]);

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

  const openCreateSubTask = useCallback(
    (nodeId?: string | number | null) => {
      setSubTaskNodeId(nodeId ?? currentNode?.id ?? null);
      setEditingSubTask(null);
      subTaskForm.resetFields();
      setSubTaskModalOpen(true);
    },
    [currentNode?.id, subTaskForm],
  );

  const openEditSubTask = useCallback(
    (record: SubTaskInfo, nodeId?: string | number | null) => {
      setSubTaskNodeId(nodeId ?? currentNode?.id ?? null);
      setEditingSubTask(record);
      subTaskForm.setFieldsValue({
        name: record.name,
        maintainer: record.maintainer ? [String(record.maintainer)] : [],
        schedule: parseScheduleRange(record.schedule),
      });
      setSubTaskModalOpen(true);
    },
    [currentNode?.id, subTaskForm],
  );

  const updateNodeStatus = useCallback(
    async (nextMaintainerIds?: string[], nextSchedule?: string) => {
      if (!currentNode?.id) {
        message.warning('请先选择节点');
        return;
      }
      setNodeSaving(true);
      try {
        const maintainerValue =
          nextMaintainerIds !== undefined ? nextMaintainerIds : nodeMaintainerIds;
        const scheduleValue =
          nextSchedule !== undefined ? nextSchedule : nodeSchedule;
        await put(
          `/task-node-status/${taskId}/nodes/${encodeURIComponent(String(currentNode.id))}`,
          {
            maintainerId: maintainerValue[0] ? Number(maintainerValue[0]) : null,
            maintainerSchedule: scheduleValue || null,
          },
        );
        message.success('节点信息已更新');
        await onRefreshNodes?.();
      } catch {
        message.error('更新节点信息失败');
      } finally {
        setNodeSaving(false);
      }
    },
    [taskId, currentNode?.id, nodeMaintainerIds, nodeSchedule, onRefreshNodes],
  );

  const updateNodeStatusByNode = useCallback(
    async (
      nodeId: string | number,
      nextMaintainerIds?: string[],
      nextSchedule?: string,
    ) => {
      if (!nodeId) {
        message.warning('请先选择节点');
        return;
      }
      const key = String(nodeId);
      setNodeSavingId(key);
      try {
        const maintainerValue =
          nextMaintainerIds !== undefined
            ? nextMaintainerIds
            : nodeMaintainerMap[key] || [];
        const scheduleValue =
          nextSchedule !== undefined ? nextSchedule : nodeScheduleMap[key] || '';
        await put(
          `/task-node-status/${taskId}/nodes/${encodeURIComponent(String(nodeId))}`,
          {
            maintainerId: maintainerValue[0] ? Number(maintainerValue[0]) : null,
            maintainerSchedule: scheduleValue || null,
          },
        );
        message.success('节点信息已更新');
        await onRefreshNodes?.();
      } catch {
        message.error('更新节点信息失败');
      } finally {
        setNodeSavingId(null);
      }
    },
    [taskId, nodeMaintainerMap, nodeScheduleMap, onRefreshNodes],
  );

  const handleSubmitSubTask = async () => {
    try {
      const targetNodeId = subTaskNodeId ?? currentNode?.id;
      if (!targetNodeId) {
        message.warning('请先选择节点');
        return;
      }
      const values = await subTaskForm.validateFields();
      const maintainerId = Array.isArray(values.maintainer)
        ? values.maintainer[0]
        : values.maintainer;
      const payload = {
        name: values.name,
        maintainer: maintainerId || null,
        schedule: formatScheduleRange(values.schedule || null) || null,
      };
      if (editingSubTask) {
        await put(
          `/task-node-status/${taskId}/nodes/${encodeURIComponent(String(targetNodeId))}/sub-tasks/${encodeURIComponent(editingSubTask.name)}`,
          payload,
        );
        message.success('更新子任务成功');
      } else {
        await post(
          `/task-node-status/${taskId}/nodes/${encodeURIComponent(String(targetNodeId))}/sub-tasks`,
          payload,
        );
        message.success('新增子任务成功');
      }
      setSubTaskModalOpen(false);
      setEditingSubTask(null);
      setSubTaskNodeId(null);
      if (String(targetNodeId) === String(currentNode?.id)) {
        fetchSubTasks();
      }
      await onRefreshNodes?.();
    } catch {
      message.error('保存子任务失败');
    }
  };

  const handleDeleteSubTask = useCallback(
    (record: SubTaskInfo, nodeId?: string | number | null) => {
      const targetNodeId = nodeId ?? currentNode?.id;
      if (!targetNodeId) {
        message.warning('请先选择节点');
        return;
      }
      Modal.confirm({
        title: '确认删除子任务？',
        content: record.name,
        okText: '删除',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: async () => {
          await del(
            `/task-node-status/${taskId}/nodes/${encodeURIComponent(String(targetNodeId))}/sub-tasks/${encodeURIComponent(record.name)}`,
          );
          message.success('删除子任务成功');
          if (String(targetNodeId) === String(currentNode?.id)) {
            fetchSubTasks();
          }
          await onRefreshNodes?.();
        },
      });
    },
    [currentNode?.id, fetchSubTasks, onRefreshNodes, taskId],
  );

  const handleCompleteNode = async () => {
    if (!currentNode?.id) {
      message.warning('请先选择节点');
      return;
    }
    if (!canComplete || statusUpdating) return;
    setStatusUpdating(true);
    try {
      await transitionNodeStatus(taskId, currentNode.id, 'completed');
      message.success('节点已完成');
      await onRefreshNodes?.();
    } catch {
      message.error('节点状态更新失败');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleRollbackNode = () => {
    if (!currentNode?.id) {
      message.warning('请先选择节点');
      return;
    }
    if (!isCompleted || statusUpdating) return;
    setRollbackPopoverOpen(false);
    Modal.confirm({
      title: '确认回滚节点？',
      content: '回滚后流程状态将重新计算，是否继续？',
      okText: '回滚',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: async () => {
        setStatusUpdating(true);
        try {
          await transitionNodeStatus(taskId, currentNode.id, 'in_progress');
          message.success('节点已回滚');
          await onRefreshNodes?.();
        } catch {
          message.error('回滚失败');
        } finally {
          setStatusUpdating(false);
        }
      },
    });
  };

  const handleCompleteNodeById = useCallback(
    async (nodeId: string | number, nodeStatus: ProcessNodeType['status']) => {
      if (nodeStatus !== 'in_progress') return;
      const key = String(nodeId);
      if (statusUpdatingId === key) return;
      setStatusUpdatingId(key);
      try {
        await transitionNodeStatus(taskId, nodeId, 'completed');
        message.success('节点已完成');
        await onRefreshNodes?.();
      } catch {
        message.error('节点状态更新失败');
      } finally {
        setStatusUpdatingId(null);
      }
    },
    [onRefreshNodes, statusUpdatingId, taskId],
  );

  const handleRollbackNodeById = useCallback(
    (nodeId: string | number, nodeStatus: ProcessNodeType['status']) => {
      if (nodeStatus !== 'completed') return;
      const key = String(nodeId);
      if (statusUpdatingId === key) return;
      Modal.confirm({
        title: '确认回滚节点？',
        content: '回滚后流程状态将重新计算，是否继续？',
        okText: '回滚',
        cancelText: '取消',
        okButtonProps: { danger: true },
        onOk: async () => {
          setStatusUpdatingId(key);
          try {
            await transitionNodeStatus(taskId, nodeId, 'in_progress');
            message.success('节点已回滚');
            await onRefreshNodes?.();
          } catch {
            message.error('回滚失败');
          } finally {
            setStatusUpdatingId(null);
          }
        },
      });
    },
    [onRefreshNodes, statusUpdatingId, taskId],
  );

  const nodeDetailItems = useMemo(() => {
    if (workflowNodes.length === 0) return [];
    return workflowNodes.map((node) => {
      const key = String(node.id);
      const statusDetail = nodeStatusMap.get(key);
      const nodeStatus = statusDetail?.node_status || node.status || 'pending';
      const maintainerIds = nodeMaintainerMap[key] ??
        (statusDetail?.maintainerId ? [String(statusDetail.maintainerId)] : []);
      const schedule = nodeScheduleMap[key] ?? (statusDetail?.maintainerSchedule || '');
      const subTaskList = statusDetail?.subTaskList || [];
      const isSaving = nodeSavingId === key;
      const isStatusUpdating = statusUpdatingId === key;
      const canCompleteNode = nodeStatus === 'in_progress';
      const isCompletedNode = nodeStatus === 'completed';
      return {
        key,
        label: <NodeTitleBar title={node.name || `节点 ${node.id}`} status={nodeStatus} />,
        children: (
          <div className="p-4">
            <GrayBorderCard>
              <div className='flex justify-between mb-4'>
                <NodeTitleBar
                  title={node.name || '未命名节点'}
                  status={nodeStatus}
                />
                <div className='flex items-center gap-2'>
                  <Button
                    className='w-40'
                    type='primary'
                    disabled={!canCompleteNode}
                    loading={isStatusUpdating && canCompleteNode}
                    onClick={() => handleCompleteNodeById(node.id, nodeStatus)}
                  >
                    完成
                  </Button>
                  <Popover
                    placement='bottomRight'
                    trigger='click'
                    content={
                      <Button
                        type='text'
                        danger
                        disabled={!isCompletedNode || isStatusUpdating}
                        onClick={() => handleRollbackNodeById(node.id, nodeStatus)}
                      >
                        回滚
                      </Button>
                    }
                  >
                    <Button icon={<MoreOutlined />} className='rotate-90' disabled={!isCompletedNode}></Button>
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
                    assignee: (
                      <MemberSelect
                        options={userOptions}
                        value={maintainerIds}
                        onChange={(next) => {
                          setNodeMaintainerMap((prev) => ({ ...prev, [key]: next }));
                          updateNodeStatusByNode(node.id, next, undefined);
                        }}
                        placeholder="请选择负责人"
                        disabled={isSaving}
                      />
                    ),
                    totalSchedule: (
                      <RangePicker
                        value={parseScheduleRange(schedule)}
                        onChange={(value) => {
                          const nextSchedule = formatScheduleRange(value);
                          setNodeScheduleMap((prev) => ({ ...prev, [key]: nextSchedule }));
                          updateNodeStatusByNode(node.id, undefined, nextSchedule);
                        }}
                        disabled={isSaving}
                      />
                    ),
                  },
                ]}></Table>
              </GrayBorderCard>
              <ApprovalInfoPanel
                taskId={taskId}
                nodeId={node.id}
                nodeName={node.name}
                approvalConfig={node.approvalConfig}
                onRefreshNodes={onRefreshNodes}
              />
              <Collapse items={[
                {
                  key: '1',
                  label: '子任务',
                  children:
                    <>
                      <Table
                        size='small'
                        pagination={false}
                        columns={[
                          {
                            title: '名称',
                            dataIndex: 'name',
                            key: 'name',
                          },
                          {
                            title: '负责人',
                            dataIndex: 'maintainer',
                            key: 'maintainer',
                            render: (value: string | null | undefined) =>
                              value ? userNameMap.get(String(value)) || value : '-',
                          },
                          {
                            title: '排期',
                            dataIndex: 'schedule',
                            key: 'schedule',
                          },
                          {
                            title: '操作',
                            key: 'actions',
                            width: 160,
                            render: (_: any, record: SubTaskInfo) => (
                              <div className="flex gap-2">
                                <Button size="small" onClick={() => openEditSubTask(record, node.id)}>编辑</Button>
                                <Button size="small" danger onClick={() => handleDeleteSubTask(record, node.id)}>删除</Button>
                              </div>
                            ),
                          }
                        ]}
                        dataSource={subTaskList.map((item) => ({ ...item, key: item.name }))}
                      />
                      <Button type="link" size='large' className='relative -left-2' onClick={() => openCreateSubTask(node.id)}>
                        + 添加子任务
                      </Button>
                    </>
                  ,
                }
              ]}></Collapse>
            </GrayBorderCard>
          </div>
        ),
      };
    });
  }, [
    workflowNodes,
    nodeStatusMap,
    nodeMaintainerMap,
    nodeScheduleMap,
    nodeSavingId,
    statusUpdatingId,
    userOptions,
    userNameMap,
    openCreateSubTask,
    openEditSubTask,
    handleDeleteSubTask,
    updateNodeStatusByNode,
    handleCompleteNodeById,
    handleRollbackNodeById,
  ]);

  return (
    <>
      <div className='py-2 px-4 w-full'>
        <GrayBorderCard>
          <div className='flex justify-between mb-4'>
            <NodeTitleBar
              title={currentNode?.name || '未选择节点'}
              status={currentStatus}
            />
            <div className='flex items-center gap-2'>
              <Button
                className='w-40'
                type='primary'
                disabled={!canComplete}
                loading={statusUpdating && canComplete}
                onClick={handleCompleteNode}
              >
                {mainButtonText}
              </Button>
              <Popover
                placement='bottomRight'
                trigger='click'
                open={rollbackPopoverOpen}
                onOpenChange={setRollbackPopoverOpen}
                content={
                  <Button
                    type='text'
                    danger
                    disabled={!isCompleted || statusUpdating}
                    onClick={handleRollbackNode}
                  >
                    回滚
                  </Button>
                }
              >
                <Button icon={<MoreOutlined />} className='rotate-90' disabled={!isCompleted}></Button>
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
                assignee: (
                  <MemberSelect
                    options={userOptions}
                    value={nodeMaintainerIds}
                    onChange={(next) => {
                      setNodeMaintainerIds(next);
                      updateNodeStatus(next, undefined);
                    }}
                    placeholder="请选择负责人"
                    disabled={!currentNode?.id || nodeSaving}
                  />
                ),
                totalSchedule: (
                  <RangePicker
                    value={parseScheduleRange(nodeSchedule)}
                    onChange={(value) => {
                      const nextSchedule = formatScheduleRange(value);
                      setNodeSchedule(nextSchedule);
                      updateNodeStatus(undefined, nextSchedule);
                    }}
                    disabled={!currentNode?.id || nodeSaving}
                  />
                ),
              },
            ]}></Table>
          </GrayBorderCard>
          <ApprovalInfoPanel
            taskId={taskId}
            nodeId={currentNode?.id}
            nodeName={currentNode?.name}
            approvalConfig={currentNode?.approvalConfig}
            onRefreshNodes={onRefreshNodes}
          />
          <Collapse items={[
            {
              key: '1',
              label: '子任务',
              children:
                <>
                  <Table
                    size='small'
                    pagination={false}
                    loading={subTaskLoading}
                    columns={[
                      {
                        title: '名称',
                        dataIndex: 'name',
                        key: 'name',
                      },
                      {
                        title: '负责人',
                        dataIndex: 'maintainer',
                        key: 'maintainer',
                        render: (value: string | null | undefined) =>
                          value ? userNameMap.get(String(value)) || value : '-',
                      },
                      {
                        title: '排期',
                        dataIndex: 'schedule',
                        key: 'schedule',
                      },
                      {
                        title: '操作',
                        key: 'actions',
                        width: 160,
                        render: (_: any, record: SubTaskInfo) => (
                          <div className="flex gap-2">
                            <Button size="small" onClick={() => openEditSubTask(record)}>编辑</Button>
                            <Button size="small" danger onClick={() => handleDeleteSubTask(record)}>删除</Button>
                          </div>
                        ),
                      }
                    ]}
                    dataSource={subTasks.map((item) => ({ ...item, key: item.name }))}
                  />
                  <Button
                    type="link"
                    size='large'
                    className='relative -left-2'
                    onClick={() => openCreateSubTask(currentNode?.id ?? null)}
                  >
                    + 添加子任务
                  </Button>
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
        {activeTab === 'node-details' && (
          <div className="p-4">
            {nodeDetailItems.length > 0 ? (
              <Collapse items={nodeDetailItems} />
            ) : (
              <div className="text-gray-500">暂无节点</div>
            )}
          </div>
        )}
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
      <Modal
        title={editingSubTask ? '编辑子任务' : '新增子任务'}
        open={subTaskModalOpen}
        onCancel={() => {
          setSubTaskModalOpen(false);
          setEditingSubTask(null);
          setSubTaskNodeId(null);
        }}
        onOk={handleSubmitSubTask}
        okText="保存"
        cancelText="取消"
        destroyOnHidden
      >
        <Form form={subTaskForm} layout="vertical">
          <Form.Item
            label="名称"
            name="name"
            rules={[{ required: true, message: '请输入子任务名称' }]}
          >
            <Input placeholder="请输入子任务名称" />
          </Form.Item>
          <Form.Item label="负责人" name="maintainer">
            <MemberSelect
              options={userOptions}
              placeholder="请选择负责人"
            />
          </Form.Item>
          <Form.Item label="排期" name="schedule">
            <RangePicker />
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
}

export default ProcessBottomInfo;
