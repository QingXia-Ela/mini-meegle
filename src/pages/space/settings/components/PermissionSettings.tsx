import { EllipsisOutlined, SearchOutlined, TeamOutlined } from '@ant-design/icons';
import { Avatar, Button, Checkbox, Collapse, Input, Tag, Modal, Empty } from 'antd';
import { useMemo, useState } from 'react';

const PermissionSettings = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const userGroups = useMemo(() => [
    {
      id: 'admin',
      name: '空间管理员',
      isSystem: true,
      memberCount: 1,
      description: '拥有全部空间配置权限的成员',
      members: [
        { id: 1, name: 'spark xiao', email: 'goo3092514593gle@gmail.com', avatar: 's' }
      ]
    },
    {
      id: 'member',
      name: '空间成员',
      isSystem: true,
      memberCount: 1,
      description: '可访问空间的所有成员',
      members: [
        { id: 1, name: 'spark xiao', email: 'goo3092514593gle@gmail.com', avatar: 's' }
      ]
    },
  ], []);

  const items = userGroups.map(group => ({
    key: group.id,
    label: (
      <div className="flex items-center w-full py-1">
        <div className="flex items-center flex-1">
          <div className="w-8 h-8 bg-blue-500 rounded flex items-center justify-center mr-3">
            <TeamOutlined style={{ color: '#fff', fontSize: '16px' }} />
          </div>
          <div className="flex items-center">
            <span className="text-base font-medium text-[#262626] mr-2">{group.name}</span>
            {group.isSystem && (
              <Tag className="bg-[#f5f5f5] border-[#d9d9d9] text-[#8c8c8c] rounded-md m-0">系统</Tag>
            )}
          </div>
        </div>

        <div className="flex-1 text-center">
          <span className="text-[#595959]">包含 {group.memberCount} 位成员</span>
        </div>

        <div className="flex-1 text-[#8c8c8c]">
          {group.description}
        </div>
      </div>
    ),
    children: (
      <div className="px-2">
        <div className="mb-6 pt-2">
          <div className="text-lg font-bold text-[#262626]">{group.name}</div>
          <div className="text-sm text-[#8c8c8c] mt-1">{group.description}</div>
        </div>

        <div className="flex justify-between items-center mb-4 gap-4">
          <Input 
            prefix={<SearchOutlined className="text-[#bfbfbf]" />}
            placeholder="搜索用户组成员"
            className="w-64 bg-[#f5f5f5] border-none rounded-lg h-9 hover:bg-[#f0f0f0] focus:bg-[#f0f0f0]"
          />
          <Button 
            className="text-blue-600 font-medium hover:bg-blue-50"
            onClick={() => setIsModalOpen(true)}
          >
            添加授权人员
          </Button>
        </div>

        <div className="border border-[#f0f0f0] rounded-lg bg-white overflow-hidden">
          {group.members.map((member) => (
            <div key={member.id} className="flex items-center px-4 py-3 hover:bg-[#fafafa] transition-colors">
              <div className="mr-4 flex items-center">
                <Checkbox />
              </div>
              <Avatar size={28} className="bg-[#8d6e63] mr-3 uppercase">{member.avatar}</Avatar>
              <span className="text-[#262626] font-medium mr-12 ml-2">{member.name}</span>
              <span className="text-[#8c8c8c] flex-1">{member.email}</span>
              <EllipsisOutlined className="text-[#8c8c8c] cursor-pointer text-lg hover:text-[#262626]" />
            </div>
          ))}
        </div>
      </div>
    )
  }));

  return (
    <div className="w-full px-12">
      <div className="text-xl text-[#262626] mb-8 font-bold">用户组管理</div>
      
      <Collapse 
        items={items}
        expandIconPosition="end"
        ghost
        accordion
        className="bg-white border border-[#f0f0f0] rounded-lg"
      />

      <Modal
        title={<span className="text-base font-bold">添加成员</span>}
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        width={720}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)} className="rounded-md">
            取消
          </Button>,
          <Button key="submit" type="primary" onClick={() => setIsModalOpen(false)} className="bg-blue-600 rounded-md ml-2">
            添加
          </Button>,
        ]}
        centered
        bodyStyle={{ padding: 0 }}
      >
        <div className="flex h-[480px] border-t border-b border-[#f0f0f0]">
          {/* 左侧：搜索与结果 */}
          <div className="flex-1 border-r border-[#f0f0f0] p-4 flex flex-col">
            <Input
              prefix={<SearchOutlined className="text-[#bfbfbf]" />}
              placeholder="搜索用户"
              className="mb-4 bg-[#f5f5f5] border-none rounded-lg h-9"
            />
            <div className="flex-1 flex flex-col items-center justify-center">
              <Empty
                image={<SearchOutlined style={{ fontSize: 64, color: '#bae7ff' }} />}
                description={<span className="text-[#8c8c8c]">暂无内容</span>}
              />
            </div>
          </div>

          {/* 右侧：已选择 */}
          <div className="flex-1 p-4 flex flex-col bg-white">
            <div className="text-[#8c8c8c] mb-4">
              已选择：0
            </div>
            <div className="flex-1 flex flex-col items-center justify-center">
              <Empty
                image={false}
                description={<span className="text-[#8c8c8c]">暂无内容</span>}
              />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PermissionSettings;

