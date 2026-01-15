import { useEffect, useState } from 'react';
import { getPendingDrivers, approveDriver, rejectDriver } from '../api/admin';
import { Driver, VerificationStatus, EquipmentTypeLabels } from '../types';
import { Check, X, Loader2, FileText, User, Phone, Mail } from 'lucide-react';
import dayjs from 'dayjs';

export default function DriversPage() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);

  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await getPendingDrivers();
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

  const handleApprove = async (id: number) => {
    if (!confirm('이 기사를 승인하시겠습니까?')) return;

    setProcessingId(id);
    try {
      const response = await approveDriver(id);
      if (response.success) {
        setDrivers(drivers.filter((d) => d.id !== id));
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
        setDrivers(drivers.filter((d) => d.id !== id));
      }
    } catch (error) {
      console.error('Failed to reject driver:', error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">기사 승인 관리</h1>

      {drivers.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          승인 대기 중인 기사가 없습니다.
        </div>
      ) : (
        <div className="grid gap-4">
          {drivers.map((driver) => (
            <DriverCard
              key={driver.id}
              driver={driver}
              onApprove={() => handleApprove(driver.id)}
              onReject={() => handleReject(driver.id)}
              processing={processingId === driver.id}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function DriverCard({
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
        {/* Driver Info */}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User size={24} className="text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">{driver.user.name}</h3>
              <p className="text-sm text-gray-500">
                가입일: {dayjs(driver.createdAt).format('YYYY-MM-DD')}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div className="flex items-center gap-2 text-gray-600">
              <Mail size={16} />
              {driver.user.email}
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Phone size={16} />
              {driver.user.phone}
            </div>
          </div>

          {/* Documents */}
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

          {/* Equipment */}
          {driver.equipments && driver.equipments.length > 0 && (
            <div className="pt-3 border-t space-y-2">
              <h4 className="font-medium text-sm text-gray-700">보유 장비</h4>
              <div className="flex flex-wrap gap-2">
                {driver.equipments.map((eq, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-gray-100 rounded-full text-sm"
                  >
                    {EquipmentTypeLabels[eq.type]}
                    {eq.model && ` - ${eq.model}`}
                    {eq.vehicleNumber && ` (${eq.vehicleNumber})`}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Verification Status */}
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

        {/* Actions */}
        <div className="flex lg:flex-col gap-2">
          <button
            onClick={onApprove}
            disabled={processing}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
          >
            {processing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <Check size={18} />
            )}
            승인
          </button>
          <button
            onClick={onReject}
            disabled={processing}
            className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {processing ? (
              <Loader2 size={18} className="animate-spin" />
            ) : (
              <X size={18} />
            )}
            거절
          </button>
        </div>
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
      {hasImage && (
        <span className="text-xs text-green-600">(이미지 첨부됨)</span>
      )}
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
