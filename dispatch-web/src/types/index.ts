// 사용자 관련 타입
export enum UserRole {
  DRIVER = 'DRIVER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
  COMPANY = 'COMPANY',
}

export enum UserStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  SUSPENDED = 'SUSPENDED',
}

export interface User {
  id: number;
  email: string;
  name: string;
  phone: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

// 기사 관련 타입
export enum VerificationStatus {
  PENDING = 'PENDING',
  VERIFYING = 'VERIFYING',
  VERIFIED = 'VERIFIED',
  FAILED = 'FAILED',
  REJECTED = 'REJECTED',
}

export interface Driver {
  id: number;
  user: User;
  businessRegistrationNumber?: string;
  businessRegistrationImage?: string;
  driverLicenseNumber?: string;
  driverLicenseImage?: string;
  verificationStatus: VerificationStatus;
  latitude?: number;
  longitude?: number;
  isActive: boolean;
  equipments: Equipment[];
  createdAt: string;
  grade?: DriverGrade;
  averageRating?: number;
  totalRatings: number;
  warningCount: number;
}

// 장비 타입
export enum EquipmentType {
  HIGH_LIFT_TRUCK = 'HIGH_LIFT_TRUCK',
  AERIAL_PLATFORM = 'AERIAL_PLATFORM',
  SCISSOR_LIFT = 'SCISSOR_LIFT',
  BOOM_LIFT = 'BOOM_LIFT',
  LADDER_TRUCK = 'LADDER_TRUCK',
  CRANE = 'CRANE',
  FORKLIFT = 'FORKLIFT',
  OTHER = 'OTHER',
}

export const EquipmentTypeLabels: Record<EquipmentType, string> = {
  [EquipmentType.HIGH_LIFT_TRUCK]: '고소작업차',
  [EquipmentType.AERIAL_PLATFORM]: '고소작업대',
  [EquipmentType.SCISSOR_LIFT]: '시저리프트',
  [EquipmentType.BOOM_LIFT]: '붐리프트',
  [EquipmentType.LADDER_TRUCK]: '사다리차',
  [EquipmentType.CRANE]: '크레인',
  [EquipmentType.FORKLIFT]: '지게차',
  [EquipmentType.OTHER]: '기타',
};

export interface Equipment {
  id: number;
  type: EquipmentType;
  model?: string;
  tonnage?: string;
  maxHeight?: number;
  vehicleNumber?: string;
  images?: string[];
}

// 배차 관련 타입
export enum DispatchStatus {
  OPEN = 'OPEN',
  MATCHED = 'MATCHED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

export enum MatchStatus {
  ACCEPTED = 'ACCEPTED',
  EN_ROUTE = 'EN_ROUTE',
  ARRIVED = 'ARRIVED',
  WORKING = 'WORKING',
  COMPLETED = 'COMPLETED',
  SIGNED = 'SIGNED',
  CANCELLED = 'CANCELLED',
}

export const DispatchStatusLabels: Record<DispatchStatus, string> = {
  [DispatchStatus.OPEN]: '대기 중',
  [DispatchStatus.MATCHED]: '매칭됨',
  [DispatchStatus.IN_PROGRESS]: '진행 중',
  [DispatchStatus.COMPLETED]: '완료',
  [DispatchStatus.CANCELLED]: '취소됨',
};

export const MatchStatusLabels: Record<MatchStatus, string> = {
  [MatchStatus.ACCEPTED]: '수락됨',
  [MatchStatus.EN_ROUTE]: '이동 중',
  [MatchStatus.ARRIVED]: '도착',
  [MatchStatus.WORKING]: '작업 중',
  [MatchStatus.COMPLETED]: '작업 완료',
  [MatchStatus.SIGNED]: '서명 완료',
  [MatchStatus.CANCELLED]: '취소됨',
};

export interface DispatchMatch {
  id: number;
  driver: Driver;
  matchedAt: string;
  arrivedAt?: string;
  completedAt?: string;
  signedAt?: string;
  status: MatchStatus;
  driverSignature?: string;
  clientSignature?: string;
  clientName?: string;
}

export interface Dispatch {
  id: number;
  staff: User;
  siteAddress: string;
  siteDetail?: string;
  latitude?: number;
  longitude?: number;
  workDate: string;
  workTime: string;
  estimatedHours?: number;
  equipmentType: EquipmentType;
  equipmentRequirements?: string;
  minHeight?: number;
  price?: number;
  priceNegotiable?: boolean;
  workDescription?: string;
  contactName?: string;
  contactPhone?: string;
  status: DispatchStatus;
  match?: DispatchMatch;
  rating?: DriverRating;
  isUrgent?: boolean;
  createdAt: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
}

// 발주처 관련 타입
export enum CompanyStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  SUSPENDED = 'SUSPENDED',
  BANNED = 'BANNED',
}

export const CompanyStatusLabels: Record<CompanyStatus, string> = {
  [CompanyStatus.PENDING]: '승인 대기',
  [CompanyStatus.APPROVED]: '승인됨',
  [CompanyStatus.SUSPENDED]: '정지됨',
  [CompanyStatus.BANNED]: '퇴장',
};

export interface Company {
  id: number;
  name: string;
  businessNumber: string;
  businessLicenseImage?: string;
  representative: string;
  address?: string;
  phone?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  status: CompanyStatus;
  verificationStatus: VerificationStatus;
  verificationMessage?: string;
  warningCount: number;
  employeeCount: number;
  createdAt: string;
  approvedAt?: string;
}

// 기사 등급 관련 타입
export enum DriverGrade {
  GRADE_1 = 'GRADE_1',
  GRADE_2 = 'GRADE_2',
  GRADE_3 = 'GRADE_3',
}

export const DriverGradeLabels: Record<DriverGrade, string> = {
  [DriverGrade.GRADE_1]: '1등급',
  [DriverGrade.GRADE_2]: '2등급',
  [DriverGrade.GRADE_3]: '3등급',
};

// 경고 관련 타입
export enum WarningUserType {
  DRIVER = 'DRIVER',
  COMPANY = 'COMPANY',
}

export enum WarningType {
  CANCEL = 'CANCEL',
  LATE = 'LATE',
  RUDE = 'RUDE',
  SAFETY = 'SAFETY',
  NO_SHOW = 'NO_SHOW',
  OTHER = 'OTHER',
}

export const WarningTypeLabels: Record<WarningType, string> = {
  [WarningType.CANCEL]: '무단 취소',
  [WarningType.LATE]: '지각',
  [WarningType.RUDE]: '불친절',
  [WarningType.SAFETY]: '안전 문제',
  [WarningType.NO_SHOW]: '미출근',
  [WarningType.OTHER]: '기타',
};

export interface Warning {
  id: number;
  userId: number;
  userName?: string;
  userType: WarningUserType;
  type: WarningType;
  reason: string;
  dispatchId?: number;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
}

// 정지 관련 타입
export enum SuspensionType {
  TEMP = 'TEMP',
  PERMANENT = 'PERMANENT',
}

export const SuspensionTypeLabels: Record<SuspensionType, string> = {
  [SuspensionType.TEMP]: '일시 정지',
  [SuspensionType.PERMANENT]: '영구 정지',
};

export interface Suspension {
  id: number;
  userId: number;
  userName?: string;
  userType: WarningUserType;
  type: SuspensionType;
  reason: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  createdBy: number;
  createdByName?: string;
  createdAt: string;
  liftedBy?: number;
  liftedAt?: string;
}

// 평가 관련 타입
export interface DriverRating {
  id: number;
  dispatchId: number;
  driverId: number;
  driverName?: string;
  companyId?: number;
  companyName?: string;
  raterUserId: number;
  raterName?: string;
  rating: number;
  comment?: string;
  createdAt: string;
}

// 채팅 관련 타입
export enum SenderType {
  DRIVER = 'DRIVER',
  COMPANY = 'COMPANY',
}

export interface ChatMessage {
  id: number;
  dispatchId: number;
  senderId: number;
  senderName?: string;
  senderType: SenderType;
  message: string;
  imageUrl?: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// 통계 관련 타입
export interface DailyStats {
  date: string;
  dispatches: number;
  completed: number;
  cancelled: number;
}

export interface DashboardStatistics {
  totalDispatches: number;
  totalDrivers: number;
  totalCompanies: number;
  todayDispatches: number;
  todayCompleted: number;
  todayCancelled: number;
  dispatchesByStatus: Record<string, number>;
  dailyStats: DailyStats[];
  pendingDrivers: number;
  pendingCompanies: number;
  completionRate: number;
  averageMatchingTimeMinutes?: number;
}

export interface DriverStatistics {
  driverId: number;
  driverName: string;
  phone: string;
  grade: DriverGrade;
  averageRating: number;
  totalRatings: number;
  totalDispatches: number;
  completedDispatches: number;
  cancelledDispatches: number;
  warningCount: number;
  isActive: boolean;
  verificationStatus: VerificationStatus;
}

export interface CompanyStatistics {
  companyId: number;
  companyName: string;
  businessNumber: string;
  status: CompanyStatus;
  totalDispatches: number;
  completedDispatches: number;
  cancelledDispatches: number;
  totalAmount: number;
  warningCount: number;
  employeeCount: number;
}

// 시스템 설정 타입
export interface SystemSetting {
  id: number;
  settingKey: string;
  settingValue: string;
  description?: string;
  updatedBy?: number;
  updatedAt: string;
}

// 배차 생성 요청
export interface CreateDispatchRequest {
  siteAddress: string;
  siteDetail?: string;
  latitude?: number;
  longitude?: number;
  workDate: string;
  workTime: string;
  estimatedHours?: number;
  equipmentType: EquipmentType;
  equipmentRequirements?: string;
  minHeight?: number;
  price?: number;
  priceNegotiable?: boolean;
  workDescription?: string;
  contactName?: string;
  contactPhone?: string;
}
