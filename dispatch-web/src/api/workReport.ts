import client from './client';
import { ApiResponse, WorkReport } from '../types';

// 작업 확인서 상세 조회
export const getWorkReport = async (dispatchId: number): Promise<ApiResponse<WorkReport>> => {
  const response = await client.get(`/dispatches/${dispatchId}/work-report`);
  return response.data;
};

// 발주처 - 자사 작업 확인서 목록
export const getCompanyWorkReports = async (): Promise<ApiResponse<WorkReport[]>> => {
  const response = await client.get('/dispatches/company/work-reports');
  return response.data;
};

// 발주처 서명/확인
export interface CompanySignatureRequest {
  signature?: string;
  clientName: string;
}

export const signByCompany = async (
  dispatchId: number,
  data: CompanySignatureRequest
): Promise<ApiResponse<void>> => {
  const response = await client.post(`/dispatches/${dispatchId}/sign/company`, data);
  return response.data;
};

// 관리자 - 전체 작업 확인서 목록
export const getAllWorkReports = async (): Promise<ApiResponse<WorkReport[]>> => {
  const response = await client.get('/admin/work-reports');
  return response.data;
};

// 관리자 - 작업 확인서 상세
export const getWorkReportAdmin = async (dispatchId: number): Promise<ApiResponse<WorkReport>> => {
  const response = await client.get(`/admin/work-reports/${dispatchId}`);
  return response.data;
};
