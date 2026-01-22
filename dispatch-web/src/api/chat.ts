import client from './client';
import { ApiResponse, ChatMessage } from '../types';

// 채팅 메시지 목록 조회
export const getMessages = async (dispatchId: number): Promise<ApiResponse<ChatMessage[]>> => {
  const response = await client.get(`/dispatches/${dispatchId}/chat/messages`);
  return response.data;
};

// 메시지 전송
export const sendMessage = async (
  dispatchId: number,
  message: string,
  imageUrl?: string
): Promise<ApiResponse<ChatMessage>> => {
  const response = await client.post(`/dispatches/${dispatchId}/chat/messages`, {
    message,
    imageUrl,
  });
  return response.data;
};

// 메시지 읽음 처리
export const markAsRead = async (dispatchId: number): Promise<ApiResponse<void>> => {
  const response = await client.put(`/dispatches/${dispatchId}/chat/messages/read`);
  return response.data;
};

// 읽지 않은 메시지 수 조회
export const getUnreadCount = async (dispatchId: number): Promise<ApiResponse<number>> => {
  const response = await client.get(`/dispatches/${dispatchId}/chat/unread-count`);
  return response.data;
};
