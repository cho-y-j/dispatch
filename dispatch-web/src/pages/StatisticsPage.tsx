import { useState, useEffect } from 'react';
import {
  BarChart3,
  TrendingUp,
  Users,
  Building2,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  Star,
  AlertTriangle,
} from 'lucide-react';
import {
  DashboardStatistics,
  DriverStatistics,
  CompanyStatistics,
  DriverGrade,
  DriverGradeLabels,
} from '../types';
import {
  getDashboardStatistics,
  getDriverStatistics,
  getCompanyStatistics,
} from '../api/admin';

type TabType = 'overview' | 'drivers' | 'companies';

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dashboardStats, setDashboardStats] = useState<DashboardStatistics | null>(null);
  const [driverStats, setDriverStats] = useState<DriverStatistics[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStatistics[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const response = await getDashboardStatistics();
        if (response.success && response.data) {
          setDashboardStats(response.data);
        }
      } else if (activeTab === 'drivers') {
        const response = await getDriverStatistics();
        if (response.success && response.data) {
          setDriverStats(response.data);
        }
      } else if (activeTab === 'companies') {
        const response = await getCompanyStatistics();
        if (response.success && response.data) {
          setCompanyStats(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to load statistics:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">통계</h1>
        <p className="text-gray-600">시스템 전반의 통계 및 현황</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'overview'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          전체 현황
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'drivers'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          기사별 통계
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'companies'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          발주처별 통계
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : (
        <>
          {activeTab === 'overview' && dashboardStats && (
            <OverviewTab stats={dashboardStats} />
          )}
          {activeTab === 'drivers' && (
            <DriversTab stats={driverStats} />
          )}
          {activeTab === 'companies' && (
            <CompaniesTab stats={companyStats} />
          )}
        </>
      )}
    </div>
  );
}

function OverviewTab({ stats }: { stats: DashboardStatistics }) {
  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Truck className="w-6 h-6 text-blue-600" />}
          title="총 배차"
          value={stats.totalDispatches}
          bgColor="bg-blue-50"
        />
        <StatCard
          icon={<Users className="w-6 h-6 text-green-600" />}
          title="총 기사"
          value={stats.totalDrivers}
          bgColor="bg-green-50"
        />
        <StatCard
          icon={<Building2 className="w-6 h-6 text-purple-600" />}
          title="총 발주처"
          value={stats.totalCompanies}
          bgColor="bg-purple-50"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
          title="완료율"
          value={`${stats.completionRate}%`}
          bgColor="bg-orange-50"
        />
      </div>

      {/* Today's Stats */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">오늘의 현황</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-900">{stats.todayDispatches}</p>
            <p className="text-sm text-gray-600">오늘 배차</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-600">{stats.todayCompleted}</p>
            <p className="text-sm text-gray-600">완료</p>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <p className="text-3xl font-bold text-red-600">{stats.todayCancelled}</p>
            <p className="text-sm text-gray-600">취소</p>
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-yellow-50 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-800">{stats.pendingDrivers}</p>
              <p className="text-sm text-yellow-700">기사 승인 대기</p>
            </div>
          </div>
        </div>
        <div className="bg-yellow-50 rounded-lg p-6">
          <div className="flex items-center gap-3">
            <Clock className="w-8 h-8 text-yellow-600" />
            <div>
              <p className="text-2xl font-bold text-yellow-800">{stats.pendingCompanies}</p>
              <p className="text-sm text-yellow-700">발주처 승인 대기</p>
            </div>
          </div>
        </div>
      </div>

      {/* Status Distribution */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">상태별 배차</h3>
        <div className="grid grid-cols-5 gap-4">
          {Object.entries(stats.dispatchesByStatus).map(([status, count]) => (
            <div key={status} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900">{count}</p>
              <p className="text-xs text-gray-600">{status}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Daily Chart */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">최근 7일 배차 현황</h3>
        <div className="flex items-end justify-between gap-2 h-40">
          {stats.dailyStats.map((day, index) => {
            const maxValue = Math.max(...stats.dailyStats.map(d => d.dispatches));
            const height = maxValue > 0 ? (day.dispatches / maxValue) * 100 : 0;
            return (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div
                  className="w-full bg-blue-500 rounded-t"
                  style={{ height: `${height}%`, minHeight: day.dispatches > 0 ? '8px' : '0' }}
                />
                <span className="text-xs text-gray-600">{day.date}</span>
                <span className="text-xs font-medium">{day.dispatches}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function DriversTab({ stats }: { stats: DriverStatistics[] }) {
  const getGradeBadgeColor = (grade: DriverGrade) => {
    switch (grade) {
      case DriverGrade.GRADE_1:
        return 'bg-green-100 text-green-800';
      case DriverGrade.GRADE_2:
        return 'bg-blue-100 text-blue-800';
      case DriverGrade.GRADE_3:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기사</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등급</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">별점</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 배차</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">완료</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">취소</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">경고</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stats.map((driver) => (
            <tr key={driver.driverId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{driver.driverName}</div>
                  <div className="text-sm text-gray-500">{driver.phone}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getGradeBadgeColor(driver.grade)}`}>
                  {DriverGradeLabels[driver.grade]}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Star className="w-4 h-4 text-yellow-400 mr-1" />
                  <span className="text-sm">{driver.averageRating.toFixed(1)}</span>
                  <span className="text-xs text-gray-500 ml-1">({driver.totalRatings})</span>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {driver.totalDispatches}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {driver.completedDispatches}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="flex items-center text-red-600">
                  <XCircle className="w-4 h-4 mr-1" />
                  {driver.cancelledDispatches}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {driver.warningCount > 0 ? (
                  <span className="flex items-center text-orange-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {driver.warningCount}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  driver.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {driver.isActive ? '활동 중' : '비활동'}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CompaniesTab({ stats }: { stats: CompanyStatistics[] }) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">발주처</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">총 배차</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">완료</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">취소</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">이용 금액</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">경고</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">직원 수</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {stats.map((company) => (
            <tr key={company.companyId} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{company.companyName}</div>
                  <div className="text-sm text-gray-500">{company.businessNumber}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {company.totalDispatches}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="flex items-center text-green-600">
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {company.completedDispatches}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="flex items-center text-red-600">
                  <XCircle className="w-4 h-4 mr-1" />
                  {company.cancelledDispatches}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {company.totalAmount.toLocaleString()}원
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {company.warningCount > 0 ? (
                  <span className="flex items-center text-orange-600">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    {company.warningCount}
                  </span>
                ) : (
                  <span className="text-gray-400">-</span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {company.employeeCount}명
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  bgColor,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  bgColor: string;
}) {
  return (
    <div className={`${bgColor} rounded-lg p-6`}>
      <div className="flex items-center gap-4">
        {icon}
        <div>
          <p className="text-sm text-gray-600">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}
