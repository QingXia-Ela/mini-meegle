import { ReloadOutlined, StarFilled } from '@ant-design/icons';
import { Button, Empty, Spin } from 'antd';
import { useCallback, useEffect, useMemo, useState } from 'react';
import TaskDetailPage from '@/components/TaskDetailPage';
import defaultSpaceIcon from '@/pages/space/_layout/SpaceWorkItemLayout/assets/defaultSpaceIcon.png';
import SidebarSelectItem from '../_layout/components/SidebarSelectItem';
import {
  apiGetFavorites,
  apiGetMySpaces,
  apiGetTask,
  apiGetWorkItem,
  type FavoriteItem,
  type SpaceItem,
} from './api';

interface FavoriteDisplayItem {
  id: number;
  tid: number;
  workItemId: string;
  spaceId: string;
  spaceName: string;
  spaceIcon: string;
}

function FavoritesPage() {
  const [favorites, setFavorites] = useState<FavoriteDisplayItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const getSpaceIcon = (space?: SpaceItem) => {
    if (space?.icon) {
      if (space.icon.startsWith('data:image')) return space.icon;
      return space.icon;
    }
    return defaultSpaceIcon;
  };

  const buildFavorites = useCallback(
    async (favoriteList: FavoriteItem[], spaces: SpaceItem[]) => {
      const spaceMap = new Map(spaces.map((space) => [space.id, space]));
      const taskIds = Array.from(new Set(favoriteList.map((fav) => fav.tid)));
      const tasks = await Promise.all(
        taskIds.map((id) => apiGetTask(id).catch(() => null)),
      );
      const taskMap = new Map(
        tasks.filter((task) => task).map((task) => [task!.id, task!]),
      );
      const workItemIds = Array.from(
        new Set(tasks.filter((task) => task).map((task) => task!.wid)),
      );
      const workItems = await Promise.all(
        workItemIds.map((id) => apiGetWorkItem(id).catch(() => null)),
      );
      const workItemMap = new Map(
        workItems.filter((item) => item).map((item) => [item!.id, item!]),
      );

      return favoriteList
        .map((fav) => {
          const task = taskMap.get(fav.tid);
          const workItemId = task?.wid ?? '';
          const workItem = workItemId ? workItemMap.get(workItemId) : undefined;
          const spaceId = workItem?.sid ?? '';
          const space = spaceId ? spaceMap.get(spaceId) : undefined;

          if (!workItemId || !spaceId) return null;

          return {
            id: fav.id,
            tid: fav.tid,
            workItemId,
            spaceId,
            spaceName: space?.name ?? '未知空间',
            spaceIcon: getSpaceIcon(space),
          };
        })
        .filter((item): item is FavoriteDisplayItem => item !== null);
    },
    [],
  );

  const fetchFavorites = useCallback(async () => {
    setLoading(true);
    try {
      const [favoriteList, spaces] = await Promise.all([
        apiGetFavorites(),
        apiGetMySpaces(),
      ]);
      const items = await buildFavorites(favoriteList || [], spaces || []);
      setFavorites(items);
      setSelectedId((prev) => {
        if (prev && items.some((item) => item.id === prev)) {
          return prev;
        }
        return null;
      });
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      setFavorites([]);
      setSelectedId(null);
    } finally {
      setLoading(false);
    }
  }, [buildFavorites]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const selectedFavorite = useMemo(
    () => favorites.find((item) => item.id === selectedId) ?? null,
    [favorites, selectedId],
  );

  return (
    <div className="w-full h-full flex">
      <div className="w-60 h-full p-4 border-r border-[#cacbcd] overflow-y-auto">
        <div className="flex items-center mb-4 gap-2">
          <div className="rounded-xl h-7 w-7 bg-amber-400 flex justify-center items-center">
            <StarFilled style={{ color: 'white' }} />
          </div>
          <span className="font-bold flex-1">收藏</span>
          <Button
            size="small"
            type="text"
            icon={<ReloadOutlined />}
            onClick={fetchFavorites}
            disabled={loading}
          />
        </div>
        {loading ? (
          <div className="py-4 flex justify-center">
            <Spin />
          </div>
        ) : favorites.length === 0 ? (
          <div className="py-8">
            <Empty description="暂无收藏" />
          </div>
        ) : (
          <div className="space-y-2">
            {favorites.map((item) => (
              <SidebarSelectItem
                key={item.id}
                active={item.id === selectedId}
                onClick={() => setSelectedId(item.id)}
                icon={
                  <img
                    src={item.spaceIcon}
                    alt=""
                    className="w-5 h-5 rounded-sm object-cover"
                  />
                }
                iconBackgroundColor="bg-transparent"
                label={`任务 #${item.tid}`}
              />
            ))}
          </div>
        )}
      </div>
      <div className="flex-1 max-w-[calc(100vw-20rem)] min-w-0 flex flex-col">
        {selectedFavorite ? (
          <TaskDetailPage
            spaceId={selectedFavorite.spaceId}
            workItemId={selectedFavorite.workItemId}
            taskId={String(selectedFavorite.tid)}
            onClose={() => setSelectedId(null)}
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            {loading ? <Spin /> : <Empty description="暂无可展示的收藏任务" />}
          </div>
        )}
      </div>
    </div>
  );
}

export default FavoritesPage;