import { useState, useRef, useEffect } from 'react';
import { Bell, Check, CheckCheck, Trash2, X, Wifi, WifiOff } from 'lucide-react';
import { useNotificationStore, Notification } from '../store/notificationStore';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import 'dayjs/locale/ko';

dayjs.extend(relativeTime);
dayjs.locale('ko');

function getNotificationIcon(type: string): string {
  switch (type) {
    case 'NEW_DISPATCH':
      return '🚗';
    case 'DISPATCH_ACCEPTED':
      return '✅';
    case 'DISPATCH_ARRIVED':
      return '📍';
    case 'DISPATCH_COMPLETED':
      return '🎉';
    case 'DISPATCH_CANCELLED':
      return '❌';
    case 'DRIVER_APPROVED':
      return '👍';
    case 'DRIVER_REJECTED':
      return '👎';
    case 'LOCATION_UPDATE':
      return '📌';
    case 'SYSTEM_NOTICE':
      return '📢';
    default:
      return '🔔';
  }
}

function NotificationItem({
  notification,
  onRead,
  onRemove,
}: {
  notification: Notification;
  onRead: () => void;
  onRemove: () => void;
}) {
  return (
    <div
      className={`p-3 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
        !notification.read ? 'bg-blue-50' : ''
      }`}
      onClick={onRead}
    >
      <div className="flex items-start gap-3">
        <span className="text-lg">{getNotificationIcon(notification.type)}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900 truncate">
              {notification.title}
            </p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove();
              }}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-sm text-gray-600 line-clamp-2">{notification.message}</p>
          <p className="text-xs text-gray-400 mt-1">
            {dayjs(notification.timestamp).fromNow()}
          </p>
        </div>
        {!notification.read && (
          <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2" />
        )}
      </div>
    </div>
  );
}

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { notifications, unreadCount, isConnected, markAsRead, markAllAsRead, removeNotification, clearAll } =
    useNotificationStore();

  // 외부 클릭시 닫기
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* 알림 버튼 */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
      >
        <Bell className="w-6 h-6" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* 드롭다운 */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
          {/* 헤더 */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-gray-900">알림</h3>
              {isConnected ? (
                <Wifi className="w-4 h-4 text-green-500" />
              ) : (
                <WifiOff className="w-4 h-4 text-red-500" />
              )}
            </div>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <CheckCheck className="w-4 h-4" />
                  모두 읽음
                </button>
              )}
              {notifications.length > 0 && (
                <button
                  onClick={clearAll}
                  className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
                >
                  <Trash2 className="w-4 h-4" />
                  모두 삭제
                </button>
              )}
            </div>
          </div>

          {/* 알림 목록 */}
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                <p>알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <NotificationItem
                  key={notification.id}
                  notification={notification}
                  onRead={() => markAsRead(notification.id)}
                  onRemove={() => removeNotification(notification.id)}
                />
              ))
            )}
          </div>

          {/* 연결 상태 */}
          <div className="p-2 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
              {isConnected ? (
                <>
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                  <span>실시간 연결됨</span>
                </>
              ) : (
                <>
                  <span className="w-2 h-2 bg-red-500 rounded-full" />
                  <span>연결 끊김</span>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
