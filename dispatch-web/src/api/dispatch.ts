import client from './client';
import { ApiResponse, Dispatch, CreateDispatchRequest } from '../types';

export const getMyDispatches = async (): Promise<ApiResponse<Dispatch[]>> => {
  const response = await client.get('/dispatches/my');
  return response.data;
};

export const getAllDispatches = async (): Promise<ApiResponse<Dispatch[]>> => {
  const response = await client.get('/dispatches');
  return response.data;
};

export const getDispatch = async (id: number): Promise<ApiResponse<Dispatch>> => {
  const response = await client.get(`/dispatches/${id}`);
  return response.data;
};

export const createDispatch = async (data: CreateDispatchRequest): Promise<ApiResponse<Dispatch>> => {
  const response = await client.post('/dispatches', data);
  return response.data;
};

export const cancelDispatch = async (id: number): Promise<ApiResponse<void>> => {
  const response = await client.delete(`/dispatches/${id}`);
  return response.data;
};
