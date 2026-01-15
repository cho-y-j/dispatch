import client from './client';
import { ApiResponse, Driver } from '../types';

export const getPendingDrivers = async (): Promise<ApiResponse<Driver[]>> => {
  const response = await client.get('/admin/drivers/pending');
  return response.data;
};

export const approveDriver = async (id: number): Promise<ApiResponse<void>> => {
  const response = await client.post(`/admin/drivers/${id}/approve`);
  return response.data;
};

export const rejectDriver = async (id: number, reason?: string): Promise<ApiResponse<void>> => {
  const response = await client.post(`/admin/drivers/${id}/reject`, { reason });
  return response.data;
};

export const getAllDrivers = async (): Promise<ApiResponse<Driver[]>> => {
  const response = await client.get('/admin/drivers');
  return response.data;
};
