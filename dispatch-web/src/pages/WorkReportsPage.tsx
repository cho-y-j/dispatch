import { useState, useEffect, useRef } from 'react';
import { useAuthStore } from '../store/authStore';
import {
  getCompanyWorkReports,
  getAllWorkReports,
  signByCompany,
} from '../api/workReport';
import {
  WorkReport,
  UserRole,
  MatchStatusLabels,
  MatchStatus,
} from '../types';
import {
  FileText,
  MapPin,
  Clock,
  User,
  Building2,
  Truck,
  CheckCircle2,
  XCircle,
  PenTool,
  X,
  Download,
  Search,
  Calendar,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import dayjs from 'dayjs';

export default function WorkReportsPage() {
  const { user } = useAuthStore();
  const [reports, setReports] = useState<WorkReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<WorkReport | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFilter, setDateFilter] = useState<string>('');
  const [confirmFilter, setConfirmFilter] = useState<'ALL' | 'CONFIRMED' | 'PENDING'>('ALL');

  const isAdmin = user?.role === UserRole.ADMIN;

  const fetchReports = async () => {
    setLoading(true);
    try {
      const response = isAdmin
        ? await getAllWorkReports()
        : await getCompanyWorkReports();
      if (response.success && response.data) {
        setReports(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch work reports:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [isAdmin]);

  const filteredReports = reports.filter((report) => {
    // Search filter
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch =
      !searchTerm ||
      report.siteAddress.toLowerCase().includes(searchLower) ||
      report.driverName.toLowerCase().includes(searchLower) ||
      (report.companyName?.toLowerCase().includes(searchLower) ?? false);

    // Date filter
    const matchesDate =
      !dateFilter || report.workDate === dateFilter;

    // Confirmation filter
    const matchesConfirm =
      confirmFilter === 'ALL' ||
      (confirmFilter === 'CONFIRMED' && report.companyConfirmed) ||
      (confirmFilter === 'PENDING' && !report.companyConfirmed);

    return matchesSearch && matchesDate && matchesConfirm;
  });

  const handleViewDetail = (report: WorkReport) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  const handleOpenSign = (report: WorkReport) => {
    setSelectedReport(report);
    setShowSignModal(true);
  };

  const handleSignComplete = () => {
    setShowSignModal(false);
    setSelectedReport(null);
    fetchReports();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">작업 확인서</h1>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="주소, 기사명, 발주처..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Date Filter */}
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Confirmation Filter */}
          <div>
            <select
              value={confirmFilter}
              onChange={(e) => setConfirmFilter(e.target.value as 'ALL' | 'CONFIRMED' | 'PENDING')}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="ALL">전체</option>
              <option value="CONFIRMED">발주처 확인완료</option>
              <option value="PENDING">확인 대기</option>
            </select>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-500">
              총 <span className="font-semibold text-gray-900">{filteredReports.length}</span>건
            </span>
            <span className="text-green-600">
              확인 <span className="font-semibold">{filteredReports.filter(r => r.companyConfirmed).length}</span>
            </span>
            <span className="text-orange-600">
              대기 <span className="font-semibold">{filteredReports.filter(r => !r.companyConfirmed).length}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
          작업 확인서가 없습니다.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업일
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  현장
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  기사
                </th>
                {isAdmin && (
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    발주처
                  </th>
                )}
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  금액
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  서명상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  발주처확인
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredReports.map((report) => (
                <tr key={report.dispatchId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {dayjs(report.workDate).format('YYYY-MM-DD')}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    <div className="max-w-xs truncate" title={report.siteAddress}>
                      {report.siteAddress}
                    </div>
                    {report.equipmentTypeName && (
                      <div className="text-xs text-gray-500">{report.equipmentTypeName}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.driverName}
                  </td>
                  {isAdmin && (
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {report.companyName || '-'}
                    </td>
                  )}
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {report.finalPrice?.toLocaleString() || report.originalPrice?.toLocaleString() || '-'}원
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <SignatureStatus report={report} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {report.companyConfirmed ? (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <CheckCircle2 size={14} />
                        확인완료
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                        <Clock size={14} />
                        대기중
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleViewDetail(report)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        상세
                      </button>
                      {!isAdmin && !report.companyConfirmed && report.clientSignature && (
                        <button
                          onClick={() => handleOpenSign(report)}
                          className="text-green-600 hover:text-green-900"
                        >
                          확인/서명
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedReport && (
        <WorkReportDetailModal
          report={selectedReport}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedReport(null);
          }}
        />
      )}

      {/* Sign Modal */}
      {showSignModal && selectedReport && (
        <CompanySignModal
          report={selectedReport}
          onClose={() => {
            setShowSignModal(false);
            setSelectedReport(null);
          }}
          onComplete={handleSignComplete}
        />
      )}
    </div>
  );
}

function SignatureStatus({ report }: { report: WorkReport }) {
  const hasDriver = !!report.driverSignature;
  const hasClient = !!report.clientSignature;

  return (
    <div className="flex items-center gap-1">
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
          hasDriver ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}
        title="기사 서명"
      >
        기사 {hasDriver ? '완료' : '-'}
      </span>
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${
          hasClient ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        }`}
        title="현장 서명"
      >
        현장 {hasClient ? '완료' : '-'}
      </span>
    </div>
  );
}

function WorkReportDetailModal({
  report,
  onClose,
}: {
  report: WorkReport;
  onClose: () => void;
}) {
  const [expanded, setExpanded] = useState({
    dispatch: true,
    times: true,
    signatures: true,
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">작업 확인서 상세</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Dispatch Info */}
          <CollapsibleSection
            title="배차 정보"
            icon={<FileText size={20} />}
            expanded={expanded.dispatch}
            onToggle={() => setExpanded({ ...expanded, dispatch: !expanded.dispatch })}
          >
            <div className="grid grid-cols-2 gap-4">
              <InfoRow label="배차 번호" value={`#${report.dispatchId}`} />
              <InfoRow label="작업일" value={dayjs(report.workDate).format('YYYY년 MM월 DD일')} />
              <InfoRow label="작업 시간" value={report.workTime || '-'} />
              <InfoRow label="장비 종류" value={report.equipmentTypeName || '-'} />
              <InfoRow label="현장 주소" value={report.siteAddress} fullWidth />
              {report.siteDetail && (
                <InfoRow label="상세 주소" value={report.siteDetail} fullWidth />
              )}
              {report.workDescription && (
                <InfoRow label="작업 내용" value={report.workDescription} fullWidth />
              )}
            </div>
          </CollapsibleSection>

          {/* People Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Driver */}
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Truck className="text-blue-600" size={20} />
                <h3 className="font-semibold text-blue-900">기사 정보</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">이름</span>
                  <span className="font-medium text-blue-900">{report.driverName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">연락처</span>
                  <span className="font-medium text-blue-900">{report.driverPhone}</span>
                </div>
              </div>
            </div>

            {/* Company */}
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="text-purple-600" size={20} />
                <h3 className="font-semibold text-purple-900">발주처 정보</h3>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-purple-700">회사명</span>
                  <span className="font-medium text-purple-900">{report.companyName || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">담당자</span>
                  <span className="font-medium text-purple-900">{report.staffName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-purple-700">연락처</span>
                  <span className="font-medium text-purple-900">{report.staffPhone}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Price Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-3">금액 정보</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-sm text-gray-500">기본 금액</div>
                <div className="text-lg font-bold text-gray-900">
                  {report.originalPrice?.toLocaleString() || '-'}원
                </div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg">
                <div className="text-sm text-gray-500">최종 금액</div>
                <div className="text-lg font-bold text-blue-600">
                  {report.finalPrice?.toLocaleString() || report.originalPrice?.toLocaleString() || '-'}원
                </div>
              </div>
            </div>
          </div>

          {/* Times */}
          <CollapsibleSection
            title="작업 시간 기록"
            icon={<Clock size={20} />}
            expanded={expanded.times}
            onToggle={() => setExpanded({ ...expanded, times: !expanded.times })}
          >
            <div className="space-y-3">
              <TimeRow label="배차 수락" time={report.matchedAt} />
              <TimeRow label="현장 출발" time={report.departedAt} />
              <TimeRow label="현장 도착" time={report.arrivedAt} />
              <TimeRow label="작업 시작" time={report.workStartedAt} />
              <TimeRow label="작업 완료" time={report.completedAt} />
            </div>
          </CollapsibleSection>

          {/* Signatures */}
          <CollapsibleSection
            title="전자서명"
            icon={<PenTool size={20} />}
            expanded={expanded.signatures}
            onToggle={() => setExpanded({ ...expanded, signatures: !expanded.signatures })}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Driver Signature */}
              <SignatureCard
                label="기사 서명"
                signature={report.driverSignature}
                signedAt={report.driverSignedAt}
                signerName={report.driverName}
              />
              {/* Client Signature */}
              <SignatureCard
                label="현장 담당자 서명"
                signature={report.clientSignature}
                signedAt={report.clientSignedAt}
                signerName={report.clientName}
              />
              {/* Company Signature */}
              <SignatureCard
                label="발주처 확인"
                signature={report.companySignature}
                signedAt={report.companySignedAt}
                signerName={report.companySignedBy}
                confirmed={report.companyConfirmed}
              />
            </div>
          </CollapsibleSection>

          {/* Work Notes */}
          {report.workNotes && (
            <div className="bg-yellow-50 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-900 mb-2">작업 메모</h3>
              <p className="text-sm text-yellow-800 whitespace-pre-wrap">{report.workNotes}</p>
            </div>
          )}

          {/* Work Report PDF */}
          {report.workReportUrl && (
            <div className="flex justify-center">
              <a
                href={report.workReportUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <Download size={20} />
                작업 확인서 PDF 다운로드
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function CollapsibleSection({
  title,
  icon,
  expanded,
  onToggle,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  expanded: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="border rounded-lg">
      <button
        onClick={onToggle}
        className="w-full px-4 py-3 flex items-center justify-between bg-gray-50 hover:bg-gray-100 rounded-t-lg"
      >
        <div className="flex items-center gap-2 font-semibold text-gray-900">
          {icon}
          {title}
        </div>
        {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
      </button>
      {expanded && <div className="p-4">{children}</div>}
    </div>
  );
}

function InfoRow({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'col-span-2' : ''}>
      <div className="text-sm text-gray-500">{label}</div>
      <div className="font-medium text-gray-900">{value}</div>
    </div>
  );
}

function TimeRow({ label, time }: { label: string; time?: string }) {
  return (
    <div className="flex items-center justify-between py-2 border-b last:border-b-0">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium text-gray-900">
        {time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '-'}
      </span>
    </div>
  );
}

function SignatureCard({
  label,
  signature,
  signedAt,
  signerName,
  confirmed,
}: {
  label: string;
  signature?: string;
  signedAt?: string;
  signerName?: string;
  confirmed?: boolean;
}) {
  const hasSignature = !!signature || confirmed;

  return (
    <div className={`border rounded-lg p-4 ${hasSignature ? 'bg-green-50 border-green-200' : 'bg-gray-50'}`}>
      <div className="text-sm font-medium text-gray-700 mb-2">{label}</div>
      {signature ? (
        <div className="bg-white rounded border p-2 mb-2">
          <img src={signature} alt={label} className="max-h-24 mx-auto" />
        </div>
      ) : confirmed ? (
        <div className="flex items-center justify-center py-4 text-green-600">
          <CheckCircle2 size={32} />
        </div>
      ) : (
        <div className="flex items-center justify-center py-4 text-gray-400">
          <XCircle size={32} />
        </div>
      )}
      {signerName && (
        <div className="text-sm text-gray-600 text-center">{signerName}</div>
      )}
      {signedAt && (
        <div className="text-xs text-gray-500 text-center mt-1">
          {dayjs(signedAt).format('YYYY-MM-DD HH:mm')}
        </div>
      )}
    </div>
  );
}

function CompanySignModal({
  report,
  onClose,
  onComplete,
}: {
  report: WorkReport;
  onClose: () => void;
  onComplete: () => void;
}) {
  const { user } = useAuthStore();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signerName, setSignerName] = useState(user?.name || '');
  const [loading, setLoading] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set up canvas
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Clear canvas with white background
    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  }, []);

  const getCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    if ('touches' in e) {
      return {
        x: e.touches[0].clientX - rect.left,
        y: e.touches[0].clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;

    ctx.fillStyle = '#fff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSubmit = async () => {
    if (!signerName.trim()) {
      alert('확인자 이름을 입력해주세요.');
      return;
    }

    setLoading(true);
    try {
      const canvas = canvasRef.current;
      const signature = hasSignature && canvas ? canvas.toDataURL('image/png') : undefined;

      await signByCompany(report.dispatchId, {
        signature,
        clientName: signerName,
      });

      alert('발주처 확인이 완료되었습니다.');
      onComplete();
    } catch (error) {
      console.error('Failed to sign:', error);
      alert('확인 처리에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg">
        {/* Header */}
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">발주처 확인/서명</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Report Summary */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <span className="text-gray-500">작업일:</span>{' '}
                <span className="font-medium">{dayjs(report.workDate).format('YYYY-MM-DD')}</span>
              </div>
              <div>
                <span className="text-gray-500">기사:</span>{' '}
                <span className="font-medium">{report.driverName}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">현장:</span>{' '}
                <span className="font-medium">{report.siteAddress}</span>
              </div>
              <div className="col-span-2">
                <span className="text-gray-500">금액:</span>{' '}
                <span className="font-medium text-blue-600">
                  {(report.finalPrice || report.originalPrice)?.toLocaleString()}원
                </span>
              </div>
            </div>
          </div>

          {/* Signer Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              확인자 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="확인자 이름을 입력하세요"
            />
          </div>

          {/* Signature Canvas */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700">
                서명 (선택)
              </label>
              <button
                onClick={clearSignature}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                지우기
              </button>
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={400}
                height={150}
                className="w-full cursor-crosshair touch-none"
                onMouseDown={startDrawing}
                onMouseMove={draw}
                onMouseUp={stopDrawing}
                onMouseLeave={stopDrawing}
                onTouchStart={startDrawing}
                onTouchMove={draw}
                onTouchEnd={stopDrawing}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              서명은 선택사항입니다. 이름만 입력해도 확인 처리됩니다.
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              취소
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || !signerName.trim()}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  처리 중...
                </>
              ) : (
                <>
                  <CheckCircle2 size={20} />
                  확인 완료
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
