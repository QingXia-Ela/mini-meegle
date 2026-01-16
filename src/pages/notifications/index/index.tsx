import { NotificationFilled } from '@ant-design/icons';
import { Button, Empty, Spin, Tabs } from 'antd';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { apiGetNoticeList, apiMarkAllNoticesRead, apiMarkNoticeRead } from './api';
import type { NoticeItem } from './api';
import MentionMeNotification from './components/Message/MentionMeNotification';
import NotificationMessage from './components/Message/NotificationMessage';
import { useNoticeBadgeStore } from '@/store/noticeBadge';

function NoticeIndexPage() {
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [activeTab, setActiveTab] = useState('1');
  const [markingIds, setMarkingIds] = useState<Set<number>>(() => new Set());
  const [markingAll, setMarkingAll] = useState(false);
  const loadingRef = useRef(false);
  const refreshUnreadCount = useNoticeBadgeStore((state) => state.refreshUnreadCount);

  const PAGE_SIZE = 20;
  const MENTION_TYPE = 'task_comments_mention';

  const fetchNotices = useCallback(async (offset: number, append: boolean) => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await apiGetNoticeList({ offset, limit: PAGE_SIZE });
      setNotices(prev => (append ? [...prev, ...res.items] : res.items));
      setHasMore(res.hasMore ?? offset + res.items.length < res.total);
    } catch (error) {
      console.error('Failed to fetch notices:', error);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, []);

  useEffect(() => {
    fetchNotices(0, false);
  }, [fetchNotices]);

  useEffect(() => {
    refreshUnreadCount();
  }, [refreshUnreadCount]);

  const handleMarkRead = useCallback(async (id: number) => {
    if (markingIds.has(id)) return;
    setMarkingIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    try {
      await apiMarkNoticeRead(id);
      setNotices((prev) =>
        prev.map((item) => (item.id === id ? { ...item, isRead: true } : item)),
      );
      refreshUnreadCount();
    } catch (error) {
      console.error('Failed to mark notice as read:', error);
    } finally {
      setMarkingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }, [markingIds]);

  const hasUnread = useMemo(() => notices.some((item) => !item.isRead), [notices]);

  const handleMarkAllRead = useCallback(async () => {
    if (markingAll || !hasUnread) return;
    setMarkingAll(true);
    try {
      await apiMarkAllNoticesRead();
      setNotices((prev) => prev.map((item) => ({ ...item, isRead: true })));
      refreshUnreadCount();
    } catch (error) {
      console.error('Failed to mark all notices as read:', error);
    } finally {
      setMarkingAll(false);
    }
  }, [hasUnread, markingAll]);

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      if (loadingRef.current || !hasMore) return;
      const { scrollHeight, scrollTop, clientHeight } = e.currentTarget;
      if (scrollHeight - scrollTop <= clientHeight + 80) {
        fetchNotices(notices.length, true);
      }
    },
    [fetchNotices, hasMore, notices.length],
  );

  const filteredNotices = useMemo(() => {
    if (activeTab === '2') {
      return notices.filter((item) => !item.isRead);
    }
    if (activeTab === '3') {
      return notices.filter((item) => item.type === MENTION_TYPE);
    }
    return notices;
  }, [activeTab, notices]);

  return (
    <div className='h-full w-full flex flex-col'>
      <header className="flex py-3 px-5 w-full bg-white border-b border-[#cacbcd] items-center">
        <div className="bg-[#5789ff] w-8 h-8 flex items-center justify-center rounded-lg">
          <NotificationFilled style={{ color: '#fff' }} />
        </div>
        <span className='ml-3 text-lg font-bold'>通知</span>
      </header>
      <div className="flex w-[65%] mx-auto items-center justify-between">
        <Tabs
          className="flex-1"
          size="large"
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { label: '全部通知', key: '1' },
            { label: '未读通知', key: '2' },
            { label: '@我', key: '3' },
          ]}
        />
        <Button
          type="text"
          className="ml-4"
          disabled={!hasUnread || markingAll}
          onClick={handleMarkAllRead}
        >
          {markingAll ? '标记中...' : '全部标为已读'}
        </Button>
      </div>
      <div className="flex-1 flex flex-col w-[65%] mx-auto min-h-0">
        <div className="flex-1 overflow-auto" onScroll={handleScroll}>
          <div className="flex flex-col space-y-3 py-3">
            {filteredNotices.map((notice) => {
              if (notice.type === MENTION_TYPE) {
                const payload = notice.payload || {};
                const taskId = payload.taskId ? String(payload.taskId) : '';
                const taskName = taskId ? `任务 #${taskId}` : '任务';
                return (
                  <MentionMeNotification
                    key={notice.id}
                    senderName={notice.sender?.name || '未知用户'}
                    senderAvatar={notice.sender?.avatar || undefined}
                    taskName={taskName}
                    commentContent={notice.content}
                    time={notice.createdAt}
                    spaceId={payload.spaceId || ''}
                    workItemId={payload.workItemId || ''}
                    taskId={taskId}
                    isRead={notice.isRead}
                    isMarkingRead={markingIds.has(notice.id)}
                    onMarkRead={() => handleMarkRead(notice.id)}
                  />
                );
              }

              return (
                <NotificationMessage
                  key={notice.id}
                  avatarUrl={notice.sender?.avatar || undefined}
                  userName={notice.sender?.name || '系统'}
                  title="通知"
                  content={notice.content}
                  time={notice.createdAt}
                  source="系统"
                />
              );
            })}
            {!loading && filteredNotices.length === 0 && (
              <div className="py-12">
                <Empty description="暂无通知" />
              </div>
            )}
          </div>

          {loading && (
            <div className="py-4 flex justify-center">
              <Spin />
            </div>
          )}
          {!loading && hasMore === false && notices.length > 0 && (
            <div className="py-4 text-center text-xs text-gray-400">没有更多了</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NoticeIndexPage;