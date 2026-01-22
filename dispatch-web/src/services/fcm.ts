import { initializeFirebase, getFcmToken, onForegroundMessage } from '../config/firebase';
import client from '../api/client';

class FcmService {
  private token: string | null = null;
  private initialized = false;

  // FCM 초기화
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Service Worker 등록 확인
      if (!('serviceWorker' in navigator)) {
        console.log('Service Worker not supported');
        return;
      }

      // 알림 권한 확인
      if (!('Notification' in window)) {
        console.log('Notifications not supported');
        return;
      }

      // Firebase 초기화
      initializeFirebase();

      this.initialized = true;
      console.log('FCM service initialized');
    } catch (error) {
      console.error('FCM initialization error:', error);
    }
  }

  // 알림 권한 요청
  async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    } catch (error) {
      console.error('Permission request error:', error);
      return false;
    }
  }

  // FCM 토큰 가져오기
  async getToken(): Promise<string | null> {
    try {
      const hasPermission = await this.requestPermission();
      if (!hasPermission) {
        console.log('Notification permission denied');
        return null;
      }

      this.token = await getFcmToken();
      return this.token;
    } catch (error) {
      console.error('Get token error:', error);
      return null;
    }
  }

  // 서버에 토큰 등록
  async registerToken(): Promise<void> {
    try {
      const token = await this.getToken();
      if (!token) {
        console.log('No FCM token to register');
        return;
      }

      await client.post('/devices/token', {
        token,
        deviceType: 'WEB',
      });
      console.log('FCM token registered to server');
    } catch (error) {
      console.error('Token registration error:', error);
    }
  }

  // 서버에서 토큰 삭제
  async unregisterToken(): Promise<void> {
    try {
      if (!this.token) return;

      await client.delete('/devices/token', {
        params: { token: this.token },
      });
      console.log('FCM token unregistered from server');
    } catch (error) {
      console.error('Token unregistration error:', error);
    }
  }

  // 포그라운드 메시지 리스너 설정
  onMessage(callback: (payload: any) => void): () => void {
    return onForegroundMessage(callback);
  }
}

export const fcmService = new FcmService();
export default fcmService;
