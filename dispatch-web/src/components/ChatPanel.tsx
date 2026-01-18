import { useEffect, useState, useRef } from 'react';
import { ChatMessage, SenderType } from '../types';
import { getMessages, sendMessage, markAsRead } from '../api/chat';
import { Send, MessageCircle, X } from 'lucide-react';
import dayjs from 'dayjs';

interface ChatPanelProps {
  dispatchId: number;
  currentUserType: SenderType;
  onClose?: () => void;
}

export default function ChatPanel({ dispatchId, currentUserType, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 메시지 목록 조회
  const fetchMessages = async () => {
    try {
      const response = await getMessages(dispatchId);
      if (response.success && response.data) {
        setMessages(response.data);
        // 읽음 처리
        await markAsRead(dispatchId);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMessages();
    // 5초마다 메시지 새로고침 (폴링)
    const interval = setInterval(fetchMessages, 5000);
    return () => clearInterval(interval);
  }, [dispatchId]);

  // 새 메시지가 오면 스크롤 아래로
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 메시지 전송
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || sending) return;

    setSending(true);
    try {
      const response = await sendMessage(dispatchId, newMessage.trim());
      if (response.success && response.data) {
        setMessages((prev) => [...prev, response.data!]);
        setNewMessage('');
        inputRef.current?.focus();
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setSending(false);
    }
  };

  const isMyMessage = (message: ChatMessage) => message.senderType === currentUserType;

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-lg">
      {/* 헤더 */}
      <div className="flex items-center justify-between px-4 py-3 border-b bg-blue-600 text-white rounded-t-lg">
        <div className="flex items-center gap-2">
          <MessageCircle size={20} />
          <span className="font-semibold">채팅</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="hover:bg-blue-700 p-1 rounded">
            <X size={20} />
          </button>
        )}
      </div>

      {/* 메시지 목록 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-400">
            <MessageCircle size={48} />
            <p className="mt-2">메시지가 없습니다</p>
            <p className="text-sm">첫 메시지를 보내보세요!</p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${isMyMessage(message) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg px-4 py-2 ${
                  isMyMessage(message)
                    ? 'bg-blue-600 text-white'
                    : 'bg-white border border-gray-200'
                }`}
              >
                {!isMyMessage(message) && (
                  <p className="text-xs text-gray-500 mb-1">{message.senderName}</p>
                )}
                <p className="whitespace-pre-wrap break-words">{message.message}</p>
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="첨부 이미지"
                    className="mt-2 rounded max-w-full"
                  />
                )}
                <p
                  className={`text-xs mt-1 ${
                    isMyMessage(message) ? 'text-blue-200' : 'text-gray-400'
                  }`}
                >
                  {dayjs(message.createdAt).format('HH:mm')}
                  {isMyMessage(message) && message.isRead && ' ✓'}
                </p>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 입력창 */}
      <form onSubmit={handleSend} className="p-3 border-t bg-white rounded-b-lg">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="메시지를 입력하세요..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-full focus:outline-none focus:border-blue-500"
            disabled={sending}
          />
          <button
            type="submit"
            disabled={!newMessage.trim() || sending}
            className="px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
}
