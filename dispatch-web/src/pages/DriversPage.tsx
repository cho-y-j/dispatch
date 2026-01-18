import { useEffect, useState } from 'react';
import { getAllDrivers, getPendingDrivers, approveDriver, rejectDriver, updateDriverGrade } from '../api/admin';
import { Driver, VerificationStatus, EquipmentTypeLabels, DriverGrade, DriverGradeLabels } from '../types';
import { Check, X, Loader2, FileText, User, Phone, Mail, Star, Award, AlertTriangle, Eye } from 'lucide-react';
import dayjs from 'dayjs';

type TabType = 'all' | 'pending';

export default function DriversPage() {
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedDriver, setSelectedDriver] = useState<Driver | null>(null);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = activeTab === 'pending'
        ? await getPendingDrivers()
        : await getAllDrivers();
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
  }, [activeTab]);

  const handleApprove = async (id: number) => {
    if (!confirm('이 기사를 승인하시겠습니까?')) return;

    setProcessingId(id);
    try {
      const response = await approveDriver(id);
      if (response.success) {
        fetchDrivers();
      }
    } catch (error) {
      console.error('Failed to approve driver:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('거절 사유를 입력해주세요:');
    if (reason === null) return;

    setProcessingId(id);
    try {
      const response = await rejectDriver(id, reason);
      if (response.success) {
        fetchDrivers();
      }
    } catch (error) {
      console.error('Failed to reject driver:', error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleGradeChange = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowGradeModal(true);
  };

  const handleViewDetail = (driver: Driver) => {
    setSelectedDriver(driver);
    setShowDetailModal(true);
  };

  const handleGradeUpdate = async (driverId: number, grade: DriverGrade, reason?: string) => {
    try {
      const response = await updateDriverGrade(driverId, grade, reason);
      if (response.success) {
        setShowGradeModal(false);
        setSelectedDriver(null);
        fetchDrivers();
      }
    } catch (error) {
      console.error('Failed to update grade:', error);
      alert('등급 변경에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">기사 관리</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-4">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'pending'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          승인 대기
        </button>
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          전체 기사
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : drivers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          {activeTab === 'pending' ? '승인 대기 중인 기사가 없습니다.' : '등록된 기사가 없습니다.'}
        </div>
      ) : activeTab === 'pending' ? (
        <div className="grid gap-4">
          {drivers.map((driver) => (
            <PendingDriverCard
              key={driver.id}
              driver={driver}
              onApprove={() => handleApprove(driver.id)}
              onReject={() => handleReject(driver.id)}
              processing={processingId === driver.id}
            />
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기사</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">등급</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">평점</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">장비</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {drivers.map((driver) => (
                <DriverRow
                  key={driver.id}
                  driver={driver}
                  onGradeChange={() => handleGradeChange(driver)}
                  onViewDetail={() => handleViewDetail(driver)}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showGradeModal && selectedDriver && (
        <GradeChangeModal
          driver={selectedDriver}
          onClose={() => {
            setShowGradeModal(false);
            setSelectedDriver(null);
          }}
          onSubmit={handleGradeUpdate}
        />
      )}

      {showDetailModal && selectedDriver && (
        <DriverDetailModal
          driver={selectedDriver}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedDriver(null);
          }}
        />
      )}
    </div>
  );
}

function DriverRow({
  driver,
  onGradeChange,
  onViewDetail,
}: {
  driver: Driver;
  onGradeChange: () => void;
  onViewDetail: () => void;
}) {
  const getGradeStyle = (grade?: DriverGrade) => {
    switch (grade) {
      case DriverGrade.GRADE_1:
        return 'bg-yellow-100 text-yellow-800';
      case DriverGrade.GRADE_2:
        return 'bg-blue-100 text-blue-800';
      case DriverGrade.GRADE_3:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <User size={20} className="text-blue-600" />
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{driver.name || '-'}</p>
            <p className="text-sm text-gray-500">{driver.phone || '-'}</p>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getGradeStyle(driver.grade)}`}>
          {driver.grade ? DriverGradeLabels[driver.grade] : '미설정'}
        </span>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center gap-1">
          <Star size={16} className="text-yellow-500" />
          <span className="text-sm">{driver.averageRating?.toFixed(1) || '-'}</span>
          {driver.totalRatings > 0 && (
            <span className="text-xs text-gray-500">({driver.totalRatings})</span>
          )}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="flex flex-wrap gap-1">
          {driver.equipments?.map((eq, idx) => (
            <span key={idx} className="px-2 py-0.5 bg-gray-100 text-gray-700 text-xs rounded">
              {EquipmentTypeLabels[eq.type]}
            </span>
          ))}
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <span
          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVerificationStyle(
            driver.verificationStatus
          )}`}
        >
          {getVerificationLabel(driver.verificationStatus)}
        </span>
        {driver.warningCount > 0 && (
          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
            <AlertTriangle size={12} className="mr-1" />
            경고 {driver.warningCount}
          </span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-right">
        <div className="flex items-center gap-2 justify-end">
          <button
            onClick={onViewDetail}
            className="text-gray-600 hover:text-gray-900 text-sm font-medium flex items-center gap-1"
          >
            <Eye size={16} />
            상세
          </button>
          {driver.verificationStatus === VerificationStatus.VERIFIED && (
            <button
              onClick={onGradeChange}
              className="text-blue-600 hover:text-blue-900 text-sm font-medium flex items-center gap-1"
            >
              <Award size={16} />
              등급 변경
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

function PendingDriverCard({
  driver,
  onApprove,
  onReject,
  processing,
}: {
  driver: Driver;
  onApprove: () => void;
  onReject: () => void;
  processing: boolean;
}) {
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{driver.name || '-'}</h3>
              <p className="text-sm text-gray-500">
                가입일: {dayjs(driver.createdAt).format('YYYY-MM-DD')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={16} />
              {driver.email || '-'}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={16} />
              {driver.phone || '-'}
            </div>
          </div>

          <div className="pt-3 border-t space-y-2">
            <h4 className="font-medium text-sm text-gray-700">제출 서류</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <DocumentItem
                label="사업자등록번호"
                value={driver.businessRegistrationNumber}
                hasImage={!!driver.businessRegistrationImage}
              />
              <DocumentItem
                label="운전면허번호"
                value={driver.driverLicenseNumber}
                hasImage={!!driver.driverLicenseImage}
              />
            </div>
          </div>

          {driver.equipments && driver.equipments.length > 0 && (
            <div className="pt-3 border-t space-y-2">
              <h4 className="font-medium text-sm text-gray-700">보유 장비</h4>
              <div className="flex flex-wrap gap-2">
                {driver.equipments.map((eq, idx) => (
                  <span key={idx} className="px-3 py-1 bg-gray-100 rounded-full text-sm">
                    {EquipmentTypeLabels[eq.type]}
                    {eq.model && ` - ${eq.model}`}
                    {eq.vehicleNumber && ` (${eq.vehicleNumber})`}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="pt-3 border-t">
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getVerificationStyle(
                driver.verificationStatus
              )}`}
            >
              {getVerificationLabel(driver.verificationStatus)}
            </span>
          </div>
        </div>

        <div className="flex lg:flex-col gap-2">
          <button
            onClick={onApprove}
            disabled={processing}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {processing ? <Loader2 size={18} className="animate-spin" /> : <Check size={18} />}
            승인
          </button>
          <button
            onClick={onReject}
            disabled={processing}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {processing ? <Loader2 size={18} className="animate-spin" /> : <X size={18} />}
            거절
          </button>
        </div>
      </div>
    </div>
  );
}

function GradeChangeModal({
  driver,
  onClose,
  onSubmit,
}: {
  driver: Driver;
  onClose: () => void;
  onSubmit: (driverId: number, grade: DriverGrade, reason?: string) => Promise<void>;
}) {
  const [grade, setGrade] = useState<DriverGrade>(driver.grade || DriverGrade.GRADE_3);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(driver.id, grade, reason);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">기사 등급 변경</h2>
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">기사: <span className="font-medium text-gray-900">{driver.name}</span></p>
          <p className="text-sm text-gray-600">현재 등급: <span className="font-medium text-gray-900">{driver.grade ? DriverGradeLabels[driver.grade] : '미설정'}</span></p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">변경할 등급 *</label>
            <select
              value={grade}
              onChange={(e) => setGrade(e.target.value as DriverGrade)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Object.entries(DriverGradeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">변경 사유</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
              placeholder="등급 변경 사유를 입력하세요"
            />
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? '변경 중...' : '등급 변경'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function DocumentItem({
  label,
  value,
  hasImage,
}: {
  label: string;
  value?: string;
  hasImage: boolean;
}) {
  return (
    <div className="flex items-center gap-2 text-sm">
      <FileText size={16} className={hasImage ? 'text-green-600' : 'text-gray-400'} />
      <span className="text-gray-600">{label}:</span>
      <span className="font-medium">{value || '-'}</span>
      {hasImage && <span className="text-xs text-green-600">(이미지 첨부됨)</span>}
    </div>
  );
}

function getVerificationStyle(status: VerificationStatus) {
  switch (status) {
    case VerificationStatus.PENDING:
      return 'bg-yellow-100 text-yellow-800';
    case VerificationStatus.VERIFYING:
      return 'bg-blue-100 text-blue-800';
    case VerificationStatus.VERIFIED:
      return 'bg-green-100 text-green-800';
    case VerificationStatus.FAILED:
    case VerificationStatus.REJECTED:
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

function getVerificationLabel(status: VerificationStatus) {
  switch (status) {
    case VerificationStatus.PENDING:
      return '검증 대기';
    case VerificationStatus.VERIFYING:
      return '검증 중';
    case VerificationStatus.VERIFIED:
      return '검증 완료';
    case VerificationStatus.FAILED:
      return '검증 실패';
    case VerificationStatus.REJECTED:
      return '검증 거절';
    default:
      return status;
  }
}

function DriverDetailModal({
  driver,
  onClose,
}: {
  driver: Driver;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">기사 상세 정보</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* 기본 정보 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 pb-2 border-b">기본 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">이름</label>
              <p className="font-medium">{driver.name || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">이메일</label>
              <p className="font-medium">{driver.email || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">전화번호</label>
              <p className="font-medium">{driver.phone || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">등급</label>
              <p className="font-medium">{driver.grade ? DriverGradeLabels[driver.grade] : '미설정'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">평점</label>
              <p className="font-medium flex items-center gap-1">
                <Star size={16} className="text-yellow-500" />
                {driver.averageRating?.toFixed(1) || '0.0'} ({driver.totalRatings}건)
              </p>
            </div>
            <div>
              <label className="text-sm text-gray-500">완료 건수</label>
              <p className="font-medium">{driver.totalCompletedDispatches || 0}건</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">경고 횟수</label>
              <p className="font-medium">{driver.warningCount || 0}회</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">상태</label>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getVerificationStyle(driver.verificationStatus)}`}>
                {getVerificationLabel(driver.verificationStatus)}
              </span>
            </div>
          </div>
        </div>

        {/* 사업자 정보 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 pb-2 border-b">사업자 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">사업자등록번호</label>
              <p className="font-medium">{driver.businessRegistrationNumber || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">상호명</label>
              <p className="font-medium">{driver.businessName || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">운전면허번호</label>
              <p className="font-medium">{driver.driverLicenseNumber || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">서류 상태</label>
              <div className="flex gap-2">
                <span className={`text-xs ${driver.businessRegistrationImage ? 'text-green-600' : 'text-gray-400'}`}>
                  사업자등록증 {driver.businessRegistrationImage ? '✓' : '✗'}
                </span>
                <span className={`text-xs ${driver.driverLicenseImage ? 'text-green-600' : 'text-gray-400'}`}>
                  운전면허증 {driver.driverLicenseImage ? '✓' : '✗'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 장비 정보 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 pb-2 border-b">보유 장비</h3>
          {driver.equipments && driver.equipments.length > 0 ? (
            <div className="space-y-2">
              {driver.equipments.map((eq, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-lg">
                  <p className="font-medium">{EquipmentTypeLabels[eq.type] || eq.type}</p>
                  <div className="text-sm text-gray-600">
                    {eq.model && <span>모델: {eq.model}</span>}
                    {eq.tonnage && <span className="ml-3">톤수: {eq.tonnage}</span>}
                    {eq.vehicleNumber && <span className="ml-3">차량번호: {eq.vehicleNumber}</span>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">등록된 장비가 없습니다</p>
          )}
        </div>

        {/* 가입일/승인일 */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3 pb-2 border-b">가입 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">가입일</label>
              <p className="font-medium">{dayjs(driver.createdAt).format('YYYY-MM-DD HH:mm')}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">승인일</label>
              <p className="font-medium">{driver.approvedAt ? dayjs(driver.approvedAt).format('YYYY-MM-DD HH:mm') : '-'}</p>
            </div>
          </div>
        </div>

        <div className="flex justify-end">
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
