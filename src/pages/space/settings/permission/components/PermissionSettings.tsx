import { EllipsisOutlined, SearchOutlined, TeamOutlined, CloseOutlined } from '@ant-design/icons';
import { Avatar, Button, Checkbox, Collapse, Input, Tag, Modal, Empty, Pagination, Spin, List, message } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router';
import { apiListSpaceUsers, apiSearchUsers, apiAddSpaceUsers, apiGetSpaceUserIds } from '../api';
import debounce from 'lodash-es/debounce';
import VList from 'rc-virtual-list';

const PAGE_SIZE = 20;
const SEARCH_PAGE_SIZE = 50;

interface Member {
  id: number;
  name: string;
  email: string;
  avatar: string | null;
}

interface SpaceUser {
  uid: number;
  sid: string;
  space_permission: string;
  display_permission?: string;
  user: Member;
}

interface SpaceUserData {
  items: SpaceUser[];
  total: number;
  page: number;
  loading: boolean;
}

const PermissionSettings = () => {
  const { spaceId } = useParams<{ spaceId: string }>();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetPermission, setTargetPermission] = useState<'manager' | 'member'>('member');

  // 空间管理员状态
  const [adminData, setAdminData] = useState<SpaceUserData>({
    items: [],
    total: 0,
    page: 1,
    loading: false,
  });

  // 空间成员状态
  const [memberData, setMemberData] = useState<SpaceUserData>({
    items: [],
    total: 0,
    page: 1,
    loading: false,
  });

  // 搜索用户相关状态
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchTotal, setSearchTotal] = useState(0);
  const [selectedUsers, setSelectedUsers] = useState<Member[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [existingUserIds, setExistingUserIds] = useState<Set<number>>(() => new Set());

  const fetchExistingUserIds = useCallback(async () => {
    if (!spaceId) return;
    try {
      const ids = await apiGetSpaceUserIds(spaceId);
      setExistingUserIds(new Set(ids));
    } catch (error) {
      console.error('Failed to fetch existing user ids:', error);
    }
  }, [spaceId]);

  const fetchAdmins = useCallback(async (page: number) => {
    if (!spaceId) return;
    setAdminData(prev => ({ ...prev, loading: true }));
    try {
      const res = (await apiListSpaceUsers({
        sid: spaceId,
        permission: 'manager',
        offset: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      })) as { items: SpaceUser[]; total: number };
      setAdminData({
        items: res.items,
        total: res.total,
        page,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      setAdminData(prev => ({ ...prev, loading: false }));
    }
  }, [spaceId]);

  const fetchMembers = useCallback(async (page: number) => {
    if (!spaceId) return;
    setMemberData(prev => ({ ...prev, loading: true }));
    try {
      const res = (await apiListSpaceUsers({
        sid: spaceId,
        offset: (page - 1) * PAGE_SIZE,
        limit: PAGE_SIZE,
      })) as { items: SpaceUser[]; total: number };
      setMemberData({
        items: res.items,
        total: res.total,
        page,
        loading: false,
      });
    } catch (error) {
      console.error('Failed to fetch members:', error);
      setMemberData(prev => ({ ...prev, loading: false }));
    }
  }, [spaceId]);

  useEffect(() => {
    fetchAdmins(1);
    fetchMembers(1);
    fetchExistingUserIds();
  }, [fetchAdmins, fetchMembers, fetchExistingUserIds]);

  // 搜索逻辑
  const handleSearch = useMemo(
    () =>
      debounce(async (keyword: string, offset: number = 0) => {
        if (!keyword.trim()) {
          setSearchResults([]);
          setSearchTotal(0);
          return;
        }
        setSearchLoading(true);
        try {
          const res = (await apiSearchUsers({
            keyword,
            offset,
            limit: SEARCH_PAGE_SIZE,
          })) as { items: Member[]; total: number };
          if (offset === 0) {
            setSearchResults(res.items);
          } else {
            setSearchResults(prev => [...prev, ...res.items]);
          }
          setSearchTotal(res.total);
        } catch (error) {
          console.error('Failed to search users:', error);
        } finally {
          setSearchLoading(false);
        }
      }, 500),
    []
  );

  const onSearchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchKeyword(value);
    handleSearch(value, 0);
  };

  const onScroll = (e: React.UIEvent<HTMLElement, UIEvent>) => {
    const { scrollHeight, scrollTop, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10 && !searchLoading && searchResults.length < searchTotal) {
      handleSearch(searchKeyword, searchResults.length);
    }
  };

  const toggleUserSelection = (user: Member) => {
    setSelectedUsers(prev => {
      const exists = prev.find(u => u.id === user.id);
      if (exists) {
        return prev.filter(u => u.id !== user.id);
      } else {
        return [...prev, user];
      }
    });
  };

  const handleAddMembers = async () => {
    if (!spaceId || selectedUsers.length === 0) return;
    setIsAdding(true);
    try {
      await apiAddSpaceUsers(spaceId, selectedUsers.map(u => u.id), targetPermission);
      message.success('成员添加成功');
      setIsModalOpen(false);
      setSelectedUsers([]);
      setSearchKeyword('');
      setSearchResults([]);
      // 刷新列表
      fetchAdmins(1);
      fetchMembers(1);
      fetchExistingUserIds();
    } catch (error) {
      console.error('Failed to add members:', error);
      message.error('成员添加失败');
    } finally {
      setIsAdding(false);
    }
  };

  const userGroups = useMemo(() => [
    {
      id: 'admin',
      name: '空间管理员',
      isSystem: true,
      memberCount: adminData.total,
      description: '拥有全部空间配置权限的成员',
      data: adminData,
      onPageChange: fetchAdmins,
    },
    {
      id: 'member',
      name: '空间成员',
      isSystem: true,
      memberCount: memberData.total,
      description: '可访问空间的所有成员',
      data: memberData,
      onPageChange: fetchMembers,
    },
  ], [adminData, memberData, fetchAdmins, fetchMembers]);

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
            onClick={() => {
              setTargetPermission(group.id === 'admin' ? 'manager' : 'member');
              setIsModalOpen(true);
            }}
          >
            添加授权人员
          </Button>
        </div>

        <Spin spinning={group.data.loading}>
          <div className="border border-[#f0f0f0] rounded-lg bg-white overflow-hidden">
            {group.data.items.length > 0 ? (
              group.data.items.map((item) => {
                const member = item.user;
                return (
                  <div key={member.id} className="flex items-center px-4 py-3 hover:bg-[#fafafa] transition-colors">
                    <Avatar size={28} className="bg-[#8d6e63] mr-3 uppercase">{member.avatar || member.name[0]}</Avatar>
                    <span className="text-[#262626] font-medium mr-12 ml-2">{member.name}</span>
                    <span className="text-[#8c8c8c] flex-1">{member.email}</span>
                    <EllipsisOutlined className="text-[#8c8c8c] cursor-pointer text-lg hover:text-[#262626]" />
                  </div>
                );
              })
            ) : (
              <div className="py-8">
                <Empty description="暂无成员" />
              </div>
            )}
          </div>
        </Spin>

        {group.data.total > PAGE_SIZE && (
          <div className="mt-4 flex justify-end">
            <Pagination
              current={group.data.page}
              pageSize={PAGE_SIZE}
              total={group.data.total}
              onChange={(page) => group.onPageChange(page)}
              showSizeChanger={false}
            />
          </div>
        )}
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
        onCancel={() => {
          setIsModalOpen(false);
          setSelectedUsers([]);
          setSearchKeyword('');
          setSearchResults([]);
        }}
        width={720}
        footer={[
          <Button key="cancel" onClick={() => setIsModalOpen(false)} className="rounded-md">
            取消
          </Button>,
          <Button 
            key="submit" 
            type="primary" 
            onClick={handleAddMembers} 
            loading={isAdding}
            disabled={selectedUsers.length === 0}
            className="bg-blue-600 rounded-md ml-2"
          >
            添加
          </Button>,
        ]}
        centered
        body={{ padding: 0 }}
      >
        <div className="flex h-[480px] border-t border-b border-[#f0f0f0]">
          {/* 左侧：搜索与结果 */}
          <div className="flex-1 border-r border-[#f0f0f0] p-4 flex flex-col overflow-hidden">
            <Input
              prefix={<SearchOutlined className="text-[#bfbfbf]" />}
              placeholder="搜索用户"
              value={searchKeyword}
              onChange={onSearchInputChange}
              className="mb-4 bg-[#f5f5f5] border-none rounded-lg h-9"
              allowClear
            />
            <div className="flex-1 overflow-hidden custom-scrollbar">
              {searchLoading && searchResults.length === 0 ? (
                <div className="h-full flex items-center justify-center">
                  <Spin />
                </div>
              ) : searchResults.length > 0 ? (
                <VList
                  data={searchResults}
                  height={400}
                  itemHeight={48}
                  itemKey="id"
                  onScroll={onScroll}
                >
                  {(user: Member) => {
                    const isExisting = existingUserIds.has(user.id);
                    return (
                      <div 
                        key={user.id}
                        className={`flex items-center px-2 py-2 rounded-md transition-colors h-[48px] gap-2 ${
                          isExisting ? 'cursor-not-allowed opacity-60' : 'hover:bg-[#f5f5f5] cursor-pointer'
                        }`}
                        onClick={() => !isExisting && toggleUserSelection(user)}
                      >
                        <Checkbox 
                          checked={isExisting || selectedUsers.some(u => u.id === user.id)} 
                          disabled={isExisting}
                          className="mr-3"
                          onClick={(e) => e.stopPropagation()}
                          onChange={() => !isExisting && toggleUserSelection(user)}
                        />
                        <Avatar size={32} className="bg-[#8d6e63] mr-3 uppercase flex-shrink-0">{user.avatar || user.name[0]}</Avatar>
                        <div className="flex flex-col overflow-hidden">
                          <span className="text-sm font-medium text-[#262626] truncate">
                            {user.name}
                            {isExisting && <span className="ml-2 text-xs text-[#bfbfbf] font-normal">(已加入)</span>}
                          </span>
                          <span className="text-xs text-[#8c8c8c] truncate">{user.email}</span>
                        </div>
                      </div>
                    );
                  }}
                </VList>
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Empty
                    image={<SearchOutlined style={{ fontSize: 64, color: '#bae7ff' }} />}
                    description={<span className="text-[#8c8c8c]">{searchKeyword ? '未找到相关用户' : '输入关键字搜索'}</span>}
                  />
                </div>
              )}
            </div>
          </div>

          {/* 右侧：已选择 */}
          <div className="flex-1 p-4 flex flex-col bg-white overflow-hidden">
            <div className="text-[#8c8c8c] mb-4 flex justify-between items-center">
              <span>已选择：{selectedUsers.length}</span>
              {selectedUsers.length > 0 && (
                <Button type="link" size="small" onClick={() => setSelectedUsers([])} className="p-0 text-xs">
                  清空
                </Button>
              )}
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
              {selectedUsers.length > 0 ? (
                <List
                  dataSource={selectedUsers}
                  renderItem={(user) => (
                    <div key={user.id} className="flex items-center px-2 py-2 mb-1 group">
                      <Avatar size={28} className="bg-[#8d6e63] mr-3 uppercase flex-shrink-0">{user.avatar || user.name[0]}</Avatar>
                      <div className="flex flex-col flex-1 overflow-hidden">
                        <span className="text-sm text-[#262626] truncate">{user.name}</span>
                      </div>
                      <CloseOutlined 
                        className="text-[#bfbfbf] hover:text-[#ff4d4f] cursor-pointer text-xs ml-2 opacity-0 group-hover:opacity-100 transition-opacity" 
                        onClick={() => toggleUserSelection(user)}
                      />
                    </div>
                  )}
                />
              ) : (
                <div className="h-full flex items-center justify-center">
                  <Empty
                    image={false}
                    description={<span className="text-[#8c8c8c]">暂无选中成员</span>}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default PermissionSettings;

