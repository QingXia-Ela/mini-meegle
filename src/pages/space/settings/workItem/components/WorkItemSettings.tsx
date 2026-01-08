import { BookFilled, CheckCircleFilled, EllipsisOutlined, ExclamationCircleFilled, RocketFilled, UserOutlined, QuestionCircleOutlined, CheckOutlined } from '@ant-design/icons';
import { Button, Space, Skeleton, Empty, Modal, Form, Input, Tooltip, message } from 'antd';
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router';
import { apiGetWorkItemsBySpaceId, apiCreateWorkItem, apiUpdateWorkItem, apiDeleteWorkItem } from '../api';
import { WORK_ITEM_ICONS, WORK_ITEM_COLORS } from '../constants/icons';
import WorkItemDetailSetting from './WorkItemDetailSetting';

interface WorkItemType {
  id: string;
  name: string;
  icon?: string;
  description?: string;
  color?: string;
}

const WorkItemSettings = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [workItems, setWorkItems] = useState<WorkItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingWorkItem, setEditingWorkItem] = useState<WorkItemType | null>(null);
  const [form] = Form.useForm();
  const [selectedColor, setSelectedColor] = useState(WORK_ITEM_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(WORK_ITEM_ICONS[0].key);

  const generateRandomId = useCallback(() => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 10; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }, []);

  const fetchWorkItems = useCallback(async () => {
    if (!spaceId) return;
    try {
      setLoading(true);
      const data = await apiGetWorkItemsBySpaceId(spaceId);
      setWorkItems(data);
    } catch (error: unknown) {
      console.error('Failed to fetch work items:', error);
    } finally {
      setLoading(false);
    }
  }, [spaceId]);

  useEffect(() => {
    fetchWorkItems();
  }, [fetchWorkItems]);

  const handleCreate = async () => {
    try {
      const values = (await form.validateFields()) as {
        name: string;
        identifier: string;
        description?: string;
      };
      
      setLoading(true);
      await apiCreateWorkItem({
        id: values.identifier,
        sid: spaceId!,
        name: values.name,
        description: values.description,
        icon: selectedIcon,
        color: selectedColor,
      });

      message.success('创建成功');
      setIsModalOpen(false);
      form.resetFields();
      fetchWorkItems();
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'message' in error) {
        message.error(String(error.message));
      } else {
        console.error('Validation or API failed:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateWorkItem = async (values: Partial<WorkItemType>) => {
    if (!editingWorkItem) return;
    try {
      await apiUpdateWorkItem(editingWorkItem.id, values);
      fetchWorkItems();
      setEditingWorkItem(null);
    } catch (error) {
      console.error('Update failed:', error);
      message.error('保存失败');
    }
  };

  const handleDeleteWorkItem = async (id: string) => {
    try {
      await apiDeleteWorkItem(id);
      message.success('删除成功');
      fetchWorkItems();
      setEditingWorkItem(null);
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('删除失败');
    }
  };

  const getIconConfig = (item: WorkItemType) => {
    // 如果数据库有保存 icon 和 color，优先使用
    const iconObj = WORK_ITEM_ICONS.find(i => i.key === item.icon);
    if (iconObj && item.color) {
      return { icon: iconObj.icon, color: item.color };
    }

    // 兜底逻辑：根据名称映射
    const configs: Record<string, { icon: React.ReactNode; color: string }> = {
      '需求': { icon: <CheckCircleFilled style={{ fontSize: '16px' }} />, color: '#1677ff' },
      '缺陷': { icon: <ExclamationCircleFilled style={{ fontSize: '16px' }} />, color: '#ff4d4f' },
      '任务': { icon: <CheckCircleFilled style={{ fontSize: '16px' }} />, color: '#40a9ff' },
      '客户原声': { icon: <UserOutlined style={{ fontSize: '16px' }} />, color: '#9254de' },
      'Onboarding': { icon: <RocketFilled style={{ fontSize: '16px' }} />, color: '#a0d911' },
      'Project': { icon: <BookFilled style={{ fontSize: '16px' }} />, color: '#722ed1' },
    };

    return configs[item.name] || { icon: <CheckCircleFilled style={{ fontSize: '16px' }} />, color: '#1677ff' };
  };

  return (
    <div className="w-full px-12">
      <div className="flex justify-between items-center mb-8">
        <div className="text-xl text-[#262626] font-bold">工作项管理</div>
        <Space>
          <Button 
            className="border-[#d9d9d9] text-[#262626]"
            onClick={() => {
              setIsModalOpen(true);
              form.setFieldValue('identifier', generateRandomId());
            }}
          >
            新建工作项类型
          </Button>
        </Space>
      </div>

      <div className="text-sm text-[#8c8c8c] mb-6">工作项类型</div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Skeleton key={i} active avatar paragraph={{ rows: 2 }} className="bg-white p-5 border border-[#f0f0f0] rounded-lg" />
          ))}
        </div>
      ) : workItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {workItems.map((item) => {
            const config = getIconConfig(item);
            return (
              <div
                key={item.id}
                className="group relative bg-white border border-[#f0f0f0] rounded-lg p-5 hover:shadow-md transition-all cursor-pointer min-h-[140px]"
                onClick={() => setEditingWorkItem(item)}
              >
                <div className="flex justify-between items-start mb-4">
                  <div
                    className="w-8 h-8 rounded flex items-center justify-center text-white"
                    style={{ backgroundColor: config.color }}
                  >
                    {config.icon}
                  </div>
                  <EllipsisOutlined className="text-[#bfbfbf] hover:text-[#262626] transition-colors" />
                </div>
                <div>
                  <div className="text-base font-medium text-[#262626] mb-1">{item.name}</div>
                  <div className="text-sm text-[#8c8c8c] leading-relaxed">
                    {/* 假设目前没有描述字段，预留 */}
                    {item.description || <span className="invisible">.</span>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty description="暂无工作项类型，尝试新建一个？" />
      )}

      <Modal
        title={<span className="text-lg font-bold">新建工作项类型</span>}
        open={isModalOpen}
        onOk={handleCreate}
        onCancel={() => setIsModalOpen(false)}
        width={640}
        okText="确定"
        cancelText="取消"
        className="top-10"
        styles={{
          body: {
            maxHeight: 'calc(100vh - 250px)',
            overflowY: 'auto',
            paddingRight: '8px',
          }
        }}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ mode: 'node' }}
          className="mt-6"
        >
          <Form.Item
            label={<span className="font-medium">名称</span>}
            name="name"
            rules={[{ required: true, message: '请输入名称' }]}
          >
            <Input 
              placeholder="请输入名称" 
              className="h-10 bg-[#f5f5f5] border-none hover:bg-[#f2f2f2] focus:bg-[#f2f2f2] rounded-lg"
            />
          </Form.Item>

          <Form.Item
            label={
              <Space size={4}>
                <span className="font-medium">系统标识</span>
                <Tooltip title="系统内部使用的唯一标识，通常为大写字母和下划线">
                  <QuestionCircleOutlined className="text-[#bfbfbf]" />
                </Tooltip>
              </Space>
            }
            name="identifier"
            rules={[{ required: true, message: '请输入系统标识' }]}
          >
            <Input 
              placeholder="请输入系统标识" 
              className="h-10 bg-[#f5f5f5] border-none hover:bg-[#f2f2f2] focus:bg-[#f2f2f2] rounded-lg"
              suffix={
                <Button 
                  type="link" 
                  size="small" 
                  onClick={() => form.setFieldValue('identifier', generateRandomId())}
                >
                  随机生成
                </Button>
              }
            />
          </Form.Item>

          <Form.Item
            label={<span className="font-medium">描述</span>}
            name="description"
          >
            <Input.TextArea 
              placeholder="请输入描述" 
              rows={3}
              className="bg-[#f5f5f5] border-none hover:bg-[#f2f2f2] focus:bg-[#f2f2f2] rounded-lg resize-none"
            />
          </Form.Item>

          <Form.Item label={<span className="font-medium">图标</span>}>
            <div className="flex flex-wrap gap-2 mb-4 pl-1">
              {WORK_ITEM_COLORS.map(color => (
                <div
                  key={color}
                  onClick={() => setSelectedColor(color)}
                  className={`w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center transition-all ${selectedColor === color ? 'ring-2 ring-offset-2 ring-blue-500' : 'hover:opacity-80'}`}
                  style={{ backgroundColor: color }}
                >
                  {selectedColor === color && <CheckOutlined className="text-white text-xs" />}
                </div>
              ))}
            </div>
            <div className="flex flex-wrap gap-4 pt-2 pl-1">
              {WORK_ITEM_ICONS.map(item => (
                <div
                  key={item.key}
                  onClick={() => setSelectedIcon(item.key)}
                  className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-all ${selectedIcon === item.key ? 'bg-blue-500 text-white rounded-lg shadow-sm' : 'text-[#595959] hover:bg-gray-100'}`}
                >
                  {item.icon}
                </div>
              ))}
            </div>
          </Form.Item>
        </Form>
      </Modal>

      {editingWorkItem && (
        <WorkItemDetailSetting
          workItem={editingWorkItem}
          onClose={() => setEditingWorkItem(null)}
          onUpdate={handleUpdateWorkItem}
          onDelete={handleDeleteWorkItem}
        />
      )}
    </div>
  );
};

export default WorkItemSettings;

