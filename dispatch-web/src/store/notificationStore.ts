import { create } from 'zustand';
import type { WebSocketMessage, DispatchNotification, LocationUpdate } from '../services/websocket';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  data?: unknown;
  timestamp: Date;
  read: boolean;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isConnected: boolean;
  locationUpdates: Map<number, LocationUpdate>; // dispatchId -> latest location

  // Actions
  addNotification: (wsMessage: WebSocketMessage) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  setConnected: (connected: boolean) => void;
  updateLocation: (location: LocationUpdate) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isConnected: false,
  locationUpdates: new Map(),

  addNotification: (wsMessage: WebSocketMessage) => {
    const notification: Notification = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: wsMessage.type,
      title: wsMessage.title,
      message: wsMessage.message,
      data: wsMessage.data,
      timestamp: new Date(wsMessage.timestamp),
      read: false,
    };

    set((state) => ({
      notifications: [notification, ...state.notifications].slice(0, 100), // 최대 100개
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: (id: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      if (!notification || notification.read) return state;

      return {
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };
    });
  },

  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },

  removeNotification: (id: string) => {
    set((state) => {
      const notification = state.notifications.find((n) => n.id === id);
      const wasUnread = notification && !notification.read;

      return {
        notifications: state.notifications.filter((n) => n.id !== id),
        unreadCount: wasUnread ? Math.max(0, state.unreadCount - 1) : state.unreadCount,
      };
    });
  },

  clearAll: () => {
    set({ notifications: [], unreadCount: 0 });
  },

  setConnected: (connected: boolean) => {
    set({ isConnected: connected });
  },

  updateLocation: (location: LocationUpdate) => {
    set((state) => {
      const newMap = new Map(state.locationUpdates);
      newMap.set(location.dispatchId, location);
      return { locationUpdates: newMap };
    });
  },
}));
