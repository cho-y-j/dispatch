import client from './client';
import {
  ApiResponse,
  Driver,
  Company,
  Warning,
  Suspension,
  DashboardStatistics,
  DriverStatistics,
  CompanyStatistics,
  SystemSetting,
  DriverGrade,
  WarningUserType,
  WarningType,
  SuspensionType,
} from '../types';

// ==================== 기사 관리 ====================

export const getAllDrivers = async (): Promise<ApiResponse<Driver[]>> => {
  const response = await client.get('/admin/drivers');
  return response.data;
};

export const getApprovedDrivers = async (): Promise<ApiResponse<Driver[]>> => {
  const response = await client.get('/admin/drivers/approved');
  return response.data;
};

export const getPendingDrivers = async (): Promise<ApiResponse<Driver[]>> => {
  const response = await client.get('/admin/drivers/pending');
  return response.data;
};

export const approveDriver = async (id: number): Promise<ApiResponse<Driver>> => {
  const response = await client.post(`/admin/drivers/${id}/approve`);
  return response.data;
};

export const rejectDriver = async (id: number, reason?: string): Promise<ApiResponse<Driver>> => {
  const response = await client.post(`/admin/drivers/${id}/reject`, null, { params: { reason } });
  return response.data;
};

export const updateDriverGrade = async (id: number, grade: DriverGrade, reason?: string): Promise<ApiResponse<Driver>> => {
  const response = await client.put(`/admin/drivers/${id}/grade`, { grade, reason });
  return response.data;
};

// ==================== 발주처 관리 ====================

export const getAllCompanies = async (): Promise<ApiResponse<Company[]>> => {
  const response = await client.get('/admin/companies');
  return response.data;
};

export const getPendingCompanies = async (): Promise<ApiResponse<Company[]>> => {
  const response = await client.get('/admin/companies/pending');
  return response.data;
};

export const getCompany = async (id: number): Promise<ApiResponse<Company>> => {
  const response = await client.get(`/admin/companies/${id}`);
  return response.data;
};

export interface CreateCompanyRequest {
  name: string;
  businessNumber: string;
  representative: string;
  address?: string;
  phone?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  password?: string;
}

export const createCompany = async (data: CreateCompanyRequest): Promise<ApiResponse<Company>> => {
  const response = await client.post('/admin/companies', data);
  return response.data;
};

export interface UpdateCompanyRequest {
  name?: string;
  representative?: string;
  address?: string;
  phone?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}

export const updateCompany = async (id: number, data: UpdateCompanyRequest): Promise<ApiResponse<Company>> => {
  const response = await client.put(`/admin/companies/${id}`, data);
  return response.data;
};

export const approveCompany = async (id: number): Promise<ApiResponse<Company>> => {
  const response = await client.post(`/admin/companies/${id}/approve`);
  return response.data;
};

export const rejectCompany = async (id: number, reason?: string): Promise<ApiResponse<Company>> => {
  const response = await client.post(`/admin/companies/${id}/reject`, null, { params: { reason } });
  return response.data;
};

export const deleteCompany = async (id: number): Promise<ApiResponse<void>> => {
  const response = await client.delete(`/admin/companies/${id}`);
  return response.data;
};

export const searchCompanies = async (keyword: string): Promise<ApiResponse<Company[]>> => {
  const response = await client.get('/admin/companies/search', { params: { keyword } });
  return response.data;
};

// ==================== 경고 관리 ====================

export const getAllWarnings = async (): Promise<ApiResponse<Warning[]>> => {
  const response = await client.get('/admin/warnings');
  return response.data;
};

export interface CreateWarningRequest {
  userId: number;
  userType: WarningUserType;
  type: WarningType;
  reason: string;
  dispatchId?: number;
}

export const createWarning = async (data: CreateWarningRequest): Promise<ApiResponse<Warning>> => {
  const response = await client.post('/admin/warnings', data);
  return response.data;
};

export const getWarningsByUser = async (userId: number, userType: WarningUserType): Promise<ApiResponse<Warning[]>> => {
  const response = await client.get(`/admin/warnings/user/${userId}`, { params: { userType } });
  return response.data;
};

// ==================== 정지 관리 ====================

export const getAllSuspensions = async (): Promise<ApiResponse<Suspension[]>> => {
  const response = await client.get('/admin/suspensions');
  return response.data;
};

export const getActiveSuspensions = async (): Promise<ApiResponse<Suspension[]>> => {
  const response = await client.get('/admin/suspensions/active');
  return response.data;
};

export interface CreateSuspensionRequest {
  userId: number;
  userType: WarningUserType;
  type: SuspensionType;
  reason: string;
  endDate?: string;
  days?: number;
}

export const createSuspension = async (data: CreateSuspensionRequest): Promise<ApiResponse<Suspension>> => {
  const response = await client.post('/admin/suspensions', data);
  return response.data;
};

export const liftSuspension = async (id: number): Promise<ApiResponse<Suspension>> => {
  const response = await client.delete(`/admin/suspensions/${id}`);
  return response.data;
};

// ==================== 통계 ====================

export const getDashboardStatistics = async (): Promise<ApiResponse<DashboardStatistics>> => {
  const response = await client.get('/admin/statistics/dashboard');
  return response.data;
};

export const getDriverStatistics = async (): Promise<ApiResponse<DriverStatistics[]>> => {
  const response = await client.get('/admin/statistics/drivers');
  return response.data;
};

export const getDriverStatisticsById = async (id: number): Promise<ApiResponse<DriverStatistics>> => {
  const response = await client.get(`/admin/statistics/drivers/${id}`);
  return response.data;
};

export const getCompanyStatistics = async (): Promise<ApiResponse<CompanyStatistics[]>> => {
  const response = await client.get('/admin/statistics/companies');
  return response.data;
};

export const getCompanyStatisticsById = async (id: number): Promise<ApiResponse<CompanyStatistics>> => {
  const response = await client.get(`/admin/statistics/companies/${id}`);
  return response.data;
};

// ==================== 설정 관리 ====================

export const getAllSettings = async (): Promise<ApiResponse<SystemSetting[]>> => {
  const response = await client.get('/admin/settings');
  return response.data;
};

export const getSetting = async (key: string): Promise<ApiResponse<SystemSetting>> => {
  const response = await client.get(`/admin/settings/${key}`);
  return response.data;
};

export interface UpdateSettingRequest {
  settingValue: string;
  description?: string;
}

export const updateSetting = async (key: string, data: UpdateSettingRequest): Promise<ApiResponse<SystemSetting>> => {
  const response = await client.put(`/admin/settings/${key}`, data);
  return response.data;
};

export const getGradeSettings = async (): Promise<ApiResponse<Record<string, number>>> => {
  const response = await client.get('/admin/grade-settings');
  return response.data;
};
