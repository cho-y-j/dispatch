import { useEffect, useCallback, useRef } from 'react';
import { websocketService, WebSocketMessage, LocationUpdate } from '../services/websocket';
import { useNotificationStore } from '../store/notificationStore';
import { useAuthStore } from '../store/authStore';

export function useWebSocket() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { addNotification, setConnected, updateLocation } = useNotificationStore();
  const cleanupRef = useRef<(() => void) | null>(null);

  const connect = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token || !isAuthenticated) return;

    try {
      await websocketService.connect(token);
      setConnected(true);

      // 전역 메시지 핸들러 등록
      const unsubscribe = websocketService.onMessage('*', (message: WebSocketMessage) => {
        // 위치 업데이트는 알림으로 추가하지 않음
        if (message.type === 'LOCATION_UPDATE') {
          updateLocation(message.data as LocationUpdate);
          return;
        }

        // 나머지 메시지는 알림으로 추가
        addNotification(message);

        // 브라우저 알림 표시
        if (Notification.permission === 'granted') {
          new Notification(message.title, {
            body: message.message,
            icon: '/favicon.ico',
          });
        }
      });

      cleanupRef.current = unsubscribe;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setConnected(false);
    }
  }, [isAuthenticated, addNotification, setConnected, updateLocation]);

  const disconnect = useCallback(() => {
    if (cleanupRef.current) {
      cleanupRef.current();
      cleanupRef.current = null;
    }
    websocketService.disconnect();
    setConnected(false);
  }, [setConnected]);

  // 인증 상태 변경시 연결/해제
  useEffect(() => {
    if (isAuthenticated) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [isAuthenticated, connect, disconnect]);

  // 브라우저 알림 권한 요청
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    isConnected: websocketService.isConnected(),
    connect,
    disconnect,
    sendLocationUpdate: websocketService.sendLocationUpdate.bind(websocketService),
  };
}
