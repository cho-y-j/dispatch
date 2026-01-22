import { useEffect, useState } from 'react';
import {
  getDriversForVerification,
  getDriverVerificationDetail,
  getDriverVerificationHistory,
  verifyDriverLicense,
  verifyBusinessRegistration,
  verifyKosha,
  verifyCargo,
} from '../api/verification';
import {
  DriverVerificationSummary,
  DriverVerificationHistory,
  VerificationType,
  VerificationTypeLabels,
  VerifyResult,
  VerifyResultLabels,
  RimsLicenseRequest,
  BizVerifyRequest,
  CargoVerifyRequest,
} from '../types';
import {
  User,
  Phone,
  Mail,
  FileText,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  Loader2,
  X,
  History,
  RefreshCw,
} from 'lucide-react';
import dayjs from 'dayjs';

export default function PersonnelManagementPage() {
  const [drivers, setDrivers] = useState<DriverVerificationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDriver, setSelectedDriver] = useState<DriverVerificationSummary | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [verificationHistory, setVerificationHistory] = useState<DriverVerificationHistory[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await getDriversForVerification();
      if (response.success && response.data) {
        setDrivers(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleViewDetail = (driver: DriverVerificationSummary) => {
    setSelectedDriver(driver);
    setShowDetailModal(true);
  };

  const handleViewHistory = async (driver: DriverVerificationSummary) => {
    setSelectedDriver(driver);
    setHistoryLoading(true);
    setShowHistoryModal(true);

    try {
      const response = await getDriverVerificationHistory(driver.driverId);
      if (response.success && response.data) {
        setVerificationHistory(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch verification history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  const refreshDriverDetail = async (driverId: number) => {
    try {
      const response = await getDriverVerificationDetail(driverId);
      if (response.success && response.data) {
        setSelectedDriver(response.data);
        // 목록도 갱신
        setDrivers(prev => prev.map(d => d.driverId === driverId ? response.data! : d));
      }
    } catch (error) {
      console.error('Failed to refresh driver detail:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">인원 관리</h1>
        <button
          onClick={fetchDrivers}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
        >
          <RefreshCw size={18} />
          새로고침
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          등록된 기사가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기사</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">운전면허</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">사업자등록</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">KOSHA</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">화물운송</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => (
                <DriverRow
                  key={driver.driverId}
                  driver={driver}
                  onViewDetail={() => handleViewDetail(driver)}
                  onViewHistory={() => handleViewHistory(driver)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showDetailModal && selectedDriver && (
        <VerificationDetailModal
          driver={selectedDriver}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDriver(null);
          }}
          onRefresh={() => refreshDriverDetail(selectedDriver.driverId)}
        />
      )}

      {showHistoryModal && selectedDriver && (
        <VerificationHistoryModal
          driver={selectedDriver}
          history={verificationHistory}
          loading={historyLoading}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedDriver(null);
            setVerificationHistory([]);
          }}
        />
      )}
    </div>
  );
}

function DriverRow({
  driver,
  onViewDetail,
  onViewHistory,
}: {
  driver: DriverVerificationSummary;
  onViewDetail: () => void;
  onViewHistory: () => void;
}) {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={20} className="text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{driver.driverName || '-'}</p>
            <p className="text-sm text-gray-500">{driver.phone || '-'}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <VerificationStatusBadge status={driver.licenseStatus} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <VerificationStatusBadge status={driver.businessStatus} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <VerificationStatusBadge status={driver.koshaStatus} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-center">
        <VerificationStatusBadge status={driver.cargoStatus} />
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onViewDetail}
            className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1"
          >
            <Shield size={16} />
            검증
          </button>
          <button
            onClick={onViewHistory}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1"
          >
            <History size={16} />
            이력
          </button>
        </div>
      </td>
    </tr>
  );
}

function VerificationStatusBadge({ status }: { status: { result: string; verifiedAt?: string } }) {
  const getStatusStyle = (result: string) => {
    switch (result) {
      case 'VALID':
        return 'bg-green-100 text-green-800';
      case 'INVALID':
        return 'bg-red-100 text-red-800';
      case 'UNKNOWN':
        return 'bg-yellow-100 text-yellow-800';
      case 'NOT_VERIFIED':
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  const getStatusIcon = (result: string) => {
    switch (result) {
      case 'VALID':
        return <CheckCircle size={14} />;
      case 'INVALID':
        return <XCircle size={14} />;
      case 'UNKNOWN':
        return <AlertCircle size={14} />;
      case 'NOT_VERIFIED':
      default:
        return <Clock size={14} />;
    }
  };

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusStyle(
        status.result
      )}`}
      title={status.verifiedAt ? dayjs(status.verifiedAt).format('YYYY-MM-DD HH:mm') : undefined}
    >
      {getStatusIcon(status.result)}
      {VerifyResultLabels[status.result as VerifyResult] || status.result}
    </span>
  );
}

function VerificationDetailModal({
  driver,
  onClose,
  onRefresh,
}: {
  driver: DriverVerificationSummary;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [activeVerification, setActiveVerification] = useState<VerificationType | null>(null);
  const [verifying, setVerifying] = useState(false);

  // 운전면허 검증 폼
  const [licenseForm, setLicenseForm] = useState<RimsLicenseRequest>({
    licenseNumber: driver.driverLicenseNumber || '',
    name: driver.driverName || '',
    birth: '',
    licenseType: '',
  });

  // 사업자등록 검증 폼
  const [businessForm, setBusinessForm] = useState<BizVerifyRequest>({
    businessNumber: driver.businessRegistrationNumber || '',
    startDate: '',
    representativeName: '',
  });

  // 화물운송 검증 폼
  const [cargoForm, setCargoForm] = useState<CargoVerifyRequest>({
    name: driver.driverName || '',
    birth: '',
    lcnsNo: '',
    area: '',
  });

  // KOSHA 이미지 파일
  const [koshaImage, setKoshaImage] = useState<File | null>(null);

  const handleVerifyLicense = async () => {
    if (!licenseForm.licenseNumber || !licenseForm.name) {
      alert('면허번호와 성명은 필수입니다.');
      return;
    }

    setVerifying(true);
    try {
      const response = await verifyDriverLicense(driver.driverId, licenseForm);
      if (response.success) {
        alert(`검증 결과: ${VerifyResultLabels[response.data?.result as VerifyResult] || response.data?.result}\n${response.data?.message || ''}`);
        onRefresh();
      }
    } catch (error) {
      console.error('License verification failed:', error);
      alert('검증 중 오류가 발생했습니다.');
    } finally {
      setVerifying(false);
      setActiveVerification(null);
    }
  };

  const handleVerifyBusiness = async () => {
    if (!businessForm.businessNumber) {
      alert('사업자번호는 필수입니다.');
      return;
    }

    setVerifying(true);
    try {
      const response = await verifyBusinessRegistration(driver.driverId, businessForm);
      if (response.success) {
        alert(`검증 결과: ${VerifyResultLabels[response.data?.result as VerifyResult] || response.data?.result}\n${response.data?.message || ''}`);
        onRefresh();
      }
    } catch (error) {
      console.error('Business verification failed:', error);
      alert('검증 중 오류가 발생했습니다.');
    } finally {
      setVerifying(false);
      setActiveVerification(null);
    }
  };

  const handleVerifyKosha = async () => {
    if (!koshaImage) {
      alert('교육이수증 이미지를 선택해주세요.');
      return;
    }

    setVerifying(true);
    try {
      const response = await verifyKosha(driver.driverId, koshaImage);
      if (response.success) {
        alert(`검증 결과: ${VerifyResultLabels[response.data?.result as VerifyResult] || response.data?.result}\n${response.data?.message || ''}`);
        onRefresh();
      }
    } catch (error) {
      console.error('KOSHA verification failed:', error);
      alert('검증 중 오류가 발생했습니다.');
    } finally {
      setVerifying(false);
      setActiveVerification(null);
      setKoshaImage(null);
    }
  };

  const handleVerifyCargo = async () => {
    if (!cargoForm.name || !cargoForm.birth || !cargoForm.lcnsNo) {
      alert('성명, 생년월일, 자격증번호는 필수입니다.');
      return;
    }

    setVerifying(true);
    try {
      const response = await verifyCargo(driver.driverId, cargoForm);
      if (response.success) {
        alert(`검증 결과: ${VerifyResultLabels[response.data?.result as VerifyResult] || response.data?.result}\n${response.data?.message || ''}`);
        onRefresh();
      }
    } catch (error) {
      console.error('Cargo verification failed:', error);
      alert('검증 중 오류가 발생했습니다.');
    } finally {
      setVerifying(false);
      setActiveVerification(null);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">서류 검증</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {/* 기사 정보 */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={24} className="text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg">{driver.driverName}</h3>
              <div className="flex gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <Phone size={14} />
                  {driver.phone}
                </span>
                <span className="flex items-center gap-1">
                  <Mail size={14} />
                  {driver.email}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 검증 항목 목록 */}
        <div className="space-y-4">
          {/* 운전면허 */}
          <VerificationCard
            type={VerificationType.LICENSE}
            status={driver.licenseStatus}
            isActive={activeVerification === VerificationType.LICENSE}
            onToggle={() =>
              setActiveVerification(activeVerification === VerificationType.LICENSE ? null : VerificationType.LICENSE)
            }
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">면허번호 *</label>
                  <input
                    type="text"
                    value={licenseForm.licenseNumber}
                    onChange={(e) => setLicenseForm({ ...licenseForm, licenseNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="12-34-567890-12"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">성명 *</label>
                  <input
                    type="text"
                    value={licenseForm.name}
                    onChange={(e) => setLicenseForm({ ...licenseForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">생년월일</label>
                  <input
                    type="date"
                    value={licenseForm.birth}
                    onChange={(e) => setLicenseForm({ ...licenseForm, birth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">면허종별</label>
                  <select
                    value={licenseForm.licenseType}
                    onChange={(e) => setLicenseForm({ ...licenseForm, licenseType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  >
                    <option value="">선택</option>
                    <option value="1종대형">1종대형</option>
                    <option value="1종보통">1종보통</option>
                    <option value="2종보통">2종보통</option>
                  </select>
                </div>
              </div>
              <button
                onClick={handleVerifyLicense}
                disabled={verifying}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                운전면허 검증
              </button>
            </div>
          </VerificationCard>

          {/* 사업자등록 */}
          <VerificationCard
            type={VerificationType.BUSINESS}
            status={driver.businessStatus}
            isActive={activeVerification === VerificationType.BUSINESS}
            onToggle={() =>
              setActiveVerification(activeVerification === VerificationType.BUSINESS ? null : VerificationType.BUSINESS)
            }
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">사업자번호 *</label>
                  <input
                    type="text"
                    value={businessForm.businessNumber}
                    onChange={(e) => setBusinessForm({ ...businessForm, businessNumber: e.target.value.replace(/\D/g, '') })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="1234567890"
                    maxLength={10}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">개업일</label>
                  <input
                    type="date"
                    value={businessForm.startDate}
                    onChange={(e) => setBusinessForm({ ...businessForm, startDate: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">대표자명</label>
                  <input
                    type="text"
                    value={businessForm.representativeName}
                    onChange={(e) => setBusinessForm({ ...businessForm, representativeName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
              </div>
              <button
                onClick={handleVerifyBusiness}
                disabled={verifying}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                사업자등록 검증
              </button>
            </div>
          </VerificationCard>

          {/* KOSHA 교육이수증 */}
          <VerificationCard
            type={VerificationType.KOSHA}
            status={driver.koshaStatus}
            isActive={activeVerification === VerificationType.KOSHA}
            onToggle={() =>
              setActiveVerification(activeVerification === VerificationType.KOSHA ? null : VerificationType.KOSHA)
            }
          >
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">교육이수증 이미지 *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setKoshaImage(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">QR 코드가 포함된 교육이수증 이미지를 업로드하세요</p>
              </div>
              <button
                onClick={handleVerifyKosha}
                disabled={verifying}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                KOSHA 교육이수증 검증
              </button>
            </div>
          </VerificationCard>

          {/* 화물운송 자격증 */}
          <VerificationCard
            type={VerificationType.CARGO}
            status={driver.cargoStatus}
            isActive={activeVerification === VerificationType.CARGO}
            onToggle={() =>
              setActiveVerification(activeVerification === VerificationType.CARGO ? null : VerificationType.CARGO)
            }
          >
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">성명 *</label>
                  <input
                    type="text"
                    value={cargoForm.name}
                    onChange={(e) => setCargoForm({ ...cargoForm, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">생년월일 *</label>
                  <input
                    type="date"
                    value={cargoForm.birth}
                    onChange={(e) => setCargoForm({ ...cargoForm, birth: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">자격증번호 *</label>
                  <input
                    type="text"
                    value={cargoForm.lcnsNo}
                    onChange={(e) => setCargoForm({ ...cargoForm, lcnsNo: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">지역</label>
                  <input
                    type="text"
                    value={cargoForm.area}
                    onChange={(e) => setCargoForm({ ...cargoForm, area: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    placeholder="예: 서울"
                  />
                </div>
              </div>
              <button
                onClick={handleVerifyCargo}
                disabled={verifying}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {verifying ? <Loader2 size={18} className="animate-spin" /> : <Shield size={18} />}
                화물운송 자격증 검증
              </button>
            </div>
          </VerificationCard>
        </div>

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

function VerificationCard({
  type,
  status,
  isActive,
  onToggle,
  children,
}: {
  type: VerificationType;
  status: { result: string; verifiedAt?: string; message?: string };
  isActive: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  const getStatusColor = (result: string) => {
    switch (result) {
      case 'VALID':
        return 'border-green-200 bg-green-50';
      case 'INVALID':
        return 'border-red-200 bg-red-50';
      case 'UNKNOWN':
        return 'border-yellow-200 bg-yellow-50';
      default:
        return 'border-gray-200 bg-white';
    }
  };

  return (
    <div className={`border rounded-lg ${getStatusColor(status.result)}`}>
      <div
        className="flex items-center justify-between p-4 cursor-pointer"
        onClick={onToggle}
      >
        <div className="flex items-center gap-3">
          <FileText size={20} className="text-gray-600" />
          <div>
            <h4 className="font-medium">{VerificationTypeLabels[type]}</h4>
            {status.verifiedAt && (
              <p className="text-xs text-gray-500">
                마지막 검증: {dayjs(status.verifiedAt).format('YYYY-MM-DD HH:mm')}
              </p>
            )}
          </div>
        </div>
        <VerificationStatusBadge status={status} />
      </div>
      {isActive && <div className="p-4 pt-0 border-t border-gray-200">{children}</div>}
    </div>
  );
}

function VerificationHistoryModal({
  driver,
  history,
  loading,
  onClose,
}: {
  driver: DriverVerificationSummary;
  history: DriverVerificationHistory[];
  loading: boolean;
  onClose: () => void;
}) {
  const getResultStyle = (result: string) => {
    switch (result) {
      case 'VALID':
        return 'text-green-600';
      case 'INVALID':
        return 'text-red-600';
      case 'UNKNOWN':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">검증 이력 - {driver.driverName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : history.length === 0 ? (
          <div className="text-center text-gray-500 py-8">검증 이력이 없습니다.</div>
        ) : (
          <div className="space-y-3">
            {history.map((item) => (
              <div key={item.id} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">
                    {VerificationTypeLabels[item.verificationType as VerificationType] || item.verificationType}
                  </span>
                  <span className={`font-medium ${getResultStyle(item.result)}`}>
                    {VerifyResultLabels[item.result as VerifyResult] || item.result}
                  </span>
                </div>
                {item.message && <p className="text-sm text-gray-600 mb-2">{item.message}</p>}
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}</span>
                  {item.reasonCode && <span>사유코드: {item.reasonCode}</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-end mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
