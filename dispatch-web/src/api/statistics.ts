import apiClient from './client';

export interface DailyStats {
  date: string;
  dispatches: number;
  completed: number;
  cancelled: number;
}

export interface DashboardStatistics {
  totalDispatches: number;
  totalDrivers: number;
  totalCompanies: number;
  todayDispatches: number;
  todayCompleted: number;
  todayCancelled: number;
  dispatchesByStatus: Record<string, number>;
  dailyStats: DailyStats[];
  pendingDrivers: number;
  pendingCompanies: number;
  completionRate: number;
}

export interface DriverStatistics {
  driverId: number;
  driverName: string;
  phone: string;
  grade: string;
  averageRating: number;
  totalRatings: number;
  totalDispatches: number;
  completedDispatches: number;
  cancelledDispatches: number;
  warningCount: number;
  isActive: boolean;
  verificationStatus: string;
}

export interface CompanyStatistics {
  companyId: number;
  companyName: string;
  businessNumber: string;
  status: string;
  totalDispatches: number;
  completedDispatches: number;
  cancelledDispatches: number;
  totalAmount: number;
  warningCount: number;
  employeeCount: number;
}

// 관리자 대시보드 통계
export const getDashboardStatistics = async (): Promise<DashboardStatistics> => {
  const response = await apiClient.get('/admin/statistics/dashboard');
  return response.data.data;
};

// 기사별 통계 목록
export const getDriverStatistics = async (): Promise<DriverStatistics[]> => {
  const response = await apiClient.get('/admin/statistics/drivers');
  return response.data.data;
};

// 특정 기사 통계
export const getDriverStatisticsById = async (driverId: number): Promise<DriverStatistics> => {
  const response = await apiClient.get(`/admin/statistics/drivers/${driverId}`);
  return response.data.data;
};

// 발주처별 통계 목록
export const getCompanyStatistics = async (): Promise<CompanyStatistics[]> => {
  const response = await apiClient.get('/admin/statistics/companies');
  return response.data.data;
};

// 특정 발주처 통계
export const getCompanyStatisticsById = async (companyId: number): Promise<CompanyStatistics> => {
  const response = await apiClient.get(`/admin/statistics/companies/${companyId}`);
  return response.data.data;
};

// 발주처 본인 통계
export const getMyCompanyStatistics = async (): Promise<CompanyStatistics> => {
  const response = await apiClient.get('/companies/statistics');
  return response.data.data;
};
