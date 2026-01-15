// 사용자 관련 타입
export enum UserRole {
  DRIVER = 'DRIVER',
  STAFF = 'STAFF',
  ADMIN = 'ADMIN',
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
  createdAt: string;
}

// API 응답 타입
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
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
