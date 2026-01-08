import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Table, Input, Button, Space, Checkbox, Select, Form, Empty, Modal, message, Popconfirm, Tooltip } from 'antd';
import { SearchOutlined, DeleteOutlined, InfoCircleOutlined, HolderOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { apiGetWorkItemRoles, apiCreateWorkItemRole, apiDeleteWorkItemRole, apiUpdateWorkItemRole } from '../api';

interface RoleType {
  id: string;
  wid: string;
  name: string;
  appearance: string;
  allocation: string;
  isSingle: boolean;
  autoJoin: boolean;
}

interface RoleManagementProps {
  workItemId?: string;
}

const RoleManagement: React.FC<RoleManagementProps> = ({ workItemId }) => {
  const [roles, setRoles] = useState<RoleType[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRoleId, setSelectedRoleId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [detailForm] = Form.useForm();

  const selectedRole = roles.find((r) => r.id === selectedRoleId);

  // 当选择的角色改变时，更新详情表单
  useEffect(() => {
    if (selectedRole) {
      detailForm.setFieldsValue({
        name: selectedRole.name,
        appearance: selectedRole.appearance,
        isSingle: selectedRole.isSingle,
      });
    } else {
      detailForm.resetFields();
    }
  }, [selectedRoleId, selectedRole, detailForm]);

  const detailFormValues = Form.useWatch([], detailForm);

  const hasChanged = useMemo(() => {
    if (!selectedRole) return false;
    return (
      detailFormValues?.name !== selectedRole.name ||
      detailFormValues?.appearance !== selectedRole.appearance ||
      detailFormValues?.isSingle !== selectedRole.isSingle
    );
  }, [detailFormValues, selectedRole]);

  const fetchRoles = useCallback(async () => {
    if (!workItemId) return;
    try {
      setLoading(true);
      const data = await apiGetWorkItemRoles(workItemId);
      setRoles(data);
      if (data.length > 0 && !selectedRoleId) {
        setSelectedRoleId(data[0].id);
      }
    } catch (error) {
      console.error('Failed to fetch roles:', error);
      message.error('获取角色列表失败');
    } finally {
      setLoading(false);
    }
  }, [workItemId, selectedRoleId]);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const handleCreate = async () => {
    if (!workItemId) return;
    try {
      const values = await form.validateFields();
      await apiCreateWorkItemRole(workItemId, values);
      message.success('创建成功');
      setIsModalOpen(false);
      form.resetFields();
      fetchRoles();
    } catch (error) {
      console.error('Failed to create role:', error);
      message.error('创建失败');
    }
  };

  const handleDelete = async (roleId: string) => {
    try {
      await apiDeleteWorkItemRole(roleId);
      message.success('删除成功');
      if (selectedRoleId === roleId) {
        setSelectedRoleId(null);
      }
      fetchRoles();
    } catch (error) {
      console.error('Failed to delete role:', error);
      message.error('删除失败');
    }
  };

  const handleUpdate = async () => {
    if (!selectedRoleId) return;
    try {
      const values = await detailForm.validateFields();
      await apiUpdateWorkItemRole(selectedRoleId, values);
      message.success('更新成功');
      fetchRoles();
    } catch (error) {
      console.error('Failed to update role:', error);
      message.error('更新失败');
    }
  };

  const columns: ColumnsType<RoleType> = [
    {
      title: '',
      key: 'sort',
      width: 30,
      render: () => <HolderOutlined style={{ color: '#bfbfbf', cursor: 'grab' }} />,
    },
    {
      title: '角色名称',
      dataIndex: 'name',
      key: 'name',
    },
    {
      title: '角色出现方式',
      dataIndex: 'appearance',
      key: 'appearance',
      render: (text) => (
        <Space className="bg-[#f5f5f5] px-2 py-1 rounded text-xs text-[#595959]">
          {text}
          <SearchOutlined style={{ fontSize: '10px' }} />
        </Space>
      ),
    },
    {
      title: '成员分配方式',
      dataIndex: 'allocation',
      key: 'allocation',
      render: (text) => (
        <Space className="bg-[#f5f5f5] px-2 py-1 rounded text-xs text-[#595959]">
          {text}
          <SearchOutlined style={{ fontSize: '10px' }} />
        </Space>
      ),
    },
    {
      title: '角色id',
      dataIndex: 'id',
      key: 'id',
    },
  ];

  return (
    <div className="flex h-full bg-white rounded-lg border border-[#f0f0f0] overflow-hidden w-full px-6">
      {/* Left Table Section */}
      <div className="flex-1 flex flex-col min-w-0 border-r border-[#f0f0f0]">
        <div className="p-4 flex justify-between items-center gap-4">
          <Input
            placeholder="搜索角色名称或角色id"
            prefix={<SearchOutlined className="text-[#bfbfbf]" />}
            className="max-w-[300px] bg-[#f5f5f5] border-none hover:bg-[#f2f2f2] focus:bg-[#f2f2f2] rounded-lg"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
          <Button type="primary" className="rounded-lg" onClick={() => setIsModalOpen(true)}>新建角色</Button>
        </div>
        <div className="flex-1 overflow-auto">
          <Table
            columns={columns}
            dataSource={roles.filter(r => 
              r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
              r.id.toLowerCase().includes(searchTerm.toLowerCase())
            )}
            rowKey="id"
            pagination={false}
            loading={loading}
            onRow={(record) => ({
              onClick: () => setSelectedRoleId(record.id),
              className: `cursor-pointer ${selectedRoleId === record.id ? 'selected-row' : ''}`,
            })}
            className="role-table"
          />
        </div>
      </div>

      {/* Right Detail Panel */}
      <div className="w-[360px] flex flex-col bg-white">
        {selectedRole ? (
          <>
            <div className="p-4 border-b border-[#f0f0f0] flex justify-between items-center">
              <span className="text-base font-bold text-[#262626]">流程角色</span>
              <Space>
                <Button
                  type="primary"
                  ghost
                  size="small"
                  onClick={handleUpdate}
                  disabled={!hasChanged}
                >
                  保存
                </Button>
                <Popconfirm
                  title="确定要删除该角色吗？"
                  onConfirm={() => handleDelete(selectedRole.id)}
                  okText="确定"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                >
                  <Button type="text" danger icon={<DeleteOutlined />} />
                </Popconfirm>
              </Space>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <Form form={detailForm} layout="vertical">
                {/* 基本信息 */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <div className="w-[3px] h-4 bg-blue-600 rounded-full mr-2" />
                    <span className="text-sm font-bold text-[#262626]">基本信息</span>
                  </div>
                  <Form.Item
                    label={
                      <span>
                        角色名称 <span className="text-red-500">*</span>
                      </span>
                    }
                    name="name"
                    rules={[{ required: true, message: '请输入角色名称' }]}
                  >
                    <Input className="bg-[#f5f5f5] border-none rounded-lg" />
                  </Form.Item>
                  <Form.Item
                    label={
                      <Space size={4}>
                        <span>角色id</span>
                        <span className="text-red-500">*</span>
                        <InfoCircleOutlined className="text-[#bfbfbf]" />
                      </Space>
                    }
                  >
                    <Input
                      value={selectedRole.id}
                      disabled
                      className="bg-[#f5f5f5] border-none rounded-lg"
                    />
                  </Form.Item>
                </div>

                {/* 成员配置 */}
                <div className="mb-8">
                  <div className="flex items-center mb-4">
                    <div className="w-[3px] h-4 bg-blue-600 rounded-full mr-2" />
                    <span className="text-sm font-bold text-[#262626]">成员配置</span>
                  </div>
                  <Form.Item label="角色出现方式" name="appearance">
                    <Select className="w-full">
                      <Select.Option value="默认出现">默认出现</Select.Option>
                      <Select.Option value="自行添加">自行添加</Select.Option>
                    </Select>
                  </Form.Item>
                  <div className="flex flex-col gap-4">
                    <Form.Item name="isSingle" valuePropName="checked">
                      <Checkbox>限制为单人</Checkbox>
                    </Form.Item>
                  </div>
                </div>
              </Form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <Empty description="请选择一个角色查看详情" />
          </div>
        )}
      </div>

      <Modal
        title="新建角色"
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsModalOpen(false)}
        okText="确定"
        cancelText="取消"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="角色名称"
            name="name"
            rules={[{ required: true, message: '请输入角色名称' }]}
          >
            <Input placeholder="请输入角色名称" />
          </Form.Item>
          <Form.Item
            label={
              <Space size={4}>
                <span>角色id</span>
                <Tooltip title="系统唯一标识">
                  <QuestionCircleOutlined className="text-[#bfbfbf]" />
                </Tooltip>
              </Space>
            }
            name="id"
            rules={[{ required: true, message: '请输入角色id' }]}
          >
            <Input placeholder="请输入角色id" />
          </Form.Item>
          <Form.Item label="角色出现方式" name="appearance" initialValue="默认出现">
            <Select>
              <Select.Option value="默认出现">默认出现</Select.Option>
              <Select.Option value="自行添加">自行添加</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item name="isSingle" valuePropName="checked" initialValue={false}>
            <Checkbox>限制为单人</Checkbox>
          </Form.Item>
        </Form>
      </Modal>

      <style>{`
        .role-table .ant-table-thead > tr > th {
          background: transparent;
          border-bottom: 1px solid #f0f0f0;
          color: #8c8c8c;
          font-weight: normal;
          font-size: 13px;
        }
        .role-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f0f0f0;
          padding: 12px 16px;
          transition: all 0.2s;
        }
        /* 选中行样式 */
        .role-table .ant-table-tbody > tr.selected-row > td {
          background-color: #f0f7ff !important;
          border-top: 1px solid #1677ff !important;
          border-bottom: 1px solid #1677ff !important;
        }
        .role-table .ant-table-tbody > tr.selected-row > td:first-child {
          border-left: 1px solid #1677ff !important;
          border-top-left-radius: 4px;
          border-bottom-left-radius: 4px;
        }
        .role-table .ant-table-tbody > tr.selected-row > td:last-child {
          border-right: 1px solid #1677ff !important;
          border-top-right-radius: 4px;
          border-bottom-right-radius: 4px;
        }
        /* 保持选中行在悬浮时背景不变 */
        .role-table .ant-table-tbody > tr.selected-row:hover > td {
          background-color: #f0f7ff !important;
        }
        /* 非选中行悬浮样式 */
        .role-table .ant-table-tbody > tr:not(.selected-row):hover > td {
          background-color: #fafafa;
        }
      `}</style>
    </div>
  );
};

export default RoleManagement;

