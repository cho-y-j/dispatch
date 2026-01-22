import { useEffect, useCallback } from 'react';
import { fcmService } from '../services/fcm';
import { useNotificationStore } from '../store/notificationStore';
import type { WebSocketMessage } from '../services/websocket';

export const useFcm = () => {
  const addNotification = useNotificationStore((state) => state.addNotification);

  // FCM 초기화
  const initializeFcm = useCallback(async () => {
    await fcmService.initialize();
  }, []);

  // 토큰 등록 (로그인 후)
  const registerToken = useCallback(async () => {
    await fcmService.registerToken();
  }, []);

  // 토큰 해제 (로그아웃 시)
  const unregisterToken = useCallback(async () => {
    await fcmService.unregisterToken();
  }, []);

  // 포그라운드 메시지 리스너 설정
  useEffect(() => {
    const unsubscribe = fcmService.onMessage((payload) => {
      // 알림 스토어에 추가 (WebSocketMessage 형식으로 변환)
      if (payload.notification) {
        const wsMessage: WebSocketMessage = {
          type: payload.data?.type || 'SYSTEM_NOTICE',
          title: payload.notification.title || '알림',
          message: payload.notification.body || '',
          data: payload.data,
          timestamp: new Date().toISOString(),
        };
        addNotification(wsMessage);
      }

      // 브라우저 알림 표시 (포그라운드)
      if (Notification.permission === 'granted' && payload.notification) {
        new Notification(payload.notification.title || '알림', {
          body: payload.notification.body,
          icon: '/icons/icon-192x192.png',
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, [addNotification]);

  return {
    initializeFcm,
    registerToken,
    unregisterToken,
  };
};

export default useFcm;
