import { Client, IMessage, StompSubscription } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

export type MessageType =
  | 'NEW_DISPATCH'
  | 'DISPATCH_ACCEPTED'
  | 'DISPATCH_ARRIVED'
  | 'DISPATCH_COMPLETED'
  | 'DISPATCH_CANCELLED'
  | 'DRIVER_APPROVED'
  | 'DRIVER_REJECTED'
  | 'LOCATION_UPDATE'
  | 'SYSTEM_NOTICE';

export interface WebSocketMessage<T = unknown> {
  type: MessageType;
  title: string;
  message: string;
  data: T;
  timestamp: string;
}

export interface DispatchNotification {
  dispatchId: number;
  siteAddress: string;
  siteDetail?: string;
  latitude: number;
  longitude: number;
  workDate: string;
  workTime: string;
  estimatedHours?: number;
  equipmentType: string;
  price?: number;
  priceNegotiable?: boolean;
  status: string;
  driverId?: number;
  driverName?: string;
  driverPhone?: string;
  vehicleNumber?: string;
}

export interface LocationUpdate {
  driverId: number;
  driverName: string;
  dispatchId: number;
  latitude: number;
  longitude: number;
  heading?: number;
  speed?: number;
  timestamp: string;
}

type MessageHandler<T = unknown> = (message: WebSocketMessage<T>) => void;

class WebSocketService {
  private client: Client | null = null;
  private subscriptions: Map<string, StompSubscription> = new Map();
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 3000;

  connect(token: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.client?.connected) {
        resolve();
        return;
      }

      const wsUrl = import.meta.env.VITE_WS_URL || 'http://localhost:8082/ws';

      this.client = new Client({
        webSocketFactory: () => new SockJS(wsUrl),
        connectHeaders: {
          Authorization: `Bearer ${token}`,
        },
        debug: (str) => {
          if (import.meta.env.DEV) {
            console.log('[WebSocket]', str);
          }
        },
        reconnectDelay: this.reconnectDelay,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('[WebSocket] Connected');
          this.reconnectAttempts = 0;
          this.subscribeToDefaultTopics();
          resolve();
        },
        onStompError: (frame) => {
          console.error('[WebSocket] STOMP error:', frame.headers['message']);
          reject(new Error(frame.headers['message']));
        },
        onDisconnect: () => {
          console.log('[WebSocket] Disconnected');
        },
        onWebSocketClose: () => {
          console.log('[WebSocket] Connection closed');
          this.reconnectAttempts++;
          if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('[WebSocket] Max reconnect attempts reached');
          }
        },
      });

      this.client.activate();
    });
  }

  disconnect(): void {
    if (this.client?.connected) {
      this.subscriptions.forEach((sub) => sub.unsubscribe());
      this.subscriptions.clear();
      this.client.deactivate();
      this.client = null;
    }
  }

  private subscribeToDefaultTopics(): void {
    // 새 배차 알림 (브로드캐스트)
    this.subscribe('/topic/dispatches');

    // 시스템 공지 (브로드캐스트)
    this.subscribe('/topic/notices');

    // 개인 알림
    this.subscribe('/user/queue/notifications');

    // 위치 업데이트
    this.subscribe('/user/queue/location');
  }

  private subscribe(destination: string): void {
    if (!this.client?.connected) {
      console.warn('[WebSocket] Not connected, cannot subscribe to:', destination);
      return;
    }

    if (this.subscriptions.has(destination)) {
      return;
    }

    const subscription = this.client.subscribe(destination, (message: IMessage) => {
      this.handleMessage(destination, message);
    });

    this.subscriptions.set(destination, subscription);
  }

  private handleMessage(destination: string, message: IMessage): void {
    try {
      const body: WebSocketMessage = JSON.parse(message.body);

      // 목적지별 핸들러 호출
      const handlers = this.messageHandlers.get(destination);
      if (handlers) {
        handlers.forEach((handler) => handler(body));
      }

      // 메시지 타입별 핸들러 호출
      const typeHandlers = this.messageHandlers.get(body.type);
      if (typeHandlers) {
        typeHandlers.forEach((handler) => handler(body));
      }

      // 전역 핸들러 호출
      const globalHandlers = this.messageHandlers.get('*');
      if (globalHandlers) {
        globalHandlers.forEach((handler) => handler(body));
      }
    } catch (error) {
      console.error('[WebSocket] Failed to parse message:', error);
    }
  }

  onMessage<T = unknown>(key: string, handler: MessageHandler<T>): () => void {
    if (!this.messageHandlers.has(key)) {
      this.messageHandlers.set(key, new Set());
    }
    this.messageHandlers.get(key)!.add(handler as MessageHandler);

    // 구독 해제 함수 반환
    return () => {
      this.messageHandlers.get(key)?.delete(handler as MessageHandler);
    };
  }

  // 위치 업데이트 전송 (기사용)
  sendLocationUpdate(latitude: number, longitude: number, heading?: number, speed?: number): void {
    if (!this.client?.connected) {
      console.warn('[WebSocket] Not connected, cannot send location');
      return;
    }

    this.client.publish({
      destination: '/app/location',
      body: JSON.stringify({
        latitude,
        longitude,
        heading,
        speed,
        timestamp: new Date().toISOString(),
      }),
    });
  }

  // Ping 전송
  ping(): void {
    if (!this.client?.connected) {
      return;
    }

    this.client.publish({
      destination: '/app/ping',
      body: '',
    });
  }

  isConnected(): boolean {
    return this.client?.connected ?? false;
  }
}

export const websocketService = new WebSocketService();
