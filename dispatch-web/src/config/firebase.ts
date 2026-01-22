import { initializeApp, FirebaseApp } from 'firebase/app';
import { getMessaging, Messaging, getToken, onMessage } from 'firebase/messaging';

// Firebase 설정 (환경 변수에서 가져옴)
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

let app: FirebaseApp | null = null;
let messaging: Messaging | null = null;

// Firebase 초기화
export const initializeFirebase = (): FirebaseApp | null => {
  try {
    if (!firebaseConfig.apiKey) {
      console.log('Firebase config not found, skipping initialization');
      return null;
    }
    app = initializeApp(firebaseConfig);
    console.log('Firebase initialized');
    return app;
  } catch (error) {
    console.error('Firebase initialization error:', error);
    return null;
  }
};

// Messaging 인스턴스 가져오기
export const getMessagingInstance = (): Messaging | null => {
  try {
    if (!app) {
      initializeFirebase();
    }
    if (app && !messaging) {
      messaging = getMessaging(app);
    }
    return messaging;
  } catch (error) {
    console.error('Failed to get messaging instance:', error);
    return null;
  }
};

// FCM 토큰 가져오기
export const getFcmToken = async (): Promise<string | null> => {
  try {
    const messagingInstance = getMessagingInstance();
    if (!messagingInstance) {
      console.log('Messaging not available');
      return null;
    }

    // VAPID 키 (Firebase 콘솔에서 가져옴)
    const vapidKey = import.meta.env.VITE_FIREBASE_VAPID_KEY;
    if (!vapidKey) {
      console.log('VAPID key not found');
      return null;
    }

    const token = await getToken(messagingInstance, { vapidKey });
    console.log('FCM Token:', token);
    return token;
  } catch (error) {
    console.error('Failed to get FCM token:', error);
    return null;
  }
};

// 포그라운드 메시지 리스너
export const onForegroundMessage = (callback: (payload: any) => void) => {
  const messagingInstance = getMessagingInstance();
  if (messagingInstance) {
    return onMessage(messagingInstance, (payload) => {
      console.log('Foreground message received:', payload);
      callback(payload);
    });
  }
  return () => {};
};

export { app, messaging };
