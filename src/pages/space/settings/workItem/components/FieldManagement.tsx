import React, { useState } from 'react';
import { Table, Input, Button, Space, Tag, Form } from 'antd';
import { SearchOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import MemberSelect from '@/components/MemberSelect';

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

interface FieldItem {
  key: string;
  name: string;
  type: string;
  defaultValue: string;
  identifier: string;
  isSystem?: boolean;
}

const FIELD_TYPES = [
  { label: '单选', value: 'select', color: '#52c41a' },
  { label: '多选', value: 'multiSelect', color: '#13c2c2' },
  { label: '日期', value: 'date', color: '#1890ff' },
  { label: '日期区间', value: 'dateRange', color: '#eb2f96' },
  { label: '单行文本', value: 'text', color: '#722ed1' },
  { label: '单选人员', value: 'member', color: '#fa8c16' },
  { label: '多选人员', value: 'multiMember', color: '#f5222d' },
  { label: '数字', value: 'number', color: '#faad14' },
  { label: '开关', value: 'switch', color: '#1677ff' },
];

const MOCK_DATA: FieldItem[] = [
  { key: '1', name: '业务线', type: 'select', defaultValue: '不展示默认值', identifier: 'business' },
  { key: '2', name: '描述', type: 'text', defaultValue: '不展示默认值', identifier: 'description' },
  { key: '3', name: '完成时间', type: 'date', defaultValue: '-', identifier: 'finish_time' },
  { key: '4', name: '名称', type: 'text', defaultValue: '不展示默认值', identifier: 'name' },
  { key: '5', name: '所属空间', type: 'text', defaultValue: '-', identifier: '-' },
  { key: '6', name: '创建者', type: 'member', defaultValue: '-', identifier: 'owner' },
  { key: '7', name: '当前负责人', type: 'multiMember', defaultValue: '-', identifier: 'current_status_operator' },
  { key: '8', name: '优先级', type: 'select', defaultValue: '不展示默认值', identifier: 'priority' },
  { key: '9', name: '排期', type: 'dateRange', defaultValue: '不展示默认值', identifier: '-' },
  { key: '10', name: '提出时间', type: 'date', defaultValue: '-', identifier: 'start_time' },
  { key: '11', name: '标签', type: 'multiSelect', defaultValue: '不展示默认值', identifier: 'tags' },
  { key: '12', name: '关注人', type: 'multiMember', defaultValue: '-', identifier: 'watchers' },
  { key: '13', name: '需求文档', type: 'text', defaultValue: '不展示默认值', identifier: 'wiki' },
  { key: '14', name: '工作项id', type: 'number', defaultValue: '-', identifier: 'work_item_id' },
  { key: '15', name: 'AB实验', type: 'switch', defaultValue: '不展示默认值', identifier: '-' },
];

const FieldManagement: React.FC = () => {
  const [selectedField, setSelectedField] = useState<FieldItem | null>(MOCK_DATA[0]);
  const [searchText, setSearchText] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const columns: ColumnsType<FieldItem> = [
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
      dataIndex: 'defaultValue',
      key: 'defaultValue',
      width: '25%',
    },
    {
      title: '对接标识',
      dataIndex: 'identifier',
      key: 'identifier',
      width: '20%',
      render: (text) => (
        <Space size={4}>
          <span>{text}</span>
        </Space>
      ),
    },
  ];

  const filteredData = MOCK_DATA.filter(item => 
    item.name.toLowerCase().includes(searchText.toLowerCase()) || 
    item.identifier.toLowerCase().includes(searchText.toLowerCase())
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
          <Button type="primary" className="h-9 rounded-lg bg-[#2f54eb]">
            新建字段
          </Button>
        </div>
        <div className="flex-1 overflow-auto">
          <Table
            columns={columns}
            dataSource={filteredData}
            pagination={false}
            rowKey="key"
            size="middle"
            onRow={(record) => ({
              onClick: () => setSelectedField(record),
              className: `cursor-pointer transition-colors ${selectedField?.key === record.key ? 'selected-row' : 'hover:bg-[#fafafa]'}`,
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
                  {selectedField.isSystem && (
                    <span className="text-xs text-[#8c8c8c] bg-[#f5f5f5] px-1.5 py-0.5 rounded">系统字段</span>
                  )}
                </div>
                <Button type="text" icon={<span className="text-xl font-bold">...</span>} />
              </div>
              <div className="space-y-3 text-sm">
                <div className="flex">
                  <span className="text-[#8c8c8c] w-20">字段类型:</span>
                  <span className="text-[#262626]">{FIELD_TYPES.find(t => t.value === selectedField.type)?.label}</span>
                  <QuestionCircleOutlined className="ml-1 text-[#bfbfbf] text-xs self-center" />
                </div>
                <div className="flex">
                  <span className="text-[#8c8c8c] w-20">字段ID:</span>
                  <span className="text-[#262626]">{selectedField.identifier}</span>
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
                <Form layout="vertical">
                  <Form.Item
                    label={<span className="text-[#595959] text-xs">字段名称 <span className="text-[#ff4d4f]">*</span></span>}
                    className="mb-6"
                  >
                    <Input 
                      value={selectedField.name} 
                      className="bg-[#f5f5f5] border-none h-10 rounded-lg hover:bg-[#f0f0f0] focus:bg-[#f0f0f0]"
                    />
                  </Form.Item>

                  {/* {(selectedField.type === 'member' || selectedField.type === 'multiMember') && (
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
                  )} */}
                </Form>
              </section>
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
      `}</style>
    </div>
  );
};

export default FieldManagement;
