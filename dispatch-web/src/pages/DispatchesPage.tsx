import { useState } from 'react';
import { useAuthStore } from '../store/authStore';
import { getMyDispatches, getAllDispatches, createDispatch } from '../api/dispatch';
import { createRating, RatingRequest } from '../api/rating';
import {
  Dispatch,
  CreateDispatchRequest,
  UserRole,
  DispatchStatus,
  DispatchStatusLabels,
  EquipmentType,
  EquipmentTypeLabels,
  SenderType,
} from '../types';
import { Plus, X, MapPin, Clock, Loader2, Search, Star, AlertCircle, MessageCircle } from 'lucide-react';
import dayjs from 'dayjs';
import { useKakaoAddress, AddressResult } from '../hooks/useKakaoAddress';
import { useEffect } from 'react';
import ChatPanel from '../components/ChatPanel';

export default function DispatchesPage() {
  const { user } = useAuthStore();
  const [dispatches, setDispatches] = useState<Dispatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showChatModal, setShowChatModal] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<Dispatch | null>(null);
  const [chatDispatch, setChatDispatch] = useState<Dispatch | null>(null);
  const [filter, setFilter] = useState<DispatchStatus | 'ALL'>('ALL');

  const isAdmin = user?.role === UserRole.ADMIN;

  const fetchDispatches = async () => {
    setLoading(true);
    try {
      const response = isAdmin ? await getAllDispatches() : await getMyDispatches();
      if (response.success && response.data) {
        setDispatches(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dispatches:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDispatches();
  }, [isAdmin]);

  const filteredDispatches =
    filter === 'ALL'
      ? dispatches
      : dispatches.filter((d) => d.status === filter);

  const handleCreateDispatch = async (data: CreateDispatchRequest) => {
    try {
      const response = await createDispatch(data);
      if (response.success) {
        setShowModal(false);
        fetchDispatches();
      }
    } catch (error) {
      console.error('Failed to create dispatch:', error);
    }
  };

  const handleRateDriver = (dispatch: Dispatch) => {
    setSelectedDispatch(dispatch);
    setShowRatingModal(true);
  };

  const handleOpenChat = (dispatch: Dispatch) => {
    setChatDispatch(dispatch);
    setShowChatModal(true);
  };

  const handleSubmitRating = async (rating: number, comment?: string) => {
    if (!selectedDispatch) return;

    try {
      const response = await createRating(selectedDispatch.id, { rating, comment });
      if (response.success) {
        setShowRatingModal(false);
        setSelectedDispatch(null);
        fetchDispatches();
        alert('평가가 등록되었습니다.');
      }
    } catch (error) {
      console.error('Failed to submit rating:', error);
      alert('평가 등록에 실패했습니다.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">배차 관리</h1>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          배차 등록
        </button>
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <FilterButton
          active={filter === 'ALL'}
          onClick={() => setFilter('ALL')}
          label="전체"
          count={dispatches.length}
        />
        {Object.values(DispatchStatus).map((status) => (
          <FilterButton
            key={status}
            active={filter === status}
            onClick={() => setFilter(status)}
            label={DispatchStatusLabels[status]}
            count={dispatches.filter((d) => d.status === status).length}
          />
        ))}
      </div>

      {/* Dispatch List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filteredDispatches.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          등록된 배차가 없습니다.
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredDispatches.map((dispatch) => (
            <DispatchCard
              key={dispatch.id}
              dispatch={dispatch}
              onRate={() => handleRateDriver(dispatch)}
              onChat={() => handleOpenChat(dispatch)}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      {showModal && (
        <CreateDispatchModal
          onClose={() => setShowModal(false)}
          onSubmit={handleCreateDispatch}
        />
      )}

      {/* Rating Modal */}
      {showRatingModal && selectedDispatch && (
        <RatingModal
          dispatch={selectedDispatch}
          onClose={() => {
            setShowRatingModal(false);
            setSelectedDispatch(null);
          }}
          onSubmit={handleSubmitRating}
        />
      )}

      {/* Chat Modal */}
      {showChatModal && chatDispatch && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="w-full max-w-lg h-[600px]">
            <ChatPanel
              dispatchId={chatDispatch.id}
              currentUserType={isAdmin ? SenderType.COMPANY : SenderType.COMPANY}
              onClose={() => {
                setShowChatModal(false);
                setChatDispatch(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function FilterButton({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  count: number;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
        active
          ? 'bg-blue-600 text-white'
          : 'bg-white text-gray-600 hover:bg-gray-50'
      }`}
    >
      {label} ({count})
    </button>
  );
}

function DispatchCard({
  dispatch,
  onRate,
  onChat
}: {
  dispatch: Dispatch;
  onRate: () => void;
  onChat: () => void;
}) {
  const canRate = dispatch.status === DispatchStatus.COMPLETED &&
                  dispatch.match &&
                  !dispatch.rating;
  const canChat = dispatch.match !== null && dispatch.match !== undefined;

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            {dispatch.isUrgent && (
              <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-medium rounded flex items-center gap-1">
                <AlertCircle size={12} />
                긴급
              </span>
            )}
            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded">
              {EquipmentTypeLabels[dispatch.equipmentType]}
            </span>
            <span
              className={`px-2 py-1 text-xs font-medium rounded ${getStatusStyle(
                dispatch.status
              )}`}
            >
              {DispatchStatusLabels[dispatch.status]}
            </span>
          </div>

          <div className="flex items-start gap-2 text-gray-700 mb-2">
            <MapPin size={16} className="mt-0.5 flex-shrink-0" />
            <span>{dispatch.siteAddress}</span>
          </div>

          <div className="flex items-center gap-4 text-sm text-gray-500">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              {dayjs(dispatch.workDate).format('MM/DD')} {dispatch.workTime.slice(0, 5)}
            </div>
            {dispatch.price && (
              <span className="font-medium text-green-600">
                {dispatch.price.toLocaleString()}원
              </span>
            )}
            {dispatch.priceNegotiable && (
              <span className="text-orange-600">협의</span>
            )}
          </div>

          {dispatch.match && (
            <div className="mt-3 pt-3 border-t text-sm flex items-center justify-between">
              <div>
                <span className="text-gray-500">배정 기사:</span>{' '}
                <span className="font-medium">{(dispatch.match as any).driverName || dispatch.match.driver?.user?.name || '기사'}</span>
              </div>
              {dispatch.rating && (
                <div className="flex items-center gap-1 text-yellow-500">
                  <Star size={16} fill="currentColor" />
                  <span className="font-medium">{dispatch.rating.rating}</span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 ml-4">
          {canChat && (
            <button
              onClick={onChat}
              className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200 transition-colors flex items-center gap-1"
            >
              <MessageCircle size={16} />
              채팅
            </button>
          )}
          {canRate && (
            <button
              onClick={onRate}
              className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200 transition-colors flex items-center gap-1"
            >
              <Star size={16} />
              평가하기
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function RatingModal({
  dispatch,
  onClose,
  onSubmit,
}: {
  dispatch: Dispatch;
  onClose: () => void;
  onSubmit: (rating: number, comment?: string) => Promise<void>;
}) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(rating, comment || undefined);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">기사 평가</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">
              기사: <span className="font-medium text-gray-900">{(dispatch.match as any)?.driverName || dispatch.match?.driver?.user?.name || '기사'}</span>
            </p>
            <p className="text-sm text-gray-600">
              작업 장소: <span className="font-medium text-gray-900">{dispatch.siteAddress}</span>
            </p>
          </div>

          <div className="text-center">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              별점을 선택해주세요
            </label>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  onMouseEnter={() => setHoveredStar(star)}
                  onMouseLeave={() => setHoveredStar(null)}
                  className="p-1 transition-transform hover:scale-110"
                >
                  <Star
                    size={36}
                    className={`transition-colors ${
                      (hoveredStar !== null ? star <= hoveredStar : star <= rating)
                        ? 'text-yellow-400 fill-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
            <p className="text-lg font-medium text-gray-900 mt-2">
              {rating === 1 && '매우 불만족'}
              {rating === 2 && '불만족'}
              {rating === 3 && '보통'}
              {rating === 4 && '만족'}
              {rating === 5 && '매우 만족'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              코멘트 (선택)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              placeholder="작업에 대한 평가를 남겨주세요"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  등록 중...
                </>
              ) : (
                <>
                  <Star size={16} />
                  평가 등록
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateDispatchModal({
  onClose,
  onSubmit,
}: {
  onClose: () => void;
  onSubmit: (data: CreateDispatchRequest) => Promise<void>;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateDispatchRequest>({
    siteAddress: '',
    workDate: dayjs().add(1, 'day').format('YYYY-MM-DD'),
    workTime: '09:00',
    equipmentType: EquipmentType.HIGH_LIFT_TRUCK,
    priceNegotiable: true,
  });
  const { openAddressSearch } = useKakaoAddress();

  const handleAddressSearch = () => {
    openAddressSearch((result: AddressResult) => {
      setFormData((prev) => ({
        ...prev,
        siteAddress: result.address,
        latitude: result.latitude,
        longitude: result.longitude,
      }));
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onSubmit(formData);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">배차 등록</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              현장 주소 *
            </label>
            <div className="flex gap-2">
              <div className="flex-1 relative">
                <MapPin size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={formData.siteAddress}
                  readOnly
                  className="w-full pl-10 pr-3 py-2 border rounded-lg bg-gray-50 cursor-pointer focus:ring-2 focus:ring-blue-500 outline-none"
                  placeholder="주소를 검색하세요"
                  onClick={handleAddressSearch}
                  required
                />
              </div>
              <button
                type="button"
                onClick={handleAddressSearch}
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center gap-2"
              >
                <Search size={18} />
                검색
              </button>
            </div>
            {formData.latitude && formData.longitude && (
              <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                <span className="inline-block w-2 h-2 bg-green-500 rounded-full"></span>
                좌표 확인됨: {formData.latitude.toFixed(6)}, {formData.longitude.toFixed(6)}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              상세 주소
            </label>
            <input
              type="text"
              value={formData.siteDetail || ''}
              onChange={(e) => setFormData({ ...formData, siteDetail: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              placeholder="OO빌딩 앞"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                작업 날짜 *
              </label>
              <input
                type="date"
                value={formData.workDate}
                onChange={(e) => setFormData({ ...formData, workDate: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                작업 시간 *
              </label>
              <input
                type="time"
                value={formData.workTime}
                onChange={(e) => setFormData({ ...formData, workTime: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              필요 장비 *
            </label>
            <select
              value={formData.equipmentType}
              onChange={(e) =>
                setFormData({ ...formData, equipmentType: e.target.value as EquipmentType })
              }
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
            >
              {Object.values(EquipmentType).map((type) => (
                <option key={type} value={type}>
                  {EquipmentTypeLabels[type]}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                예상 작업 시간
              </label>
              <input
                type="number"
                value={formData.estimatedHours || ''}
                onChange={(e) =>
                  setFormData({ ...formData, estimatedHours: Number(e.target.value) || undefined })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="시간"
                min="1"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                최소 작업 높이 (m)
              </label>
              <input
                type="number"
                value={formData.minHeight || ''}
                onChange={(e) =>
                  setFormData({ ...formData, minHeight: Number(e.target.value) || undefined })
                }
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="미터"
                min="1"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              요금
            </label>
            <div className="flex gap-4">
              <input
                type="number"
                value={formData.price || ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: Number(e.target.value) || undefined,
                    priceNegotiable: !e.target.value,
                  })
                }
                className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="금액 (원)"
                min="0"
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.priceNegotiable}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      priceNegotiable: e.target.checked,
                      price: e.target.checked ? undefined : formData.price,
                    })
                  }
                  className="w-4 h-4 text-blue-600 rounded"
                />
                <span className="text-sm text-gray-600">협의</span>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자 이름
              </label>
              <input
                type="text"
                value={formData.contactName || ''}
                onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="홍길동"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                담당자 연락처
              </label>
              <input
                type="tel"
                value={formData.contactPhone || ''}
                onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="010-1234-5678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              작업 내용
            </label>
            <textarea
              value={formData.workDescription || ''}
              onChange={(e) => setFormData({ ...formData, workDescription: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
              rows={3}
              placeholder="작업 내용을 입력해주세요"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  등록 중...
                </>
              ) : (
                '등록'
              )}
            </button>
          </div>
        </form>
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
