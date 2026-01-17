import client from './client';
import { ApiResponse, DriverRating } from '../types';

export interface RatingRequest {
  rating: number;
  comment?: string;
}

export const createRating = async (dispatchId: number, data: RatingRequest): Promise<ApiResponse<DriverRating>> => {
  const response = await client.post(`/dispatches/${dispatchId}/rating`, data);
  return response.data;
};

export const getRatingByDispatch = async (dispatchId: number): Promise<ApiResponse<DriverRating>> => {
  const response = await client.get(`/dispatches/${dispatchId}/rating`);
  return response.data;
};

export const getRatingsByDriver = async (driverId: number): Promise<ApiResponse<DriverRating[]>> => {
  const response = await client.get(`/drivers/${driverId}/ratings`);
  return response.data;
};
