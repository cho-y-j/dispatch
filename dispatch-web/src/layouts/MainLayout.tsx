import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';
import {
  LayoutDashboard,
  FileText,
  Users,
  UserCog,
  Building2,
  AlertTriangle,
  BarChart3,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useWebSocket } from '../hooks/useWebSocket';
import NotificationDropdown from '../components/NotificationDropdown';

export default function MainLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // WebSocket 연결
  useWebSocket();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isAdmin = user?.role === UserRole.ADMIN;
  const isCompany = user?.role === UserRole.COMPANY;
  const isAdminOrCompany = isAdmin || isCompany;

  const menuItems = [
    { path: '/dashboard', label: '대시보드', icon: LayoutDashboard },
    { path: '/dispatches', label: '배차 관리', icon: FileText },
    { path: '/work-reports', label: '작업 확인서', icon: ClipboardCheck },
    // Admin + Company 공통 메뉴
    ...(isAdminOrCompany ? [
      { path: '/personnel', label: '인원 관리', icon: UserCog },
    ] : []),
    // Admin 전용 메뉴
    ...(isAdmin ? [
      { path: '/drivers', label: '기사 관리', icon: Users },
      { path: '/companies', label: '발주처 관리', icon: Building2 },
      { path: '/warnings', label: '경고/정지 관리', icon: AlertTriangle },
      { path: '/statistics', label: '통계', icon: BarChart3 },
      { path: '/settings', label: '설정', icon: Settings },
    ] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white shadow-lg transform transition-transform duration-300 lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-blue-600">배차 시스템</h1>
          <p className="text-sm text-gray-500">
            {isAdmin ? '관리자' : isCompany ? '발주처' : '직원'} 웹
          </p>
        </div>

        <nav className="p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <item.icon size={20} />
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">{user?.name}</p>
              <p className="text-sm text-gray-500">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="로그아웃"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm sticky top-0 z-10">
          <div className="flex items-center justify-between px-4 py-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900"
            >
              {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex-1 lg:flex-none" />
            <div className="flex items-center gap-4">
              <NotificationDropdown />
              <div className="text-sm text-gray-500">
                {user?.role === UserRole.ADMIN ? '관리자' : user?.role === UserRole.COMPANY ? '발주처' : '직원'}:{' '}
                <span className="font-medium text-gray-900">{user?.name}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
