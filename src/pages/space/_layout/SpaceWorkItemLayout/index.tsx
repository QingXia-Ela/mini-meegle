import { HomeFilled, ReloadOutlined, PlusOutlined, SettingFilled } from '@ant-design/icons';
import { Select, Spin, Button, Empty } from 'antd';
import { Outlet, useNavigate, useParams, useLocation } from 'react-router';
import { useState, useEffect } from 'react';
import SidebarSelectItem from './components/SidebarSelectItem';
import CreateSpaceModal from './components/CreateSpaceModal';
import useWorkspaceList from './hooks/useWorkspaceList';
import defaultSpaceIcon from './assets/defaultSpaceIcon.png';

interface Space {
  id: string;
  name: string;
  icon?: string;
}

interface WorkItem {
  id: string;
  name: string;
  icon?: string;
  sid: string;
}

function SpaceWorkItemLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams<{ spaceId?: string; workItemId?: string }>();
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | undefined>(
    params.spaceId,
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const {
    spaces,
    spacesLoading,
    spacesError,
    requestSpaces,
    workItems,
    workItemsLoading,
    workItemsError,
    fetchWorkItems,
  } = useWorkspaceList();

  // 判断路由是否激活
  const isRouteActive = (path: string) => {
    return location.pathname.startsWith(path);
  };

  // 当选择空间时，获取工作项列表
  useEffect(() => {
    if (selectedSpaceId) {
      fetchWorkItems(selectedSpaceId);
    }
  }, [selectedSpaceId]);

  // 处理空间选择变化
  const handleSpaceChange = (value: string) => {
    setSelectedSpaceId(value);
    // 导航到空间概览页
    navigate(`/space/${value}/overview`);
  };

  // 处理工作项点击
  const handleWorkItemClick = (workItemId: string) => {
    if (selectedSpaceId) {
      navigate(`/space/${selectedSpaceId}/${workItemId}`);
    }
  };

  // 重试获取空间列表
  const handleRetrySpaces = () => {
    requestSpaces();
  };

  // 重试获取工作项列表
  const handleRetryWorkItems = () => {
    if (selectedSpaceId) {
      fetchWorkItems(selectedSpaceId);
    }
  };

  // 处理创建空间成功
  const handleCreateSpaceSuccess = () => {
    requestSpaces();
  };

  // 获取空间图标（base64 或默认图标）
  const getSpaceIcon = (space: Space) => {
    if (space.icon) {
      // 如果是 base64 格式
      if (space.icon.startsWith('data:image')) {
        return space.icon;
      }
      // 如果是 URL
      return space.icon;
    }
    return defaultSpaceIcon;
  };

  // 将空间数据转换为 Select 的 options
  const spaceOptions = spaces
    ? (spaces as Space[]).map((space) => ({
        value: space.id,
        label: (
          <div className="flex items-center gap-2">
            <img
              src={getSpaceIcon(space)}
              alt=""
              className="w-5 h-5 rounded-sm object-cover flex-shrink-0"
            />
            <span>{space.name}</span>
          </div>
        ),
        icon: getSpaceIcon(space),
        name: space.name,
      }))
    : [];

  return (
    <div className="w-full h-full flex">
      <div className="w-60 h-full p-4 border-r border-[#cacbcd] overflow-y-auto">
        {/* 空间选择器 */}
        <div className="mb-4">
          <Select
            className="w-full"
            size="large"
            placeholder="选择一个工作空间"
            value={selectedSpaceId}
            onChange={handleSpaceChange}
            loading={spacesLoading}
            notFoundContent={
              spacesError ? (
                <div className="py-4 text-center">
                  <div className="text-red-500 mb-2">加载失败</div>
                  <Button
                    size="small"
                    icon={<ReloadOutlined />}
                    onClick={handleRetrySpaces}
                  >
                    重试
                  </Button>
                </div>
              ) : spacesLoading ? (
                <Spin size="small" />
              ) : (
                <Empty description="暂无空间" />
              )
            }
            options={spaceOptions}
            optionRender={(option) => (
              <div className="flex items-center gap-2">
                <img
                  src={option.data.icon}
                  alt=""
                  className="w-5 h-5 rounded-sm object-cover flex-shrink-0"
                />
                <span>{option.data.name}</span>
              </div>
            )}
            optionLabelProp="label"
            dropdownRender={(menu) => (
              <>
                {menu}
                <div className="border-t border-gray-200 p-2">
                  <Button
                    type="text"
                    block
                    icon={<PlusOutlined />}
                    onClick={() => setCreateModalOpen(true)}
                  >
                    新建空间
                  </Button>
                </div>
              </>
            )}
          />
        </div>

        {/* 创建空间弹窗 */}
        <CreateSpaceModal
          open={createModalOpen}
          onCancel={() => setCreateModalOpen(false)}
          onSuccess={handleCreateSpaceSuccess}
        />

        {/* 工作项列表 */}
        {selectedSpaceId && (
          <>
            <div className="text-gray-400 my-4">工作项</div>
            {workItemsLoading ? (
              <div className="flex justify-center py-8">
                <Spin />
              </div>
            ) : workItemsError ? (
              <div className="py-4 text-center">
                <div className="text-red-500 mb-2">加载失败</div>
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  onClick={handleRetryWorkItems}
                >
                  重试
                </Button>
              </div>
            ) : workItems && workItems.length > 0 ? (
              <div className="space-y-2">
                {(workItems as WorkItem[]).map((workItem) => (
                  <SidebarSelectItem
                    key={workItem.id}
                    active={isRouteActive(
                      `/space/${selectedSpaceId}/${workItem.id}`,
                    )}
                    onClick={() => handleWorkItemClick(workItem.id)}
                    icon={
                      <HomeFilled
                        style={{ color: '#fff', fontSize: '12px' }}
                      />
                    }
                    label={workItem.name}
                  />
                ))}
              </div>
            ) : (
              <Empty description="暂无工作项" />
            )}
          </>
        )}

        {/* 功能菜单 */}
        {selectedSpaceId && (
          <>
            <div className="text-gray-400 my-4">功能</div>
            <div className="space-y-2">
              <SidebarSelectItem
                active={isRouteActive(`/space/${selectedSpaceId}/overview`)}
                onClick={() => navigate(`/space/${selectedSpaceId}/overview`)}
                icon={
                  <HomeFilled style={{ color: '#fff', fontSize: '12px' }} />
                }
                label="空间主页"
              />
              <SidebarSelectItem
                active={isRouteActive(`/space/${selectedSpaceId}/settings`)}
                onClick={() => navigate(`/space/${selectedSpaceId}/settings`)}
                iconBackgroundColor='bg-[#6b7280]'
                icon={
                  <SettingFilled style={{ color: '#fff', fontSize: '12px' }} />
                }
                label="空间设置"
              />
            </div>
          </>
        )}
      </div>
      <div className="flex-1 max-h-screen max-w-[calc(100vw-20rem)] flex flex-col">
        <Outlet />
      </div>
    </div>
  );
}

export default SpaceWorkItemLayout;