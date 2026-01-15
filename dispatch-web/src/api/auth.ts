import client from './client';
import { ApiResponse, AuthResponse, User } from '../types';

export const login = async (email: string, password: string): Promise<ApiResponse<AuthResponse>> => {
  const response = await client.post('/auth/login', { email, password });
  return response.data;
};

export const register = async (data: {
  email: string;
  password: string;
  name: string;
  phone: string;
  role: string;
}): Promise<ApiResponse<AuthResponse>> => {
  const response = await client.post('/auth/register', data);
  return response.data;
};

export const getProfile = async (): Promise<ApiResponse<{ user: User }>> => {
  const response = await client.get('/drivers/profile');
  return response.data;
};
