import React, { useState, useCallback, useEffect } from 'react';
import type { MenuProps } from 'antd';
import { Button, Space, Skeleton, Empty, Modal, Form, Input, message, Dropdown } from 'antd';
import { EllipsisOutlined, PlusOutlined } from '@ant-design/icons';
import { apiGetWorkflowTypes, apiCreateWorkflowType, apiUpdateWorkflowType, apiDeleteWorkflowType, type WorkflowType } from '../../api';
import WorkflowDetail from './WorkflowDetail';

interface WorkflowManagementProps {
  workItemId?: string;
}

const WorkflowManagement: React.FC<WorkflowManagementProps> = ({ workItemId }) => {
  const [workflows, setWorkflows] = useState<WorkflowType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkflow, setEditingWorkflow] = useState<WorkflowType | null>(null);
  const [selectedWorkflow, setSelectedWorkflow] = useState<WorkflowType | null>(null);
  const [form] = Form.useForm();

  const fetchWorkflows = useCallback(async () => {
    if (!workItemId) return;
    try {
      setLoading(true);
      const data = await apiGetWorkflowTypes(workItemId);
      setWorkflows(data);
      // If a workflow is selected, update its data from the fresh list
      if (selectedWorkflow) {
        const updated = data.find(w => w.id === selectedWorkflow.id);
        if (updated) {
          setSelectedWorkflow(updated);
        } else {
          setSelectedWorkflow(null);
        }
      }
    } catch (error: unknown) {
      console.error('Failed to fetch workflows:', error);
      message.error('获取流程列表失败');
    } finally {
      setLoading(false);
    }
  }, [workItemId, selectedWorkflow?.id]);

  useEffect(() => {
    fetchWorkflows();
  }, [workItemId]); // Only re-fetch when workItemId changes, otherwise manual refresh is handled by handle functions

  const handleCreateOrUpdate = async () => {
    if (!workItemId) return;
    try {
      const values = await form.validateFields() as { name: string };
      setLoading(true);
      if (editingWorkflow) {
        await apiUpdateWorkflowType(editingWorkflow.id, { name: values.name });
        message.success('更新成功');
      } else {
        await apiCreateWorkflowType({ wid: workItemId, name: values.name });
        message.success('创建成功');
      }
      setIsModalOpen(false);
      setEditingWorkflow(null);
      form.resetFields();
      fetchWorkflows();
    } catch (error: unknown) {
      console.error('Operation failed:', error);
      message.error('操作失败');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setLoading(true);
      await apiDeleteWorkflowType(id);
      message.success('删除成功');
      if (selectedWorkflow?.id === id) {
        setSelectedWorkflow(null);
      }
      fetchWorkflows();
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('删除失败');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleDetailUpdate = async (id: number, values: { name: string }) => {
    try {
      await apiUpdateWorkflowType(id, values);
      await fetchWorkflows();
    } catch (error) {
      console.error('Update failed:', error);
      message.error('更新失败');
      throw error;
    }
  };

  const getMenuItems = (workflow: WorkflowType): MenuProps['items'] => [
    {
      key: 'edit',
      label: '修改名称',
      onClick: (e) => {
        e.domEvent.stopPropagation();
        setEditingWorkflow(workflow);
        form.setFieldsValue({ name: workflow.name });
        setIsModalOpen(true);
      },
    },
    {
      key: 'delete',
      label: '删除流程',
      danger: true,
      onClick: (e) => {
        e.domEvent.stopPropagation();
        Modal.confirm({
          title: '确定要删除该流程吗？',
          content: '删除后将无法恢复',
          okText: '确定',
          okType: 'danger',
          cancelText: '取消',
          onOk: () => handleDelete(workflow.id),
        });
      },
    }
  ];

  if (selectedWorkflow) {
    return (
      <WorkflowDetail 
        workflow={selectedWorkflow} 
        onBack={() => setSelectedWorkflow(null)}
        onUpdate={handleDetailUpdate}
        onDelete={handleDelete}
      />
    );
  }

  return (
    <div className="w-full h-full bg-[#fcfcfc] p-6 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="w-1 h-4 bg-blue-600 rounded-full" />
          <span className="text-base font-bold text-[#262626]">流程</span>
        </div>
        <Button 
          type="primary" 
          icon={<PlusOutlined />}
          onClick={() => {
            setEditingWorkflow(null);
            form.resetFields();
            setIsModalOpen(true);
          }}
          className="bg-[#2f54eb] rounded-lg"
        >
          新建流程
        </Button>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <Skeleton.Button key={i} active className="w-full h-[200px] rounded-xl" />
          ))}
        </div>
      ) : workflows.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 overflow-y-auto">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              onClick={() => setSelectedWorkflow(workflow)}
              className="bg-white border border-[#f0f0f0] rounded-xl overflow-hidden hover:shadow-md transition-all group flex flex-col cursor-pointer"
            >
              {/* Workflow Diagram Placeholder */}
              <div className="h-[140px] bg-[#fcfcfc] border-b border-[#f0f0f0] flex items-center justify-center">
                <div className="text-[#bfbfbf] text-xs">流程图暂未生成</div>
              </div>
              
              <div className="p-3 flex justify-between items-center">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-4 h-4 rounded-sm border border-[#d9d9d9] flex-shrink-0 flex items-center justify-center">
                    <div className="w-1.5 h-1.5 bg-[#d9d9d9] rounded-full" />
                  </div>
                  <span className="text-sm font-medium text-[#262626] truncate">{workflow.name}</span>
                  <span className="text-xs text-[#bfbfbf] flex-shrink-0">v1</span>
                </div>
                <Dropdown menu={{ items: getMenuItems(workflow) }} trigger={['click']} placement="bottomRight">
                  <Button 
                    type="text" 
                    icon={<EllipsisOutlined />} 
                    className="text-[#bfbfbf] hover:text-[#262626]" 
                    onClick={(e) => e.stopPropagation()}
                  />
                </Dropdown>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center">
          <Empty description="暂无流程，创建一个试试？" />
        </div>
      )}

      <Modal
        title={editingWorkflow ? '修改流程名称' : '新建流程'}
        open={isModalOpen}
        onOk={handleCreateOrUpdate}
        onCancel={() => {
          setIsModalOpen(false);
          setEditingWorkflow(null);
          form.resetFields();
        }}
        okText="确定"
        cancelText="取消"
        width={400}
        okButtonProps={{ className: 'bg-[#2f54eb]' }}
      >
        <Form
          form={form}
          layout="vertical"
          className="mt-4"
        >
          <Form.Item
            label="流程名称"
            name="name"
            rules={[{ required: true, message: '请输入流程名称' }]}
          >
            <Input 
              placeholder="请输入流程名称" 
              className="h-10 rounded-lg bg-[#f5f5f5] border-none hover:bg-[#f2f2f2] focus:bg-[#f2f2f2]"
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default WorkflowManagement;
