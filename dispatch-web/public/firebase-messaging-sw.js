// Firebase 서비스 워커 (백그라운드 푸시 알림 처리)
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Firebase 설정 (빌드 시 환경변수로 교체 필요)
firebase.initializeApp({
  apiKey: self.FIREBASE_API_KEY || '',
  authDomain: self.FIREBASE_AUTH_DOMAIN || '',
  projectId: self.FIREBASE_PROJECT_ID || '',
  storageBucket: self.FIREBASE_STORAGE_BUCKET || '',
  messagingSenderId: self.FIREBASE_MESSAGING_SENDER_ID || '',
  appId: self.FIREBASE_APP_ID || '',
});

const messaging = firebase.messaging();

// 백그라운드 메시지 수신 처리
messaging.onBackgroundMessage((payload) => {
  console.log('백그라운드 메시지 수신:', payload);

  const notificationTitle = payload.notification?.title || '새 알림';
  const notificationOptions = {
    body: payload.notification?.body || '',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: payload.data?.type || 'default',
    data: payload.data,
    requireInteraction: true,
    actions: [
      { action: 'open', title: '열기' },
      { action: 'close', title: '닫기' },
    ],
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// 알림 클릭 처리
self.addEventListener('notificationclick', (event) => {
  console.log('알림 클릭:', event);

  event.notification.close();

  if (event.action === 'close') {
    return;
  }

  // 앱 열기 또는 포커스
  const urlToOpen = getUrlFromNotificationData(event.notification.data);

  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // 이미 열려있는 창 찾기
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && 'focus' in client) {
            client.focus();
            if (urlToOpen) {
              client.navigate(urlToOpen);
            }
            return;
          }
        }
        // 새 창 열기
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen || '/');
        }
      })
  );
});

// 알림 데이터에서 URL 생성
function getUrlFromNotificationData(data) {
  if (!data) return '/';

  switch (data.type) {
    case 'DISPATCH':
      return `/dispatches/${data.dispatchId}`;
    case 'DRIVER_APPROVED':
    case 'DRIVER_REJECTED':
      return '/drivers';
    default:
      return '/';
  }
}
