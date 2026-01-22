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
  Calendar,
  Download,
  CalendarDays,
  Filter,
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts';
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
type DateRangeType = 'today' | '7days' | '30days' | '90days' | 'custom';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];
const STATUS_COLORS: Record<string, string> = {
  OPEN: '#10B981',
  MATCHED: '#3B82F6',
  IN_PROGRESS: '#F59E0B',
  COMPLETED: '#6B7280',
  CANCELLED: '#EF4444',
};
const STATUS_LABELS: Record<string, string> = {
  OPEN: '배차 대기',
  MATCHED: '매칭 완료',
  IN_PROGRESS: '작업 중',
  COMPLETED: '완료',
  CANCELLED: '취소',
};

const DATE_RANGE_OPTIONS: { value: DateRangeType; label: string }[] = [
  { value: 'today', label: '오늘' },
  { value: '7days', label: '최근 7일' },
  { value: '30days', label: '최근 30일' },
  { value: '90days', label: '최근 90일' },
  { value: 'custom', label: '직접 설정' },
];

function getDateRange(type: DateRangeType): { startDate: string; endDate: string } {
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  let startDate: string;

  switch (type) {
    case 'today':
      startDate = endDate;
      break;
    case '7days':
      startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case '30days':
      startDate = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    case '90days':
      startDate = new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      break;
    default:
      startDate = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  }

  return { startDate, endDate };
}

export default function StatisticsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [dashboardStats, setDashboardStats] = useState<DashboardStatistics | null>(null);
  const [driverStats, setDriverStats] = useState<DriverStatistics[]>([]);
  const [companyStats, setCompanyStats] = useState<CompanyStatistics[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<DateRangeType>('7days');
  const [customStartDate, setCustomStartDate] = useState<string>('');
  const [customEndDate, setCustomEndDate] = useState<string>('');
  const [showDateFilter, setShowDateFilter] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab, dateRange]);

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

  const handleDateRangeChange = (type: DateRangeType) => {
    setDateRange(type);
    if (type !== 'custom') {
      setShowDateFilter(false);
    }
  };

  const handleApplyCustomDate = () => {
    if (customStartDate && customEndDate) {
      setDateRange('custom');
      setShowDateFilter(false);
      loadData();
    }
  };

  const getCurrentDateRangeLabel = () => {
    if (dateRange === 'custom' && customStartDate && customEndDate) {
      return `${customStartDate} ~ ${customEndDate}`;
    }
    return DATE_RANGE_OPTIONS.find((opt) => opt.value === dateRange)?.label || '최근 7일';
  };

  return (
    <div className="p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">통계</h1>
          <p className="text-gray-600">시스템 전반의 통계 및 현황</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Date Range Filter */}
          <div className="relative">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50 text-gray-700"
            >
              <CalendarDays className="w-4 h-4" />
              <span>{getCurrentDateRangeLabel()}</span>
              <Filter className="w-4 h-4" />
            </button>

            {showDateFilter && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border z-10">
                <div className="p-4">
                  <h4 className="font-medium text-gray-900 mb-3">기간 선택</h4>
                  <div className="space-y-2">
                    {DATE_RANGE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleDateRangeChange(option.value)}
                        className={`w-full text-left px-3 py-2 rounded-lg transition-colors ${
                          dateRange === option.value
                            ? 'bg-blue-100 text-blue-700'
                            : 'hover:bg-gray-100 text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>

                  {dateRange === 'custom' && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="space-y-3">
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">시작일</label>
                          <input
                            type="date"
                            value={customStartDate}
                            onChange={(e) => setCustomStartDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <div>
                          <label className="block text-sm text-gray-600 mb-1">종료일</label>
                          <input
                            type="date"
                            value={customEndDate}
                            onChange={(e) => setCustomEndDate(e.target.value)}
                            className="w-full px-3 py-2 border rounded-lg"
                          />
                        </div>
                        <button
                          onClick={handleApplyCustomDate}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          적용
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">
            <Download className="w-4 h-4" />
            <span>리포트 다운로드</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            전체 현황
          </div>
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'drivers'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            기사별 통계
          </div>
        </button>
        <button
          onClick={() => setActiveTab('companies')}
          className={`px-4 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'companies'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4" />
            발주처별 통계
          </div>
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
  // Prepare pie chart data
  const pieData = Object.entries(stats.dispatchesByStatus).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_COLORS[status] || '#6B7280',
  }));

  // Prepare daily stats for area chart
  const dailyChartData = stats.dailyStats.map((day) => ({
    date: day.date.substring(5), // MM-DD format
    배차: day.dispatches,
    완료: day.completed,
    취소: day.cancelled,
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={<Truck className="w-6 h-6 text-blue-600" />}
          title="총 배차"
          value={stats.totalDispatches}
          bgColor="bg-gradient-to-br from-blue-50 to-blue-100"
          trend="+12%"
          trendUp={true}
        />
        <StatCard
          icon={<Users className="w-6 h-6 text-green-600" />}
          title="총 기사"
          value={stats.totalDrivers}
          bgColor="bg-gradient-to-br from-green-50 to-green-100"
        />
        <StatCard
          icon={<Building2 className="w-6 h-6 text-purple-600" />}
          title="총 발주처"
          value={stats.totalCompanies}
          bgColor="bg-gradient-to-br from-purple-50 to-purple-100"
        />
        <StatCard
          icon={<TrendingUp className="w-6 h-6 text-orange-600" />}
          title="완료율"
          value={`${stats.completionRate}%`}
          bgColor="bg-gradient-to-br from-orange-50 to-orange-100"
          trend={stats.completionRate >= 80 ? '양호' : '개선필요'}
          trendUp={stats.completionRate >= 80}
        />
      </div>

      {/* Today's Stats */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold">오늘의 현황</h3>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl">
            <p className="text-4xl font-bold text-gray-900">{stats.todayDispatches}</p>
            <p className="text-sm text-gray-600 mt-1">오늘 배차</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl">
            <p className="text-4xl font-bold text-green-600">{stats.todayCompleted}</p>
            <p className="text-sm text-gray-600 mt-1">완료</p>
          </div>
          <div className="text-center p-6 bg-gradient-to-br from-red-50 to-red-100 rounded-xl">
            <p className="text-4xl font-bold text-red-600">{stats.todayCancelled}</p>
            <p className="text-sm text-gray-600 mt-1">취소</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Trend Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">최근 7일 배차 추이</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dailyChartData}>
                <defs>
                  <linearGradient id="colorDispatches" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="배차"
                  stroke="#3B82F6"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorDispatches)"
                />
                <Area
                  type="monotone"
                  dataKey="완료"
                  stroke="#10B981"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorCompleted)"
                />
                <Line
                  type="monotone"
                  dataKey="취소"
                  stroke="#EF4444"
                  strokeWidth={2}
                  dot={{ fill: '#EF4444' }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">상태별 배차 분포</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => [`${value}건`, '']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {pieData.map((entry, index) => (
              <div key={index} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-sm text-gray-600">{entry.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pending Approvals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-200 rounded-full">
              <Clock className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-800">{stats.pendingDrivers}</p>
              <p className="text-sm text-amber-700">기사 승인 대기</p>
            </div>
          </div>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-6 border border-amber-200">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-amber-200 rounded-full">
              <Clock className="w-6 h-6 text-amber-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-amber-800">{stats.pendingCompanies}</p>
              <p className="text-sm text-amber-700">발주처 승인 대기</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function DriversTab({ stats }: { stats: DriverStatistics[] }) {
  const getGradeBadgeColor = (grade: DriverGrade) => {
    switch (grade) {
      case DriverGrade.GRADE_1:
        return 'bg-green-100 text-green-800 border-green-200';
      case DriverGrade.GRADE_2:
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case DriverGrade.GRADE_3:
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Prepare data for bar chart - Top 5 drivers by completed dispatches
  const topDrivers = [...stats]
    .sort((a, b) => b.completedDispatches - a.completedDispatches)
    .slice(0, 5)
    .map((d) => ({
      name: d.driverName,
      완료: d.completedDispatches,
      취소: d.cancelledDispatches,
      별점: d.averageRating,
    }));

  // Grade distribution
  const gradeDistribution = stats.reduce((acc, driver) => {
    const grade = driver.grade || 'GRADE_3';
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const gradeData = Object.entries(gradeDistribution).map(([grade, count]) => ({
    name: DriverGradeLabels[grade as DriverGrade] || grade,
    value: count,
  }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">총 기사 수</p>
          <p className="text-2xl font-bold">{stats.length}명</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">평균 별점</p>
          <p className="text-2xl font-bold flex items-center gap-1">
            <Star className="w-5 h-5 text-yellow-400" />
            {(stats.reduce((sum, d) => sum + d.averageRating, 0) / stats.length || 0).toFixed(1)}
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">총 완료 건수</p>
          <p className="text-2xl font-bold text-green-600">
            {stats.reduce((sum, d) => sum + d.completedDispatches, 0)}건
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">활동 중</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.filter((d) => d.isActive).length}명
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Drivers Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">상위 기사 실적</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topDrivers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 12 }}
                  stroke="#9CA3AF"
                  width={80}
                />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}
                />
                <Legend />
                <Bar dataKey="완료" fill="#10B981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="취소" fill="#EF4444" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Grade Distribution */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">등급별 분포</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={gradeData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}명`}
                >
                  {gradeData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Driver Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">기사 상세 목록</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">기사</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">등급</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">별점</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 배차</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">완료</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">취소</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">완료율</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">경고</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.map((driver) => {
                const completionRate = driver.totalDispatches > 0
                  ? Math.round((driver.completedDispatches / driver.totalDispatches) * 100)
                  : 0;
                return (
                  <tr key={driver.driverId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{driver.driverName}</div>
                        <div className="text-sm text-gray-500">{driver.phone}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${getGradeBadgeColor(driver.grade)}`}>
                        {DriverGradeLabels[driver.grade]}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-sm font-medium">{driver.averageRating.toFixed(1)}</span>
                        <span className="text-xs text-gray-500">({driver.totalRatings})</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {driver.totalDispatches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center text-green-600 font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {driver.completedDispatches}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center text-red-600 font-medium">
                        <XCircle className="w-4 h-4 mr-1" />
                        {driver.cancelledDispatches}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${completionRate >= 80 ? 'bg-green-500' : completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {driver.warningCount > 0 ? (
                        <span className="flex items-center text-orange-600 font-medium">
                          <AlertTriangle className="w-4 h-4 mr-1" />
                          {driver.warningCount}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        driver.isActive
                          ? 'bg-green-100 text-green-800 border border-green-200'
                          : 'bg-gray-100 text-gray-800 border border-gray-200'
                      }`}>
                        {driver.isActive ? '활동 중' : '비활동'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function CompaniesTab({ stats }: { stats: CompanyStatistics[] }) {
  // Top companies by dispatch count
  const topCompanies = [...stats]
    .sort((a, b) => b.totalDispatches - a.totalDispatches)
    .slice(0, 5)
    .map((c) => ({
      name: c.companyName.length > 8 ? c.companyName.substring(0, 8) + '...' : c.companyName,
      총배차: c.totalDispatches,
      완료: c.completedDispatches,
    }));

  // Total amount by company
  const topByAmount = [...stats]
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5)
    .map((c) => ({
      name: c.companyName.length > 8 ? c.companyName.substring(0, 8) + '...' : c.companyName,
      금액: Math.round(c.totalAmount / 10000), // 만원 단위
    }));

  return (
    <div className="space-y-6">
      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">총 발주처</p>
          <p className="text-2xl font-bold">{stats.length}개</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">총 배차 건수</p>
          <p className="text-2xl font-bold text-blue-600">
            {stats.reduce((sum, c) => sum + c.totalDispatches, 0)}건
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">총 이용 금액</p>
          <p className="text-2xl font-bold text-green-600">
            {(stats.reduce((sum, c) => sum + c.totalAmount, 0) / 10000).toFixed(0)}만원
          </p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border p-4">
          <p className="text-sm text-gray-500">총 직원 수</p>
          <p className="text-2xl font-bold text-purple-600">
            {stats.reduce((sum, c) => sum + c.employeeCount, 0)}명
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Companies by Dispatch */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">배차 건수 상위 발주처</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCompanies}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <Tooltip
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}
                />
                <Legend />
                <Bar dataKey="총배차" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Bar dataKey="완료" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Companies by Amount */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h3 className="text-lg font-semibold mb-4">이용 금액 상위 발주처 (만원)</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topByAmount} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                <YAxis
                  dataKey="name"
                  type="category"
                  tick={{ fontSize: 11 }}
                  stroke="#9CA3AF"
                  width={80}
                />
                <Tooltip
                  formatter={(value) => [`${value}만원`, '이용금액']}
                  contentStyle={{
                    borderRadius: '8px',
                    border: '1px solid #E5E7EB'
                  }}
                />
                <Bar dataKey="금액" fill="#8B5CF6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Company Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="p-4 border-b">
          <h3 className="text-lg font-semibold">발주처 상세 목록</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">발주처</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">상태</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">총 배차</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">완료</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">취소</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">완료율</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이용 금액</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">경고</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">직원 수</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {stats.map((company) => {
                const completionRate = company.totalDispatches > 0
                  ? Math.round((company.completedDispatches / company.totalDispatches) * 100)
                  : 0;
                return (
                  <tr key={company.companyId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{company.companyName}</div>
                        <div className="text-sm text-gray-500">{company.businessNumber}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        company.status === 'APPROVED'
                          ? 'bg-green-100 text-green-800'
                          : company.status === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {company.status === 'APPROVED' ? '승인됨' : company.status === 'PENDING' ? '대기중' : company.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {company.totalDispatches}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center text-green-600 font-medium">
                        <CheckCircle className="w-4 h-4 mr-1" />
                        {company.completedDispatches}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center text-red-600 font-medium">
                        <XCircle className="w-4 h-4 mr-1" />
                        {company.cancelledDispatches}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div
                            className={`h-2 rounded-full ${completionRate >= 80 ? 'bg-green-500' : completionRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-600">{completionRate}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                      {company.totalAmount.toLocaleString()}원
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {company.warningCount > 0 ? (
                        <span className="flex items-center text-orange-600 font-medium">
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
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon,
  title,
  value,
  bgColor,
  trend,
  trendUp,
}: {
  icon: React.ReactNode;
  title: string;
  value: number | string;
  bgColor: string;
  trend?: string;
  trendUp?: boolean;
}) {
  return (
    <div className={`${bgColor} rounded-xl p-6 border`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            {icon}
          </div>
          <div>
            <p className="text-sm text-gray-600">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trendUp ? 'text-green-600' : 'text-orange-600'}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
