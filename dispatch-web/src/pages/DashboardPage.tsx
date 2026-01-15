import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { getMyDispatches, getAllDispatches } from '../api/dispatch';
import { getPendingDrivers } from '../api/admin';
import { Dispatch, Driver, UserRole, DispatchStatus, DispatchStatusLabels } from '../types';
import {
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import dayjs from 'dayjs';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [pendingDrivers, setPendingDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);

  const isAdmin = user?.role === UserRole.ADMIN;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const dispatchResponse = isAdmin
          ? await getAllDispatches()
          : await getMyDispatches();

        if (dispatchResponse.success && dispatchResponse.data) {
          setDispatches(dispatchResponse.data);
        }

        if (isAdmin) {
          const driversResponse = await getPendingDrivers();
          if (driversResponse.success && driversResponse.data) {
            setPendingDrivers(driversResponse.data);
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAdmin]);

  const stats = {
    total: dispatches.length,
    open: dispatches.filter((d) => d.status === DispatchStatus.OPEN).length,
    inProgress: dispatches.filter((d) => d.status === DispatchStatus.IN_PROGRESS).length,
    completed: dispatches.filter((d) => d.status === DispatchStatus.COMPLETED).length,
  };

  const recentDispatches = dispatches
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">대시보드</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="전체 배차"
          value={stats.total}
          icon={FileText}
          color="blue"
        />
        <StatCard
          title="대기 중"
          value={stats.open}
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="진행 중"
          value={stats.inProgress}
          icon={AlertCircle}
          color="orange"
        />
        <StatCard
          title="완료"
          value={stats.completed}
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Admin: Pending Drivers Alert */}
      {isAdmin && pendingDrivers.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Users className="text-yellow-600" size={24} />
              <div>
                <p className="font-medium text-yellow-800">
                  승인 대기 중인 기사가 {pendingDrivers.length}명 있습니다
                </p>
                <p className="text-sm text-yellow-600">
                  기사 승인 페이지에서 확인해주세요.
                </p>
              </div>
            </div>
            <Link
              to="/drivers"
              className="flex items-center gap-1 text-yellow-700 hover:text-yellow-900 font-medium"
            >
              확인하기 <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}

      {/* Recent Dispatches */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">최근 배차</h2>
          <Link
            to="/dispatches"
            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
          >
            전체 보기 <ArrowRight size={16} />
          </Link>
        </div>
        <div className="divide-y">
          {recentDispatches.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              등록된 배차가 없습니다.
            </div>
          ) : (
            recentDispatches.map((dispatch) => (
              <Link
                key={dispatch.id}
                to={`/dispatches/${dispatch.id}`}
                className="block p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">
                      {dispatch.siteAddress}
                    </p>
                    <p className="text-sm text-gray-500">
                      {dayjs(dispatch.workDate).format('YYYY-MM-DD')} {dispatch.workTime.slice(0, 5)}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusStyle(
                      dispatch.status
                    )}`}
                  >
                    {DispatchStatusLabels[dispatch.status]}
                  </span>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon: Icon,
  color,
}: {
  title: string;
  value: number;
  icon: typeof FileText;
  color: 'blue' | 'yellow' | 'orange' | 'green';
}) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    yellow: 'bg-yellow-50 text-yellow-600',
    orange: 'bg-orange-50 text-orange-600',
    green: 'bg-green-50 text-green-600',
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${colors[color]}`}>
          <Icon size={20} />
        </div>
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );
}

function getStatusStyle(status: DispatchStatus) {
  switch (status) {
    case DispatchStatus.OPEN:
      return 'bg-green-100 text-green-800';
    case DispatchStatus.MATCHED:
      return 'bg-blue-100 text-blue-800';
    case DispatchStatus.IN_PROGRESS:
      return 'bg-orange-100 text-orange-800';
    case DispatchStatus.COMPLETED:
      return 'bg-gray-100 text-gray-800';
    case DispatchStatus.CANCELLED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}
