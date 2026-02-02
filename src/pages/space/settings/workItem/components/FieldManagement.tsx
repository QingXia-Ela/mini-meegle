import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Table, Input, Button, Space, Tag, Form, Modal, Popover, Select, message, Dropdown } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { MenuProps } from 'antd';
import { useLocation, useNavigate } from 'react-router';
import {
  SearchOutlined,
  QuestionCircleOutlined,
  PlusOutlined,
  HolderOutlined,
  CaretDownOutlined,
  CloseCircleFilled,
  DeleteOutlined,
} from '@ant-design/icons';
import MemberSelect from '@/components/MemberSelect';
import { apiGetWorkItemFields, apiCreateWorkItemField, apiUpdateWorkItemField, apiDeleteWorkItemField, type WorkItemField } from '../api';
import { SystemFieldId } from '@/constants/field';
import { generateId } from '@/utils/generateId';

interface Option {
  id: string;
  label: string;
  color: string; // 背景颜色
}

const LIGHT_COLORS = ['#fff1f0', '#fff2e8', '#fff7e6', '#fffbe6', '#feffe6', '#fcffe6', '#f6ffed', '#e6fffb', '#e6f7ff', '#f0f5ff', '#f9f0ff', '#fff0f6', '#fafafa'];
const DARK_COLORS = ['#ff4d4f', '#ff7a45', '#ffa940', '#ffc53d', '#ffec3d', '#bae637', '#73d13d', '#36cfc9', '#40a9ff', '#597ef7', '#9254de', '#f759ab', '#8c8c8c'];

const FULL_COLOR_PALETTE = [
  LIGHT_COLORS,
  DARK_COLORS,
];

const getTextColor = (bgColor: string) => {
  if (DARK_COLORS.includes(bgColor)) return '#ffffff';
  return '#262626';
};

interface Member {
  id: string;
  name: string;
  avatar?: string;
  color?: string;
}

const MOCK_MEMBERS: Member[] = [
  { id: '1', name: 'spark xiao', color: '#8d6e63' },
  { id: '2', name: '张三', color: '#1677ff' },
  { id: '3', name: '李四', color: '#52c41a' },
  { id: '4', name: '王五', color: '#fa8c16' },
  { id: '5', name: '赵六', color: '#eb2f96' },
];
const FIELD_TYPES = [
  { label: '单选', value: 'select', color: '#52c41a' },
  { label: '多选', value: 'multiSelect', color: '#13c2c2' },
  { label: '日期', value: 'date', color: '#1890ff' },
  { label: '日期区间', value: 'dateRange', color: '#eb2f96' },
  { label: '单行文本', value: 'text', color: '#722ed1' },
  { label: '多行文本', value: 'textarea', color: '#eb2f96' },
  { label: '单选人员', value: 'member', color: '#fa8c16' },
  { label: '多选人员', value: 'multiMember', color: '#f5222d' },
  { label: '数字', value: 'number', color: '#faad14' },
  { label: '开关', value: 'switch', color: '#1677ff' },
];

const generateFieldId = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `field_${result}`;
};

interface CreateFieldValues {
  name: string;
  type: string;
  id: string;
}

interface FieldManagementProps {
  workItemId?: string;
}

const FieldManagement: React.FC<FieldManagementProps> = ({ workItemId }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [data, setData] = useState<WorkItemField[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const selectedField = useMemo(() => data.find(f => f.id === selectedFieldId), [data, selectedFieldId]);

  // 新建字段相关状态
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createForm] = Form.useForm();
  const [detailForm] = Form.useForm();

  const fetchFields = useCallback(async () => {
    if (!workItemId) return;
    try {
      setLoading(true);
      const fields: WorkItemField[] = await apiGetWorkItemFields(workItemId);
      setData(fields);
      if (fields.length > 0 && !selectedFieldId) {
        setSelectedFieldId(fields[0].id);
      }
    } catch (error: unknown) {
      console.error('Failed to fetch fields:', error);
    } finally {
      setLoading(false);
    }
  }, [workItemId, selectedFieldId]);

  useEffect(() => {
    fetchFields();
  }, [fetchFields]);

  // 更新详情表单内容
  useEffect(() => {
    if (selectedField) {
      detailForm.setFieldsValue({
        name: selectedField.name,
      });
    } else {
      detailForm.resetFields();
    }
  }, [selectedField, detailForm]);

  const handleOpenCreateModal = useCallback(() => {
    setIsCreateModalOpen(true);
    createForm.setFieldsValue({
      id: generateFieldId(),
      type: 'text',
    });
  }, [createForm]);

  const handleCreateField = async () => {
    if (!workItemId) return;
    try {
      const values = await createForm.validateFields() as CreateFieldValues;
      await apiCreateWorkItemField(workItemId, {
        id: values.id,
        name: values.name,
        type: values.type,
      });
      setIsCreateModalOpen(false);
      createForm.resetFields();
      message.success('创建成功');
      fetchFields();
    } catch (error: unknown) {
      console.error('Validation failed:', error);
    }
  };

  const handleDeleteField = useCallback(async (field: WorkItemField) => {
    if (!workItemId) return;
    Modal.confirm({
      title: '确认删除字段',
      content: `确定要删除字段 "${field.name}" 吗？删除后将无法恢复。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await apiDeleteWorkItemField(workItemId, field.id);
          message.success('删除成功');
          if (selectedFieldId === field.id) {
            setSelectedFieldId(null);
          }
          fetchFields();
        } catch (error: unknown) {
          console.error('Delete failed:', error);
        }
      },
    });
  }, [workItemId, selectedFieldId, fetchFields]);

  const handleUpdateFieldName = async () => {
    if (!workItemId || !selectedFieldId) return;
    try {
      const values = await detailForm.validateFields() as { name: string };
      // 只有在名称发生变化时才调用 API
      if (values.name === selectedField?.name) return;

      await apiUpdateWorkItemField(workItemId, selectedFieldId, {
        name: values.name,
      });
      message.success('保存成功');
      fetchFields();
    } catch (error: unknown) {
      console.error('Update failed:', error);
    }
  };

  const actionMenuItems: MenuProps['items'] = useMemo(() => {
    if (selectedField?.systemType === 'system') return [];
    return [
      {
        key: 'delete',
        label: '删除字段',
        icon: <DeleteOutlined />,
        danger: true,
        onClick: () => selectedField && handleDeleteField(selectedField),
      },
    ];
  }, [selectedField, handleDeleteField]);

  // 选项配置相关状态
  const [isOptionModalOpen, setIsOptionModalOpen] = useState(false);
  const [optionSearchText, setOptionSearchText] = useState('');
  const [editingOptionId, setEditingOptionId] = useState<string | null>(null);
  const [tempOptions, setTempOptions] = useState<Option[]>([]);

  const currentOptions = useMemo((): Option[] => {
    if (isOptionModalOpen) return tempOptions;
    if (!selectedField) return [];
    return selectedField.jsonConfig?.options || [];
  }, [isOptionModalOpen, tempOptions, selectedField]);

  useEffect(() => {
    if (isOptionModalOpen && selectedField) {
      const options = selectedField.jsonConfig?.options || [];
      setTempOptions([...options]);
    }
  }, [isOptionModalOpen, selectedField]);

  const filteredOptions = useMemo(() => {
    return currentOptions.filter((opt: Option) =>
      opt.label.toLowerCase().includes(optionSearchText.toLowerCase())
    );
  }, [currentOptions, optionSearchText]);

  const handleAddOption = () => {
    const newId = generateId();
    const newOption: Option = {
      id: newId,
      label: '新选项',
      color: '#f5f5f5',
    };
    setTempOptions(prev => [...prev, newOption]);
    setEditingOptionId(newId);
  };

  const handleUpdateOption = (id: string, updates: Partial<Option>) => {
    setTempOptions(prev => prev.map(opt =>
      opt.id === id ? { ...opt, ...updates } : opt
    ));
  };

  const handleDeleteOption = (id: string) => {
    setTempOptions(prev => prev.filter(opt => opt.id !== id));
  };

  const handleSaveOptions = async () => {
    if (!workItemId || !selectedField) return;
    try {
      const newConfig = {
        ...(selectedField.jsonConfig || {}),
        options: tempOptions,
      };
      await apiUpdateWorkItemField(workItemId, selectedField.id, {
        config: JSON.stringify(newConfig),
      });
      message.success('选项保存成功');
      setIsOptionModalOpen(false);
      fetchFields();
    } catch (error: unknown) {
      console.error('Failed to save options:', error);
    }
  };

  const columns: ColumnsType<WorkItemField> = [
    {
      title: '字段名称',
      dataIndex: 'name',
      key: 'name',
      width: '25%',
    },
    {
      title: '字段类型',
      dataIndex: 'type',
      key: 'type',
      width: '20%',
      render: (type: string) => {
        const fieldType = FIELD_TYPES.find(t => t.value === type);
        return (
          <Tag color={fieldType?.color} className="rounded-sm border-none bg-opacity-10" style={{ backgroundColor: `${fieldType?.color}15`, color: fieldType?.color }}>
            {fieldType?.label || type}
          </Tag>
        );
      },
    },
    {
      title: '默认值',
      key: 'defaultValue',
      width: '25%',
      render: () => '-', // TODO: Implement default value
    },
    {
      title: '对接标识',
      dataIndex: 'id',
      key: 'id',
      width: '20%',
      render: (text) => (
        <Space size={4}>
          <span>{text}</span>
        </Space>
      ),
    },
  ];

  const filteredData = data.filter(item =>
    item.name.toLowerCase().includes(searchText.toLowerCase()) ||
    item.id.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div className="flex h-full w-full bg-white rounded-lg border border-[#f0f0f0] overflow-hidden px-6">
      {/* Left Table Section */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[#f0f0f0]">
        <div className="p-4 flex justify-end items-center gap-4">
          <Input
            placeholder="搜索字段名称、对接标识和ID"
            prefix={<SearchOutlined className="text-[#bfbfbf]" />}
            className="w-64 h-9 bg-[#f5f5f5] border-none hover:bg-[#f0f0f0] focus:bg-[#f0f0f0] rounded-lg"
            value={searchText}
            onChange={e => setSearchText(e.target.value)}
          />
          <Button type="primary" className="h-9 rounded-lg bg-[#2f54eb]" onClick={handleOpenCreateModal}>
            新建字段
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={false}
            rowKey="id"
            size="middle"
            loading={loading}
            onRow={(record) => ({
              onClick: () => setSelectedFieldId(record.id),
              className: `cursor-pointer transition-colors ${selectedFieldId === record.id ? 'selected-row' : 'hover:bg-[#fafafa]'}`,
            })}
            className="field-table"
          />
        </div>
      </div>

      {/* Right Sidebar Section */}
      <div className="w-[360px] flex flex-col bg-white">
        {selectedField ? (
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-[#f0f0f0]">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold text-[#262626]">{selectedField.name}</span>
                  {selectedField.systemType === 'system' && (
                    <span className="text-xs text-[#8c8c8c] bg-[#f5f5f5] px-1.5 py-0.5 rounded">系统字段</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {selectedField.systemType === 'custom' && (
                    <Dropdown menu={{ items: actionMenuItems }} placement="bottomRight" trigger={['click']}>
                      <Button type="text" icon={<span className="text-xl font-bold">...</span>} />
                    </Dropdown>
                  )}
                </div>
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex">
                  <span className="text-[#8c8c8c] w-20">字段类型:</span>
                  <span className="text-[#262626]">{FIELD_TYPES.find(t => t.value === selectedField.type)?.label}</span>
                  <QuestionCircleOutlined className="ml-1 text-[#bfbfbf] text-xs self-center" />
                </div>
                <div className="flex">
                  <span className="text-[#8c8c8c] w-20">字段ID:</span>
                  <span className="text-[#262626]">{selectedField.id}</span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">
              {/* 基础信息配置 */}
              <section>
                <div className="flex items-center gap-2 mb-6">
                  <div className="w-[3px] h-4 bg-blue-600 rounded-full" />
                  <span className="text-sm font-bold text-[#262626]">基础信息配置</span>
                </div>
                <Form layout="vertical" form={detailForm}>
                  <Form.Item
                    label={<span className="text-[#595959] text-xs">字段名称 <span className="text-[#ff4d4f]">*</span></span>}
                    name="name"
                    className="mb-6"
                    rules={[{ required: true, message: '请输入字段名称' }]}
                  >
                    <Input
                      onBlur={handleUpdateFieldName}
                      onPressEnter={handleUpdateFieldName}
                      className="bg-[#f5f5f5] border-none h-10 rounded-lg hover:bg-[#f0f0f0] focus:bg-[#f0f0f0]"
                    />
                  </Form.Item>

                  {(selectedField.type === 'member' || selectedField.type === 'multiMember') && (
                    <Form.Item
                      label={
                        <Space size={4}>
                          <span className="text-[#595959] text-xs">默认值</span>
                          <QuestionCircleOutlined className="text-[#bfbfbf] text-xs" />
                        </Space>
                      }
                    >
                      <MemberSelect
                        options={MOCK_MEMBERS}
                        value={selectedMembers}
                        onChange={setSelectedMembers}
                        placeholder="请选择成员"
                        onSearchContentChange={(val) => console.log('Searching:', val)}
                      />
                    </Form.Item>
                  )}
                </Form>
              </section>

              {/* 配置选项 */}
              {(selectedField.type === 'select' || selectedField.type === 'multiSelect') && (
                <div className="space-y-4">
                  <div>
                    <div className="text-xs text-[#8c8c8c] mb-2 flex items-center">
                      配置选项
                    </div>
                    {selectedField.id === SystemFieldId.WORKFLOW_TYPE ? (
                      <Button
                        block
                        className="h-10 text-[#2f54eb] border-[#d9d9d9] rounded-lg text-sm"
                        onClick={() => {
                          const searchParams = new URLSearchParams(location.search);
                          searchParams.set('menuTab', 'flow');
                          navigate({ search: searchParams.toString() }, { replace: true });
                        }}
                      >
                        前往流程管理
                      </Button>
                    ) : (
                      <Button
                        block
                        className="h-10 text-[#2f54eb] border-[#d9d9d9] rounded-lg text-sm"
                        onClick={() => setIsOptionModalOpen(true)}
                      >
                        查看选项（{(selectedField.jsonConfig?.options || []).length} 个选项）
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-400">
            请选择一个字段查看详情
          </div>
        )}
      </div>
      <style>{`
        .field-table .ant-table-thead > tr > th {
          background: white !important;
          color: #8c8c8c;
          font-weight: normal;
          border-bottom: 1px solid #f0f0f0;
          font-size: 13px;
        }
        .field-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f0f0f0;
          padding: 12px 16px !important;
          font-size: 14px;
        }
        .field-table .ant-table-tbody > tr.selected-row > td {
          background-color: #f0f5ff !important;
        }
        .field-table .ant-table-tbody > tr.selected-row:hover > td {
          background-color: #f0f5ff !important;
        }
        
        .option-item:hover .option-actions {
          display: flex;
        }
        .option-actions {
          display: none;
        }
        .color-block {
          width: 20px;
          height: 20px;
          border-radius: 4px;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .color-block:hover {
          transform: scale(1.1);
        }
        .color-block.active {
          box-shadow: 0 0 0 2px #2f54eb;
        }
      `}</style>

      {/* 选项配置弹窗 */}
      <Modal
        title={<span className="text-lg font-bold">选项配置</span>}
        open={isOptionModalOpen}
        onCancel={() => setIsOptionModalOpen(false)}
        footer={null}
        width={560}
        className="option-config-modal"
      >
        {/* ... existing code ... */}
        <div className="pt-4">
          <div className="text-sm text-[#262626] font-medium mb-4">选项值</div>
          <Input
            placeholder="搜索选项名称"
            prefix={<SearchOutlined className="text-[#bfbfbf]" />}
            className="bg-[#f5f5f5] border-none rounded-lg h-10 mb-6"
            value={optionSearchText}
            onChange={e => setOptionSearchText(e.target.value)}
          />

          <div className="space-y-3 mb-6 max-h-[400px] overflow-y-auto pr-1">
            {filteredOptions.map((opt: Option) => (
              <div
                key={opt.id}
                className="option-item flex items-center group bg-white rounded-lg p-1 transition-colors hover:bg-[#fafafa]"
              >
                <HolderOutlined className="text-[#bfbfbf] cursor-grab mr-3 ml-2 flex-shrink-0" />

                {editingOptionId === opt.id ? (
                  <Input
                    autoFocus
                    value={opt.label}
                    onChange={(e) => handleUpdateOption(opt.id, { label: e.target.value })}
                    onBlur={() => setEditingOptionId(null)}
                    onPressEnter={() => setEditingOptionId(null)}
                    className="h-8 rounded text-sm px-3 border-blue-500 shadow-none"
                    style={{
                      backgroundColor: opt.color,
                      color: getTextColor(opt.color),
                      width: 'auto',
                      minWidth: '120px',
                      maxWidth: '360px'
                    }}
                  />
                ) : (
                  <div
                    className="px-3 py-1 rounded text-sm min-w-[120px] max-w-[360px] truncate cursor-pointer select-none"
                    style={{ backgroundColor: opt.color, color: getTextColor(opt.color) }}
                    onClick={() => setEditingOptionId(opt.id)}
                  >
                    {opt.label}
                  </div>
                )}

                <div className="option-actions items-center ml-auto mr-2 gap-4">
                  <Popover
                    trigger="click"
                    placement="bottomRight"
                    content={
                      <div className="p-1">
                        {FULL_COLOR_PALETTE.map((row: string[], rowIndex: number) => (
                          <div key={rowIndex === 0 ? 'bg-row' : 'text-row'} className="flex gap-1 mb-1 last:mb-0">
                            {row.map((color: string) => (
                              <div
                                key={color}
                                className={`color-block ${opt.color === color ? 'active' : ''}`}
                                style={{ backgroundColor: color, border: rowIndex === 0 ? '1px solid #f0f0f0' : 'none' }}
                                onClick={() => handleUpdateOption(opt.id, { color })}
                              />
                            ))}
                          </div>
                        ))}
                      </div>
                    }
                  >
                    <div className="w-6 h-6 flex items-center justify-center rounded-full bg-[#fde3f0] hover:bg-[#f9cbe0] cursor-pointer transition-colors">
                      <CaretDownOutlined className="text-[10px] text-[#262626]" />
                    </div>
                  </Popover>

                  <CloseCircleFilled
                    className="text-[#bfbfbf] cursor-pointer hover:text-[#ff4d4f] text-lg"
                    onClick={() => handleDeleteOption(opt.id)}
                  />
                </div>
              </div>
            ))}
          </div>

          <Button
            type="link"
            icon={<PlusOutlined />}
            className="flex items-center text-[#2f54eb] font-medium p-0 h-auto hover:text-[#1d39c4]"
            onClick={handleAddOption}
          >
            添加选项
          </Button>

          <div className="flex justify-end gap-3 mt-8">
            <Button className="rounded-lg px-6 h-9" onClick={() => setIsOptionModalOpen(false)}>取消</Button>
            <Button type="primary" className="rounded-lg px-6 h-9 bg-[#2f54eb]" onClick={handleSaveOptions}>确认</Button>
          </div>
        </div>
      </Modal>

      {/* 新建字段弹窗 */}
      <Modal
        title={<span className="text-lg font-bold">新建字段</span>}
        open={isCreateModalOpen}
        onCancel={() => {
          setIsCreateModalOpen(false);
          createForm.resetFields();
        }}
        onOk={handleCreateField}
        okText="确定"
        cancelText="取消"
        width={480}
        okButtonProps={{ className: 'bg-[#2f54eb] rounded-lg border-none h-9' }}
        cancelButtonProps={{ className: 'rounded-lg h-9' }}
      >
        <Form
          form={createForm}
          layout="vertical"
          className="pt-4"
          initialValues={{ type: 'text' }}
        >
          <Form.Item
            name="name"
            label={<span className="text-[#595959] text-xs font-medium">字段名称</span>}
            rules={[{ required: true, message: '请输入字段名称' }]}
          >
            <Input placeholder="请输入字段名称" className="h-10 rounded-lg bg-[#f5f5f5] border-none hover:bg-[#f0f0f0] focus:bg-[#f0f0f0]" />
          </Form.Item>
          <Form.Item
            name="type"
            label={<span className="text-[#595959] text-xs font-medium">字段类型</span>}
            rules={[{ required: true, message: '请选择字段类型' }]}
          >
            <Select
              className="h-10 w-full rounded-lg"
              placeholder="请选择字段类型"
              variant="borderless"
              style={{ backgroundColor: '#f5f5f5' }}
            >
              {FIELD_TYPES.map(type => (
                <Select.Option key={type.value} value={type.value}>
                  <Space>
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: type.color }} />
                    {type.label}
                  </Space>
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            name="id"
            label={
              <Space>
                <span className="text-[#595959] text-xs font-medium">字段 ID</span>
                <Popover content="ID 是字段在系统中的唯一标识，创建后不可修改">
                  <QuestionCircleOutlined className="text-[#bfbfbf] text-xs" />
                </Popover>
              </Space>
            }
            rules={[
              { required: true, message: '请输入字段 ID' },
              { pattern: /^[a-zA-Z0-9]{4,16}$/, message: 'ID 格式需为 4-16 位字母或数字' }
            ]}
          >
            <Input placeholder="请输入字段 ID" className="h-10 rounded-lg bg-[#f5f5f5] border-none hover:bg-[#f0f0f0] focus:bg-[#f0f0f0]" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FieldManagement;
