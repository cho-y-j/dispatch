import client from './client';
import {
  ApiResponse,
  DriverVerificationSummary,
  DriverVerificationHistory,
  VerifyResponse,
  RimsLicenseRequest,
  BizVerifyRequest,
  CargoVerifyRequest,
} from '../types';

// ==================== 검증 대상 기사 목록 ====================

export const getDriversForVerification = async (): Promise<ApiResponse<DriverVerificationSummary[]>> => {
  const response = await client.get('/admin/verifications/drivers');
  return response.data;
};

export const getDriverVerificationDetail = async (id: number): Promise<ApiResponse<DriverVerificationSummary>> => {
  const response = await client.get(`/admin/verifications/drivers/${id}`);
  return response.data;
};

export const getDriverVerificationHistory = async (id: number): Promise<ApiResponse<DriverVerificationHistory[]>> => {
  const response = await client.get(`/admin/verifications/drivers/${id}/history`);
  return response.data;
};

// ==================== 운전면허 검증 ====================

export const verifyDriverLicense = async (
  driverId: number,
  request: RimsLicenseRequest
): Promise<ApiResponse<VerifyResponse>> => {
  const response = await client.post(`/admin/verifications/drivers/${driverId}/license`, request);
  return response.data;
};

// ==================== 사업자등록 검증 ====================

export const verifyBusinessRegistration = async (
  driverId: number,
  request: BizVerifyRequest
): Promise<ApiResponse<VerifyResponse>> => {
  const response = await client.post(`/admin/verifications/drivers/${driverId}/business`, request);
  return response.data;
};

// ==================== KOSHA 교육이수증 검증 ====================

export const verifyKosha = async (
  driverId: number,
  image: File
): Promise<ApiResponse<VerifyResponse>> => {
  const formData = new FormData();
  formData.append('image', image);

  const response = await client.post(`/admin/verifications/drivers/${driverId}/kosha`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// ==================== 화물운송 자격증 검증 ====================

export const verifyCargo = async (
  driverId: number,
  request: CargoVerifyRequest
): Promise<ApiResponse<VerifyResponse>> => {
  const response = await client.post(`/admin/verifications/drivers/${driverId}/cargo`, request);
  return response.data;
};
