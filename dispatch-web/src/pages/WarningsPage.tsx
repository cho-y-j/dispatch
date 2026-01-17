import { useState, useEffect } from 'react';
import { AlertTriangle, Ban, Plus, Clock, User, Building2 } from 'lucide-react';
import {
  Warning,
  Suspension,
  WarningUserType,
  WarningType,
  WarningTypeLabels,
  SuspensionType,
  SuspensionTypeLabels,
} from '../types';
import {
  getAllWarnings,
  getAllSuspensions,
  getActiveSuspensions,
  createWarning,
  createSuspension,
  liftSuspension,
  CreateWarningRequest,
  CreateSuspensionRequest,
} from '../api/admin';

type TabType = 'warnings' | 'suspensions';

export default function WarningsPage() {
  const [activeTab, setActiveTab] = useState<TabType>('warnings');
  const [warnings, setWarnings] = useState<Warning[]>([]);
  const [suspensions, setSuspensions] = useState<Suspension[]>([]);
  const [loading, setLoading] = useState(true);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showSuspensionModal, setShowSuspensionModal] = useState(false);
  const [showActiveOnly, setShowActiveOnly] = useState(true);

  useEffect(() => {
    loadData();
  }, [activeTab, showActiveOnly]);

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'warnings') {
        const response = await getAllWarnings();
        if (response.success && response.data) {
          setWarnings(response.data);
        }
      } else {
        const response = showActiveOnly
          ? await getActiveSuspensions()
          : await getAllSuspensions();
        if (response.success && response.data) {
          setSuspensions(response.data);
        }
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLiftSuspension = async (id: number) => {
    if (!confirm('이 정지를 해제하시겠습니까?')) return;
    try {
      const response = await liftSuspension(id);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to lift suspension:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">경고/정지 관리</h1>
          <p className="text-gray-600">사용자 경고 및 정지 관리</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowWarningModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700"
          >
            <AlertTriangle className="w-5 h-5" />
            경고 부여
          </button>
          <button
            onClick={() => setShowSuspensionModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Ban className="w-5 h-5" />
            정지 처리
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('warnings')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'warnings'
              ? 'bg-orange-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          경고 목록
        </button>
        <button
          onClick={() => setActiveTab('suspensions')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'suspensions'
              ? 'bg-red-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          정지 목록
        </button>
      </div>

      {activeTab === 'suspensions' && (
        <div className="mb-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showActiveOnly}
              onChange={(e) => setShowActiveOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            활성 정지만 표시
          </label>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : activeTab === 'warnings' ? (
        <WarningsTable warnings={warnings} />
      ) : (
        <SuspensionsTable suspensions={suspensions} onLift={handleLiftSuspension} />
      )}

      {showWarningModal && (
        <CreateWarningModal
          onClose={() => setShowWarningModal(false)}
          onSuccess={() => {
            setShowWarningModal(false);
            loadData();
          }}
        />
      )}

      {showSuspensionModal && (
        <CreateSuspensionModal
          onClose={() => setShowSuspensionModal(false)}
          onSuccess={() => {
            setShowSuspensionModal(false);
            loadData();
          }}
        />
      )}
    </div>
  );
}

function WarningsTable({ warnings }: { warnings: Warning[] }) {
  if (warnings.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>경고 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">대상</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사유</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">처리자</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">일시</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {warnings.map((warning) => (
            <tr key={warning.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {warning.userType === WarningUserType.DRIVER ? (
                    <User className="w-5 h-5 text-gray-400 mr-2" />
                  ) : (
                    <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{warning.userName || `ID: ${warning.userId}`}</div>
                    <div className="text-xs text-gray-500">
                      {warning.userType === WarningUserType.DRIVER ? '기사' : '발주처'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-orange-100 text-orange-800">
                  {WarningTypeLabels[warning.type]}
                </span>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-900 max-w-xs truncate">{warning.reason}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {warning.createdByName || `ID: ${warning.createdBy}`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(warning.createdAt).toLocaleString()}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function SuspensionsTable({
  suspensions,
  onLift,
}: {
  suspensions: Suspension[];
  onLift: (id: number) => void;
}) {
  if (suspensions.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Ban className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <p>정지 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">대상</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">유형</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">사유</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">기간</th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">상태</th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">작업</th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {suspensions.map((suspension) => (
            <tr key={suspension.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {suspension.userType === WarningUserType.DRIVER ? (
                    <User className="w-5 h-5 text-gray-400 mr-2" />
                  ) : (
                    <Building2 className="w-5 h-5 text-gray-400 mr-2" />
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{suspension.userName || `ID: ${suspension.userId}`}</div>
                    <div className="text-xs text-gray-500">
                      {suspension.userType === WarningUserType.DRIVER ? '기사' : '발주처'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  suspension.type === SuspensionType.PERMANENT
                    ? 'bg-red-100 text-red-800'
                    : 'bg-orange-100 text-orange-800'
                }`}>
                  {SuspensionTypeLabels[suspension.type]}
                </span>
              </td>
              <td className="px-6 py-4">
                <p className="text-sm text-gray-900 max-w-xs truncate">{suspension.reason}</p>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {new Date(suspension.startDate).toLocaleDateString()}
                {suspension.endDate && ` ~ ${new Date(suspension.endDate).toLocaleDateString()}`}
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                  suspension.isActive
                    ? 'bg-red-100 text-red-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {suspension.isActive ? '활성' : '해제됨'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right">
                {suspension.isActive && (
                  <button
                    onClick={() => onLift(suspension.id)}
                    className="text-blue-600 hover:text-blue-900 text-sm font-medium"
                  >
                    해제
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function CreateWarningModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateWarningRequest>({
    userId: 0,
    userType: WarningUserType.DRIVER,
    type: WarningType.OTHER,
    reason: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await createWarning(formData);
      if (response.success) {
        alert('경고가 부여되었습니다.');
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create warning:', error);
      alert('경고 부여에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">경고 부여</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대상 유형 *</label>
            <select
              value={formData.userType}
              onChange={(e) => setFormData({ ...formData, userType: e.target.value as WarningUserType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={WarningUserType.DRIVER}>기사</option>
              <option value={WarningUserType.COMPANY}>발주처</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대상 ID *</label>
            <input
              type="number"
              required
              value={formData.userId || ''}
              onChange={(e) => setFormData({ ...formData, userId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="기사/발주처 ID 입력"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">경고 유형 *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as WarningType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              {Object.entries(WarningTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사유 *</label>
            <textarea
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
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
              className="flex-1 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '경고 부여'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateSuspensionModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateSuspensionRequest>({
    userId: 0,
    userType: WarningUserType.DRIVER,
    type: SuspensionType.TEMP,
    reason: '',
    days: 3,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await createSuspension(formData);
      if (response.success) {
        alert('정지 처리되었습니다.');
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create suspension:', error);
      alert('정지 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">정지 처리</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대상 유형 *</label>
            <select
              value={formData.userType}
              onChange={(e) => setFormData({ ...formData, userType: e.target.value as WarningUserType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={WarningUserType.DRIVER}>기사</option>
              <option value={WarningUserType.COMPANY}>발주처</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대상 ID *</label>
            <input
              type="number"
              required
              value={formData.userId || ''}
              onChange={(e) => setFormData({ ...formData, userId: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              placeholder="기사/발주처 ID 입력"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">정지 유형 *</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value as SuspensionType })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value={SuspensionType.TEMP}>일시 정지</option>
              <option value={SuspensionType.PERMANENT}>영구 정지</option>
            </select>
          </div>
          {formData.type === SuspensionType.TEMP && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">정지 기간 (일) *</label>
              <input
                type="number"
                min="1"
                required
                value={formData.days || ''}
                onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사유 *</label>
            <textarea
              required
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              rows={3}
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
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              {loading ? '처리 중...' : '정지 처리'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
