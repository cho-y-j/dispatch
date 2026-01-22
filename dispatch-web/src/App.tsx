import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuthStore } from './store/authStore';
import { UserRole } from './types';
import { fcmService } from './services/fcm';
import { useFcm } from './hooks/useFcm';

import MainLayout from './layouts/MainLayout';
import LoginPage from './pages/LoginPage';
import CompanyRegistrationPage from './pages/CompanyRegistrationPage';
import DashboardPage from './pages/DashboardPage';
import DispatchesPage from './pages/DispatchesPage';
import DriversPage from './pages/DriversPage';
import CompaniesPage from './pages/CompaniesPage';
import WarningsPage from './pages/WarningsPage';
import StatisticsPage from './pages/StatisticsPage';
import SettingsPage from './pages/SettingsPage';
import WorkReportsPage from './pages/WorkReportsPage';
import PersonnelManagementPage from './pages/PersonnelManagementPage';

function ProtectedRoute({
  children,
  adminOnly = false,
  allowedRoles,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  allowedRoles?: UserRole[];
}) {
  const { isAuthenticated, user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // allowedRoles가 지정된 경우 해당 역할만 허용
  if (allowedRoles && user?.role && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // adminOnly는 기존 호환성을 위해 유지
  if (adminOnly && user?.role !== UserRole.ADMIN) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function App() {
  const { checkAuth, isAuthenticated } = useAuthStore();
  useFcm(); // FCM 포그라운드 메시지 리스너 활성화

  useEffect(() => {
    // FCM 서비스 초기화
    fcmService.initialize();
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // 로그인 후 FCM 토큰 등록
  useEffect(() => {
    if (isAuthenticated) {
      fcmService.registerToken().catch(console.error);
    }
  }, [isAuthenticated]);

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/login"
          element={
            <PublicRoute>
              <LoginPage />
            </PublicRoute>
          }
        />
        <Route
          path="/register/company"
          element={
            <PublicRoute>
              <CompanyRegistrationPage />
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <MainLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="dispatches" element={<DispatchesPage />} />
          <Route path="work-reports" element={<WorkReportsPage />} />
          <Route
            path="drivers"
            element={
              <ProtectedRoute adminOnly>
                <DriversPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="personnel"
            element={
              <ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.COMPANY]}>
                <PersonnelManagementPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="companies"
            element={
              <ProtectedRoute adminOnly>
                <CompaniesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="warnings"
            element={
              <ProtectedRoute adminOnly>
                <WarningsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="statistics"
            element={
              <ProtectedRoute adminOnly>
                <StatisticsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="settings"
            element={
              <ProtectedRoute adminOnly>
                <SettingsPage />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
