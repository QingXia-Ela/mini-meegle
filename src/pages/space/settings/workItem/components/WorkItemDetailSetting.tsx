import {
  BookFilled,
  CheckCircleFilled,
  ExclamationCircleFilled,
  RocketFilled,
  UserOutlined,
  CheckOutlined,
  CloseOutlined,
  ExclamationCircleOutlined,
} from '@ant-design/icons';
import {
  Button,
  Form,
  Input,
  message,
  Popconfirm,
} from 'antd';
import { useState, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { WORK_ITEM_ICONS, WORK_ITEM_COLORS } from '../constants/icons';
import RoleManagement from './RoleManagement';
import FieldManagement from './FieldManagement';

interface WorkItemDetailSettingProps {
  workItem?: any;
  onClose?: () => void;
  onUpdate?: (values: any) => void;
  onDelete?: (id: string) => void;
}

const WorkItemDetailSetting = ({
  workItem,
  onClose,
  onUpdate,
  onDelete,
}: WorkItemDetailSettingProps) => {
  const [form] = Form.useForm();
  const location = useLocation();
  const navigate = useNavigate();

  const activeTab = useMemo(() => {
    return new URLSearchParams(location.search).get('menuTab') || 'info';
  }, [location.search]);

  const setActiveTab = (key: string) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set('menuTab', key);
    navigate({ search: searchParams.toString() }, { replace: true });
  };

  const [selectedColor, setSelectedColor] = useState(
    workItem?.color || WORK_ITEM_COLORS[0]
  );
  const [selectedIcon, setSelectedIcon] = useState(
    workItem?.icon || WORK_ITEM_ICONS[0].key
  );

  const formValues = Form.useWatch([], form);

  const hasChanged = useMemo(() => {
    if (!workItem) return false;
    const isFormChanged =
      formValues?.name !== workItem.name ||
      (formValues?.description || '') !== (workItem.description || '') ||
      (formValues?.mode || 'node') !== (workItem.mode || 'node');

    const isIconChanged =
      selectedIcon !== (workItem.icon || WORK_ITEM_ICONS[0].key);
    const isColorChanged =
      selectedColor !== (workItem.color || WORK_ITEM_COLORS[0]);

    return isFormChanged || isIconChanged || isColorChanged;
  }, [formValues, selectedIcon, selectedColor, workItem]);

  const tabs = useMemo(
    () => [
      { key: 'info', label: '基本信息' },
      { key: 'field', label: '字段管理' },
      { key: 'layout', label: '页面布局' },
      { key: 'flow', label: '流程管理' },
      { key: 'role', label: '角色管理' },
    ],
    []
  );

  const getIconConfig = (item: any) => {
    const iconObj = WORK_ITEM_ICONS.find((i) => i.key === item?.icon);
    if (iconObj && item?.color) {
      return { icon: iconObj.icon, color: item.color };
    }

    const configs: Record<string, { icon: React.ReactNode; color: string }> = {
      需求: {
        icon: <CheckCircleFilled style={{ fontSize: '16px' }} />,
        color: '#1677ff',
      },
      缺陷: {
        icon: <ExclamationCircleFilled style={{ fontSize: '16px' }} />,
        color: '#ff4d4f',
      },
      任务: {
        icon: <CheckCircleFilled style={{ fontSize: '16px' }} />,
        color: '#40a9ff',
      },
      客户原声: {
        icon: <UserOutlined style={{ fontSize: '16px' }} />,
        color: '#9254de',
      },
      Onboarding: {
        icon: <RocketFilled style={{ fontSize: '16px' }} />,
        color: '#a0d911',
      },
      Project: {
        icon: <BookFilled style={{ fontSize: '16px' }} />,
        color: '#722ed1',
      },
    };

    return (
      configs[item?.name] || {
        icon: <CheckCircleFilled style={{ fontSize: '16px' }} />,
        color: '#1677ff',
      }
    );
  };

  const currentIconConfig = useMemo(
    () => getIconConfig(workItem),
    [workItem]
  );

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      onUpdate?.({
        ...values,
        icon: selectedIcon,
        color: selectedColor,
      });
      message.success('保存成功');
    } catch (error) {
      console.error('Save failed:', error);
    }
  };

  const handleClose = () => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.delete('menuTab');
    navigate({ search: searchParams.toString() }, { replace: true });
    onClose?.();
  };

  return (
    <div className="fixed inset-0 bg-white z-[100] flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-between px-5 h-14 border-b border-[#f0f0f0]">
        <div className="flex items-center">
          <div
            className="w-6 h-6 rounded flex items-center justify-center text-white mr-3"
            style={{ backgroundColor: currentIconConfig.color }}
          >
            {currentIconConfig.icon}
          </div>
          <span className="text-base font-medium text-[#262626]">
            {workItem?.name || '工作项详情'}
          </span>
        </div>

        <div className="flex-1 flex justify-center items-center h-full">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`px-4 h-full flex items-center cursor-pointer transition-all border-b-2 relative top-[1px] ${activeTab === tab.key
                  ? 'text-blue-600 border-blue-600 font-medium'
                  : 'text-[#595959] border-transparent hover:text-blue-600'
                }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </div>
          ))}
        </div>

        <div
          className="w-8 h-8 flex items-center justify-center rounded hover:bg-gray-100 cursor-pointer text-[#8c8c8c]"
          onClick={handleClose}
        >
          <CloseOutlined style={{ fontSize: '16px' }} />
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto bg-[#fafafa] flex justify-center">
        {activeTab === 'info' && (
          <div className="w-full max-w-[1000px] px-8">
            <div className="bg-white rounded-lg p-8 border border-[#f0f0f0] mb-8">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center">
                  <div className="w-[3px] h-4 bg-blue-600 rounded-full mr-2" />
                  <span className="text-base font-bold text-[#262626]">
                    基础信息配置
                  </span>
                </div>
                <Button
                  type="primary"
                  ghost
                  onClick={handleSave}
                  disabled={!hasChanged}
                >
                  保存修改
                </Button>
              </div>

              <Form
                form={form}
                layout="vertical"
                initialValues={{
                  name: workItem?.name,
                  mode: workItem?.mode || 'node',
                  identifier: workItem?.id,
                  description: workItem?.description,
                }}
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
                    <div className="flex items-center gap-1">
                      <span className="font-medium">系统标识</span>
                    </div>
                  }
                  name="identifier"
                >
                  <Input
                    disabled
                    placeholder="请输入系统标识"
                    className="h-10 bg-[#f5f5f5] border-none rounded-lg"
                  />
                </Form.Item>

                <Form.Item
                  label={<span className="font-medium">描述</span>}
                  name="description"
                >
                  <Input.TextArea
                    placeholder="请输入描述"
                    rows={4}
                    className="bg-[#f5f5f5] border-none hover:bg-[#f2f2f2] focus:bg-[#f2f2f2] rounded-lg resize-none"
                  />
                </Form.Item>

                <Form.Item label={<span className="font-medium">图标</span>}>
                  <div className="flex flex-wrap gap-2 mb-4 pl-1">
                    {WORK_ITEM_COLORS.map((color) => (
                      <div
                        key={color}
                        onClick={() => setSelectedColor(color)}
                        className={`w-8 h-8 rounded-lg cursor-pointer flex items-center justify-center transition-all ${selectedColor === color
                            ? 'ring-2 ring-offset-2 ring-blue-500'
                            : 'hover:opacity-80'
                          }`}
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && (
                          <CheckOutlined className="text-white text-xs" />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-4 pt-2 pl-1">
                    {WORK_ITEM_ICONS.map((item) => (
                      <div
                        key={item.key}
                        onClick={() => setSelectedIcon(item.key)}
                        className={`w-8 h-8 rounded flex items-center justify-center cursor-pointer transition-all ${selectedIcon === item.key
                            ? 'bg-blue-500 text-white rounded-lg shadow-sm'
                            : 'text-[#595959] hover:bg-gray-100'
                          }`}
                      >
                        {item.icon}
                      </div>
                    ))}
                  </div>
                </Form.Item>
              </Form>

              <div className="mt-12 pt-8 border-t border-[#f0f0f0]">
                <Popconfirm
                  title="确定要删除该工作项类型吗？"
                  description="删除后将无法恢复"
                  onConfirm={() => onDelete?.(workItem?.id)}
                  okText="确定删除"
                  cancelText="取消"
                  okButtonProps={{ danger: true }}
                  icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                >
                  <Button danger size="large" className='w-full'>
                    <span className='font-bold'>删除工作项</span>
                  </Button>
                </Popconfirm>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'role' && <RoleManagement workItemId={workItem?.id} />}
        {activeTab === 'field' && <FieldManagement />}
        {activeTab !== 'info' && activeTab !== 'role' && activeTab !== 'field' && (
          <div className="flex flex-col items-center justify-center bg-white rounded-lg border border-[#f0f0f0]">
            <div className="text-gray-400">建设中...</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkItemDetailSetting;

