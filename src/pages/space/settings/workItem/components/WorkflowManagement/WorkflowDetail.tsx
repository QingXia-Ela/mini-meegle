import React, { useCallback, useRef, useState, useMemo } from 'react';
import { Button, Form, Input, Popconfirm, message, Tabs, ConfigProvider, Select } from 'antd';
import { ArrowLeftOutlined, ExclamationCircleOutlined, DeleteOutlined, InfoCircleOutlined, PlusOutlined } from '@ant-design/icons';
import type { WorkflowType } from '../../api';
import { apiGetWorkItemFields, apiGetWorkItemRoles } from '../../api';
import { ProcessViewWithEditMode, type ProcessViewWithEditModeRef } from '@/components/ProcessView';
import DEFAULT_MAP from '@/components/ProcessView/exampleMap';
import { addEdge, addNodeAfterSpecifyNode, deleteEdge, deleteNode } from '@/components/ProcessView/utils';
import type { ProcessNodeType, ProcessNodeIdType } from '@/components/ProcessView/types';
import NodeClickMenu from '@/components/ProcessView/NodeClickMenu';
import { generateId } from '@/utils/generateId';

interface WorkflowDetailProps {
  workflow: WorkflowType;
  onBack: () => void;
  onUpdate: (id: number, values: { name: string; nodesDataRaw?: string; eventsDataRaw?: string; rolesDataRaw?: string }) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

interface WorkflowNodeEvent {
  /** node id */
  [key: string]: {
    onReach: Array<{ type: 'status_transition', to: /** status option */ { id: string; label: string; color: string } }>;
    onComplete: Array<{ type: 'status_transition', to: /** status option */ { id: string; label: string; color: string } }>;
  }
}

interface WorkflowNodeRole {
  /** node id */
  [key: string]: /** single role */ Array<{ id: string; name: string }>;
}

const WorkflowDetail: React.FC<WorkflowDetailProps> = ({
  workflow,
  onBack,
  onUpdate,
  onDelete,
}) => {
  const [form] = Form.useForm();
  const [sidebarForm] = Form.useForm();
  const [activeTab, setActiveTab] = React.useState('info');
  const [sidebarTab, setSidebarTab] = useState('info');
  const [processNodes, setProcessNodes] = useState<ProcessNodeType[]>(
    workflow.nodesData || Object.values(DEFAULT_MAP)
  );
  const [eventsData, setEventsData] = useState<WorkflowNodeEvent>(
    workflow.eventsData || {}
  );
  const [rolesData, setRolesData] = useState<WorkflowNodeRole>(
    workflow.rolesData || {}
  );
  const [statusOptions, setStatusOptions] = useState<Array<{ id: string; label: string; color: string }>>([]);
  const [allRoles, setAllRoles] = useState<Array<{ id: string; name: string }>>([]);

  const [selectedNodeId, setSelectedNodeId] = useState<ProcessNodeIdType | null>(null);
  const processViewWithEditModeRef = useRef<ProcessViewWithEditModeRef | null>(null);

  const selectedNode = useMemo(() =>
    processNodes.find(n => n.id === selectedNodeId),
    [processNodes, selectedNodeId]
  );

  React.useEffect(() => {
    // Fetch status options
    apiGetWorkItemFields(workflow.wid).then(fields => {
      const statusField = fields.find(f => f.id === 'status');
      if (statusField && statusField.jsonConfig?.options) {
        setStatusOptions(statusField.jsonConfig.options);
      }
    });

    // Fetch roles
    apiGetWorkItemRoles(workflow.wid).then(roles => {
      setAllRoles(roles);
    });
  }, [workflow.wid]);

  React.useEffect(() => {
    if (selectedNode) {
      sidebarForm.setFieldsValue({
        name: selectedNode.name,
        roleIds: (rolesData[selectedNode.id] || [])[0]?.id,
      });
    }
  }, [selectedNodeId, sidebarForm, selectedNode, rolesData]);

  const tabs = [
    { key: 'info', label: '基本信息' },
    { key: 'diagram', label: '流程图' },
  ];

  const handleSave = async () => {
    try {
      const values = await form.validateFields() as { name: string };
      await onUpdate(workflow.id, {
        ...values,
        nodesDataRaw: JSON.stringify(processNodes),
        eventsDataRaw: JSON.stringify(eventsData),
        rolesDataRaw: JSON.stringify(rolesData),
      });
      message.success('保存成功');
    } catch (error: unknown) {
      console.error('Save failed:', error);
    }
  };

  const handleAddEvent = (nodeId: ProcessNodeIdType, eventType: 'onReach' | 'onComplete') => {
    setEventsData(prev => {
      const nodeEvents = prev[nodeId] || { onReach: [], onComplete: [] };
      return {
        ...prev,
        [nodeId]: {
          ...nodeEvents,
          [eventType]: [
            ...nodeEvents[eventType],
            { type: 'status_transition', to: statusOptions[0]?.id || '' }
          ]
        }
      };
    });
  };

  const handleDeleteEvent = (nodeId: ProcessNodeIdType, eventType: 'onReach' | 'onComplete', index: number) => {
    setEventsData(prev => {
      const nodeEvents = prev[nodeId];
      if (!nodeEvents) return prev;
      const newEvents = [...nodeEvents[eventType]];
      newEvents.splice(index, 1);
      return {
        ...prev,
        [nodeId]: {
          ...nodeEvents,
          [eventType]: newEvents
        }
      };
    });
  };

  const getEventTargetId = (to: unknown) => {
    if (typeof to === 'string') return to;
    if (to && typeof to === 'object' && 'id' in to) {
      const id = (to as { id?: unknown }).id;
      return typeof id === 'string' ? id : '';
    }
    return '';
  };

  const handleUpdateEvent = (
    nodeId: ProcessNodeIdType,
    eventType: 'onReach' | 'onComplete',
    index: number,
    toId: string,
  ) => {
    setEventsData(prev => {
      const nodeEvents = prev[nodeId];
      if (!nodeEvents) return prev;
      const selectedOption =
        statusOptions.find((opt) => opt.id === toId) || {
          id: toId,
          label: toId,
          color: '',
        };
      const newEvents = [...nodeEvents[eventType]];
      newEvents[index] = { ...newEvents[index], to: selectedOption };
      return {
        ...prev,
        [nodeId]: {
          ...nodeEvents,
          [eventType]: newEvents
        }
      };
    });
  };

  const handleDelete = async () => {
    await onDelete(workflow.id);
    onBack();
  };

  const handleAddEdge = useCallback((_sourceNodeId: ProcessNodeIdType, _targetNodeId: ProcessNodeIdType, newNodes: ProcessNodeType[]) => {
    setProcessNodes(newNodes);
    message.success('边创建成功');
  }, []);

  const handleNodeUpdate = useCallback((id: ProcessNodeIdType, updates: Partial<ProcessNodeType>) => {
    setProcessNodes(prev => prev.map(node =>
      node.id === id ? { ...node, ...updates } : node
    ));
  }, []);

  const handleNodeClick = useCallback((node: ProcessNodeType) => {
    setSelectedNodeId(node.id);
  }, []);

  const handleNodeMenuClick = useCallback((node: ProcessNodeType) => {
    processViewWithEditModeRef.current?.popupMenuAtNode(
      node.id,
      <NodeClickMenu
        nodes={processNodes}
        triggerNodeId={node.id}
        onAddNode={(targetNodeId) => {
          const newNodeId = `node_${generateId()}`;
          const nodes = addNodeAfterSpecifyNode(processNodes, {
            id: newNodeId,
            name: '未命名节点',
          }, targetNodeId);
          setProcessNodes(nodes);
          setSelectedNodeId(newNodeId);
          processViewWithEditModeRef.current?.hideNodeMenu();
        }}
        onConnectNode={(sourceNodeId, targetNodeId) => {
          const nodes = addEdge(processNodes, sourceNodeId, targetNodeId);
          setProcessNodes(nodes);
          processViewWithEditModeRef.current?.hideNodeMenu();
        }}
        onDeleteNode={(id) => {
          const nodes = deleteNode(processNodes, id);
          setProcessNodes(nodes);
          // 清理关联数据
          setEventsData(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          setRolesData(prev => {
            const next = { ...prev };
            delete next[id];
            return next;
          });
          if (selectedNodeId === id) {
            setSelectedNodeId(null);
          }
          processViewWithEditModeRef.current?.hideNodeMenu();
        }}
        onRemoveEdge={(sourceNodeId, targetNodeId) => {
          const nodes = deleteEdge(processNodes, sourceNodeId, targetNodeId);
          setProcessNodes(nodes);
          processViewWithEditModeRef.current?.hideNodeMenu();
        }}
      />
    );
  }, [processNodes, selectedNodeId]);

  return (
    <div className="flex flex-col h-full bg-[#fcfcfc] w-full">
      {/* Sub Header */}
      <div className="flex items-center px-6 h-12 bg-white border-b border-[#f0f0f0]">
        <Button
          type="text"
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          className="mr-4 text-[#8c8c8c] hover:text-[#262626]"
        />
        <span className="text-base font-medium text-[#262626] mr-8">
          {workflow.name}
        </span>
        <div className="flex gap-8 h-full">
          {tabs.map((tab) => (
            <div
              key={tab.key}
              className={`h-full flex items-center cursor-pointer text-sm transition-all border-b-2 relative top-[1px] ${activeTab === tab.key
                ? 'text-blue-600 border-blue-600 font-medium'
                : 'text-[#595959] border-transparent hover:text-blue-600'
                }`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </div>
          ))}
        </div>
        <div className="flex-1" />
        <Button
          type="primary"
          onClick={handleSave}
          className="bg-[#2f54eb]"
        >
          保存
        </Button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'info' ? (
          <div className="h-full overflow-y-auto p-6">
            <div className="max-w-[800px] mx-auto">
              <Form
                form={form}
                layout="vertical"
                initialValues={{ name: workflow.name }}
              >
                <Form.Item
                  label={<span className="text-[#8c8c8c]">流程名称</span>}
                  name="name"
                  rules={[{ required: true, message: '请输入流程名称' }]}
                >
                  <Input
                    placeholder="请输入流程名称"
                    className="h-10 bg-[#f5f5f5] border-none hover:bg-[#f2f2f2] focus:bg-[#f2f2f2] rounded-lg"
                  />
                </Form.Item>

                <div className="mt-12">
                  <div className="flex items-center mb-6">
                    <div className="w-[3px] h-4 bg-blue-600 rounded-full mr-2" />
                    <span className="text-base font-bold text-[#262626]">流程操作</span>
                  </div>

                  <div className="flex justify-between items-center p-4 bg-white border border-[#f0f0f0] rounded-lg">
                    <div>
                      <div className="text-sm font-medium text-[#262626] mb-1">删除流程</div>
                      <div className="text-xs text-[#8c8c8c]">删除流程后，当前流程的数据将会被清空</div>
                    </div>
                    <Popconfirm
                      title="确定要删除该流程吗？"
                      description="删除后将无法恢复，且当前流程的所有数据将被清空"
                      onConfirm={handleDelete}
                      okText="确定"
                      cancelText="取消"
                      okButtonProps={{ danger: true }}
                      icon={<ExclamationCircleOutlined style={{ color: 'red' }} />}
                    >
                      <Button danger>删除</Button>
                    </Popconfirm>
                  </div>
                </div>
              </Form>
            </div>
          </div>
        ) : (
          <div className="flex h-full overflow-hidden">
            {/* Left: Process View */}
            <div className="flex-1 bg-[#fcfcfc] relative">
              <ProcessViewWithEditMode
                nodes={processNodes}
                onAddEdge={handleAddEdge}
                onNodeClick={handleNodeClick}
                onNodeMenuClick={handleNodeMenuClick}
                ref={processViewWithEditModeRef}
              />
            </div>

            {/* Right: Config Panel */}
            <div className="w-[360px] bg-white border-l border-[#f0f0f0] flex flex-col">
              {/* Panel Header */}
              <div className="px-4 h-12 flex-shrink-0 border-b border-[#f0f0f0] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${selectedNode ? 'bg-blue-500' : 'bg-gray-400'}`} />
                  <span className="text-sm font-medium text-[#262626]">
                    {selectedNode?.name || '未选中节点'}
                  </span>
                </div>
                {selectedNode && selectedNode.canDelete !== false && (
                  <Popconfirm
                    title="确定要删除该节点吗？"
                    onConfirm={() => {
                      const nodes = deleteNode(processNodes, selectedNode.id);
                      setProcessNodes(nodes);
                      // 清理关联数据
                      setEventsData(prev => {
                        const next = { ...prev };
                        delete next[selectedNode.id];
                        return next;
                      });
                      setRolesData(prev => {
                        const next = { ...prev };
                        delete next[selectedNode.id];
                        return next;
                      });
                      setSelectedNodeId(null);
                    }}
                    okText="确定"
                    cancelText="取消"
                    okButtonProps={{ danger: true }}
                  >
                    <Button
                      type="text"
                      size="small"
                      danger
                      icon={<DeleteOutlined />}
                      className="flex items-center justify-center hover:bg-red-50"
                    />
                  </Popconfirm>
                )}
              </div>

              {/* Panel Tabs */}
              <div className="px-4 flex-shrink-0">
                <ConfigProvider
                  theme={{
                    components: {
                      Tabs: {
                        horizontalItemPadding: '12px 0',
                        itemSelectedColor: '#262626',
                        itemHoverColor: '#262626',
                        itemColor: '#8c8c8c',
                        titleFontSize: 13,
                        inkBarColor: '#2f54eb',
                      },
                    },
                  }}
                >
                  <Tabs
                    activeKey={sidebarTab}
                    onChange={setSidebarTab}
                    items={[
                      { key: 'info', label: '节点信息' },
                      { key: 'event', label: '节点事件' },
                    ]}
                  />
                </ConfigProvider>
              </div>

              {/* Panel Content */}
              <div className="flex-1 overflow-y-auto px-4 py-2">
                {!selectedNode ? (
                  <div className="h-full flex flex-col items-center justify-center text-[#8c8c8c] opacity-60">
                    <InfoCircleOutlined className="text-4xl mb-2" />
                    <p className="text-sm">请在左侧点击节点进行配置</p>
                  </div>
                ) : (
                  <>
                    {sidebarTab === 'info' && (
                      <div>
                        <div className="flex items-center mb-6">
                          <div className="w-[3px] h-4 bg-blue-600 rounded-full mr-2" />
                          <span className="text-sm font-bold text-[#262626]">基础信息配置</span>
                        </div>

                        <Form
                          form={sidebarForm}
                          layout="vertical"
                          onValuesChange={(changedValues) => {
                            if (selectedNodeId) {
                              // 如果修改了名称，确保不为空才同步
                              if (changedValues.name !== undefined) {
                                if (changedValues.name.trim()) {
                                  handleNodeUpdate(selectedNodeId, changedValues);
                                }
                              } else if (changedValues.roleIds !== undefined) {
                                // 处理角色变更（单选，但保持数组结构）
                                const roleId = changedValues.roleIds as string | undefined;
                                const selectedRole = allRoles.find(r => r.id === roleId);
                                setRolesData(prev => ({
                                  ...prev,
                                  [selectedNodeId]: selectedRole ? [{ id: selectedRole.id, name: selectedRole.name }] : []
                                }));
                              } else {
                                handleNodeUpdate(selectedNodeId, changedValues);
                              }
                            }
                          }}
                        >
                          <Form.Item
                            label={<span className="text-[#8c8c8c] text-xs">节点名称</span>}
                            name="name"
                            rules={[{ required: true, message: '节点名称不能为空' }]}
                            className="mb-4"
                          >
                            <Input
                              placeholder="请输入节点名称"
                              className="h-9 bg-[#f5f5f5] border-none hover:bg-[#f2f2f2] focus:bg-[#f2f2f2] rounded-lg"
                            />
                          </Form.Item>

                          <Form.Item
                            label={<span className="text-[#8c8c8c] text-xs">角色关联</span>}
                            name="roleIds"
                            className="mb-4"
                          >
                            <Select
                              placeholder="请选择关联角色"
                              className="w-full"
                              options={allRoles.map(role => ({
                                label: role.name,
                                value: role.id
                              }))}
                              allowClear
                            />
                          </Form.Item>

                          <Form.Item
                            label={<span className="text-[#8c8c8c] text-xs">节点 ID</span>}
                          >
                            <div className="text-sm text-[#262626] font-mono bg-[#f5f5f5] px-2 py-1 rounded">
                              {selectedNode.id}
                            </div>
                          </Form.Item>
                        </Form>
                      </div>
                    )}
                    {sidebarTab === 'event' && (
                      <div className="flex flex-col gap-6">
                        {/* Node Arrival Events */}
                        <div>
                          <div className="text-sm font-medium text-[#262626] mb-3">节点到达事件</div>
                          {(eventsData[selectedNode.id]?.onReach || []).map((event, index) => (
                            <div key={`onReach-${index}`} className="bg-white border border-[#f0f0f0] rounded-lg p-4 mb-3 relative">
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-medium text-[#262626]">到达事件 ({index + 1})</span>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<DeleteOutlined className="text-[#8c8c8c]" />}
                                  onClick={() => handleDeleteEvent(selectedNode.id, 'onReach', index)}
                                />
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <div className="flex items-center gap-1 mb-2 text-[#595959] text-xs">
                                    <span>事件类型</span>
                                    <InfoCircleOutlined className="text-[#bfbfbf]" />
                                  </div>
                                  <Select
                                    className="w-full h-9 bg-[#f5f5f5] rounded-lg"
                                    value={event.type}
                                    variant="borderless"
                                    options={[{ value: 'status_transition', label: '状态流转' }]}
                                  />
                                </div>

                                <div>
                                  <div className="mb-2 text-[#595959] text-xs">状态流转为</div>
                                  <Select
                                    className="w-full h-9 bg-[#f5f5f5] rounded-lg"
                                    value={getEventTargetId(event.to)}
                                    variant="borderless"
                                    onChange={(value) => handleUpdateEvent(selectedNode.id, 'onReach', index, value)}
                                    options={statusOptions.map(opt => ({
                                      value: opt.id,
                                      label: opt.label
                                    }))}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}

                          <Button
                            block
                            icon={<PlusOutlined />}
                            className="h-9 border-[#f0f0f0] text-blue-600 hover:text-blue-700 hover:border-blue-600 text-xs"
                            onClick={() => handleAddEvent(selectedNode.id, 'onReach')}
                          >
                            添加到达事件
                          </Button>
                        </div>

                        {/* Node Completion Events */}
                        <div>
                          <div className="text-sm font-medium text-[#262626] mb-3">节点完成事件</div>
                          {(eventsData[selectedNode.id]?.onComplete || []).map((event, index) => (
                            <div key={`onComplete-${index}`} className="bg-white border border-[#f0f0f0] rounded-lg p-4 mb-3 relative">
                              <div className="flex justify-between items-center mb-4">
                                <span className="text-sm font-medium text-[#262626]">完成事件 ({index + 1})</span>
                                <Button
                                  type="text"
                                  size="small"
                                  icon={<DeleteOutlined className="text-[#8c8c8c]" />}
                                  onClick={() => handleDeleteEvent(selectedNode.id, 'onComplete', index)}
                                />
                              </div>

                              <div className="space-y-4">
                                <div>
                                  <div className="flex items-center gap-1 mb-2 text-[#595959] text-xs">
                                    <span>事件类型</span>
                                    <InfoCircleOutlined className="text-[#bfbfbf]" />
                                  </div>
                                  <Select
                                    className="w-full h-9 bg-[#f5f5f5] rounded-lg"
                                    value={event.type}
                                    variant="borderless"
                                    options={[{ value: 'status_transition', label: '状态流转' }]}
                                  />
                                </div>

                                <div>
                                  <div className="mb-2 text-[#595959] text-xs">状态流转为</div>
                                  <Select
                                    className="w-full h-9 bg-[#f5f5f5] rounded-lg"
                                    value={getEventTargetId(event.to)}
                                    variant="borderless"
                                    onChange={(value) => handleUpdateEvent(selectedNode.id, 'onComplete', index, value)}
                                    options={statusOptions.map(opt => ({
                                      value: opt.id,
                                      label: opt.label
                                    }))}
                                  />
                                </div>
                              </div>
                            </div>
                          ))}
                          <Button
                            block
                            icon={<PlusOutlined />}
                            className="h-9 border-[#f0f0f0] text-blue-600 hover:text-blue-700 hover:border-blue-600 text-xs"
                            onClick={() => handleAddEvent(selectedNode.id, 'onComplete')}
                          >
                            添加完成事件
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkflowDetail;
