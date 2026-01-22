import client from './client';
import { ApiResponse, Company } from '../types';

export interface CompanyRegisterRequest {
  name: string;
  businessNumber: string;
  representative: string;
  address?: string;
  phone?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  password: string;
}

export const registerCompany = async (data: CompanyRegisterRequest): Promise<ApiResponse<Company>> => {
  const response = await client.post('/companies/register', data);
  return response.data;
};

export const getMyCompany = async (): Promise<ApiResponse<Company>> => {
  const response = await client.get('/companies/my');
  return response.data;
};

export const uploadBusinessLicense = async (file: File): Promise<ApiResponse<Company>> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await client.post('/companies/my/business-license', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};
