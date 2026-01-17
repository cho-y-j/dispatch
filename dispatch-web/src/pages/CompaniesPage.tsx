import { useState, useEffect } from 'react';
import { Building2, Check, X, Plus, Search, AlertTriangle, Ban, Eye } from 'lucide-react';
import {
  Company,
  CompanyStatus,
  CompanyStatusLabels,
  VerificationStatus,
} from '../types';
import {
  getAllCompanies,
  getPendingCompanies,
  approveCompany,
  rejectCompany,
  deleteCompany,
  createCompany,
  CreateCompanyRequest,
} from '../api/admin';

type TabType = 'all' | 'pending';

export default function CompaniesPage() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    loadCompanies();
  }, [activeTab]);

  const loadCompanies = async () => {
    setLoading(true);
    try {
      const response = activeTab === 'pending'
        ? await getPendingCompanies()
        : await getAllCompanies();
      if (response.success && response.data) {
        setCompanies(response.data);
      }
    } catch (error) {
      console.error('Failed to load companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    if (!confirm('이 발주처를 승인하시겠습니까?')) return;
    setActionLoading(id);
    try {
      const response = await approveCompany(id);
      if (response.success) {
        loadCompanies();
      }
    } catch (error) {
      console.error('Failed to approve company:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (id: number) => {
    const reason = prompt('거절 사유를 입력하세요:');
    if (!reason) return;
    setActionLoading(id);
    try {
      const response = await rejectCompany(id, reason);
      if (response.success) {
        loadCompanies();
      }
    } catch (error) {
      console.error('Failed to reject company:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('이 발주처를 퇴장 처리하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;
    setActionLoading(id);
    try {
      const response = await deleteCompany(id);
      if (response.success) {
        loadCompanies();
      }
    } catch (error) {
      console.error('Failed to delete company:', error);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredCompanies = companies.filter(company =>
    company.name.toLowerCase().includes(searchKeyword.toLowerCase()) ||
    company.businessNumber.includes(searchKeyword)
  );

  const getStatusBadgeColor = (status: CompanyStatus) => {
    switch (status) {
      case CompanyStatus.APPROVED:
        return 'bg-green-100 text-green-800';
      case CompanyStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case CompanyStatus.SUSPENDED:
        return 'bg-orange-100 text-orange-800';
      case CompanyStatus.BANNED:
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">발주처 관리</h1>
          <p className="text-gray-600">발주처(업체) 승인 및 관리</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          <Plus className="w-5 h-5" />
          발주처 등록
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-lg font-medium ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          전체 발주처
        </button>
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
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="회사명 또는 사업자번호로 검색..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>발주처가 없습니다</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  회사 정보
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  담당자
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  상태
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  경고
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  가입일
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  작업
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCompanies.map((company) => (
                <tr key={company.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                          <Building2 className="h-5 w-5 text-blue-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{company.name}</div>
                        <div className="text-sm text-gray-500">{company.businessNumber}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{company.contactName}</div>
                    <div className="text-sm text-gray-500">{company.contactPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadgeColor(company.status)}`}>
                      {CompanyStatusLabels[company.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {company.warningCount > 0 ? (
                      <span className="flex items-center text-orange-600">
                        <AlertTriangle className="w-4 h-4 mr-1" />
                        {company.warningCount}회
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(company.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => {
                          setSelectedCompany(company);
                          setShowDetailModal(true);
                        }}
                        className="text-gray-600 hover:text-gray-900"
                        title="상세보기"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      {company.status === CompanyStatus.PENDING && (
                        <>
                          <button
                            onClick={() => handleApprove(company.id)}
                            disabled={actionLoading === company.id}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                            title="승인"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleReject(company.id)}
                            disabled={actionLoading === company.id}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            title="거절"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      )}
                      {company.status === CompanyStatus.APPROVED && (
                        <button
                          onClick={() => handleDelete(company.id)}
                          disabled={actionLoading === company.id}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          title="퇴장"
                        >
                          <Ban className="w-5 h-5" />
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

      {/* Create Modal */}
      {showCreateModal && (
        <CreateCompanyModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadCompanies();
          }}
        />
      )}

      {/* Detail Modal */}
      {showDetailModal && selectedCompany && (
        <CompanyDetailModal
          company={selectedCompany}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedCompany(null);
          }}
        />
      )}
    </div>
  );
}

function CreateCompanyModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateCompanyRequest>({
    name: '',
    businessNumber: '',
    representative: '',
    address: '',
    phone: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    password: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await createCompany(formData);
      if (response.success) {
        alert('발주처가 등록되었습니다.');
        onSuccess();
      }
    } catch (error) {
      console.error('Failed to create company:', error);
      alert('발주처 등록에 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">발주처 등록</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">회사명 *</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">사업자번호 *</label>
            <input
              type="text"
              required
              placeholder="1234567890"
              value={formData.businessNumber}
              onChange={(e) => setFormData({ ...formData, businessNumber: e.target.value.replace(/\D/g, '').slice(0, 10) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">대표자명 *</label>
            <input
              type="text"
              required
              value={formData.representative}
              onChange={(e) => setFormData({ ...formData, representative: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">주소</label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">회사 전화번호</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <hr />
          <h3 className="font-medium text-gray-900">담당자 정보</h3>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당자 이름 *</label>
            <input
              type="text"
              required
              value={formData.contactName}
              onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당자 이메일 *</label>
            <input
              type="email"
              required
              value={formData.contactEmail}
              onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">담당자 전화번호 *</label>
            <input
              type="tel"
              required
              value={formData.contactPhone}
              onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">초기 비밀번호</label>
            <input
              type="text"
              placeholder="비워두면 자동 생성"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
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
              {loading ? '등록 중...' : '등록'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CompanyDetailModal({ company, onClose }: { company: Company; onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">발주처 상세정보</h2>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">회사명</label>
              <p className="font-medium">{company.name}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">사업자번호</label>
              <p className="font-medium">{company.businessNumber}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">대표자</label>
              <p className="font-medium">{company.representative}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">상태</label>
              <p className="font-medium">{CompanyStatusLabels[company.status]}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">주소</label>
              <p className="font-medium">{company.address || '-'}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">회사 전화번호</label>
              <p className="font-medium">{company.phone || '-'}</p>
            </div>
          </div>
          <hr />
          <h3 className="font-medium text-gray-900">담당자 정보</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">이름</label>
              <p className="font-medium">{company.contactName}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">이메일</label>
              <p className="font-medium">{company.contactEmail}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">전화번호</label>
              <p className="font-medium">{company.contactPhone}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">직원 수</label>
              <p className="font-medium">{company.employeeCount}명</p>
            </div>
          </div>
          <hr />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">경고 횟수</label>
              <p className="font-medium">{company.warningCount}회</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">가입일</label>
              <p className="font-medium">{new Date(company.createdAt).toLocaleDateString()}</p>
            </div>
            {company.approvedAt && (
              <div>
                <label className="text-sm text-gray-500">승인일</label>
                <p className="font-medium">{new Date(company.approvedAt).toLocaleDateString()}</p>
              </div>
            )}
          </div>
          {company.businessLicenseImage && (
            <div>
              <label className="text-sm text-gray-500">사업자등록증</label>
              <img
                src={company.businessLicenseImage}
                alt="사업자등록증"
                className="mt-2 max-w-full h-auto rounded border"
              />
            </div>
          )}
        </div>
        <div className="mt-6">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}
