import { create } from 'zustand';
import type { Notification } from '@shared/types/api.types';

interface NotificationState {
  unreadCount:    number;
  notifications:  Notification[];

  setUnreadCount: (count: number) => void;
  addNotification:(notification: Notification) => void;
  markRead:       (id: string) => void;
  markAllRead:    () => void;
  setNotifications:(notifications: Notification[]) => void;
}

export const useNotificationStore = create<NotificationState>()((set) => ({
  unreadCount:    0,
  notifications:  [],

  setUnreadCount: (unreadCount) => set({ unreadCount }),

  addNotification: (notification) =>
    set((state) => ({
      notifications: [notification, ...state.notifications],
      unreadCount:   state.unreadCount + (notification.isRead ? 0 : 1),
    })),

  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, isRead: true } : n,
      ),
      unreadCount: Math.max(0, state.unreadCount - 1),
    })),

  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount:   0,
    })),

  setNotifications: (notifications) =>
    set({
      notifications,
      unreadCount: notifications.filter((n) => !n.isRead).length,
    }),
}));
