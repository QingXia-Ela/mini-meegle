import { create } from 'zustand';
import { apiGetUnreadCount } from '@/pages/notifications/index/api';

interface NoticeBadgeState {
  unreadCount: number;
  setUnreadCount: (count: number) => void;
  refreshUnreadCount: () => Promise<void>;
}

export const useNoticeBadgeStore = create<NoticeBadgeState>((set) => ({
  unreadCount: 0,
  setUnreadCount: (count: number) => set({ unreadCount: count }),
  refreshUnreadCount: async () => {
    try {
      const res = await apiGetUnreadCount();
      set({ unreadCount: res?.count ?? 0 });
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  },
}));
