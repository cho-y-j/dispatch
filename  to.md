                                                                                                                           
  # 배차 시스템 개선 계획 (전체)                                                                                             
                                                                                                                             
  ## 현재 상태                                                                                                               
                                                                                                                             
  ### 완료된 기능                                                                                                            
  - 백엔드 API (Spring Boot) - 인증, 배차, 기사 관리                                                                         
  - Flutter 앱 - 기사 전용 (로그인, 배차 수락, 지도)                                                                         
  - React 웹 - 직원/관리자 (배차 등록, 기사 승인)                                                                            
  - WebSocket 실시간 알림 기반 구축                                                                                          
                                                                                                                             
  ### 현재 문제점                                                                                                            
  1. 지도 API: Google Maps 사용 중 (한국 서비스에 부적합)                                                                    
  2. 발주자 관리 부재: 가입 UI 없음, 관리자에서 관리 불가                                                                    
  3. 발주자 앱 없음: 웹에서만 발주 가능                                                                                      
  4. 네비게이션 연동 없음                                                                                                    
                                                                                                                             
  ---                                                                                                                        
                                                                                                                             
  ## 전체 요구사항 정리                                                                                                      
                                                                                                                             
  ### 사용자 결정 사항                                                                                                       
  | 항목 | 결정 |                                                                                                            
  |------|------|                                                                                                            
  | 지도 API | 카카오맵 통일 (앱 + 웹) |                                                                                     
  | 발주자 가입 | 둘 다 지원 (직접 가입 + 관리자 생성) |                                                                     
  | 발주자 앱 | 기사/발주자 통합 앱 |                                                                                        
  | 네비게이션 | 카카오내비 연동 |                                                                                           
  | 결제/정산 | 필요 없음 (직접 정산) |                                                                                      
  | 채팅 | 인앱 채팅 필요 |                                                                                                  
  | 통계 | 상세 통계 필요 |                                                                                                  
                                                                                                                             
  ---                                                                                                                        
                                                                                                                             
  ## 사용자 유형 및 역할                                                                                                     
                                                                                                                             
  | 유형 | 플랫폼 | 역할 |                                                                                                   
  |------|--------|------|                                                                                                   
  | **수주처 (기사)** | Flutter 앱 | 배차 수락, 현장 이동, 작업 완료 |                                                       
  | **발주처 (업체)** | Flutter 앱 + 웹 | 배차 등록, 기사 위치 확인, 기사 평가 |                                             
  | **메인 관리자** | 웹 | 기사/업체 승인, 등급 관리, 경고/정지, 설정 관리, 통계 |                                           
                                                                                                                             
  ---                                                                                                                        
                                                                                                                             
  ## 핵심 기능 상세                                                                                                          
                                                                                                                             
  ### 1. 가입 및 서류 검증 (확장 가능한 설계)                                                                                
                                                                                                                             
  #### 발주처 (업체) 가입                                                                                                    
  ```                                                                                                                        
  필수 서류:                                                                                                                 
  - 사업자등록증 사진                                                                                                        
                                                                                                                             
  검증 항목:                                                                                                                 
  - 사업자번호 유효성 (국세청 API)                                                                                           
  - 대표자 이름 검증 (verify-server)                                                                                         
                                                                                                                             
  가입 플로우:                                                                                                               
  1. 기본 정보 입력 (회사명, 사업자번호, 대표자명)                                                                           
  2. 담당자 정보 (이름, 이메일, 전화번호)                                                                                    
  3. 사업자등록증 업로드                                                                                                     
  4. 검증 대기 → 관리자 승인                                                                                                 
  ```                                                                                                                        
                                                                                                                             
  #### 수주처 (기사) 가입                                                                                                    
  ```                                                                                                                        
  필수 서류:                                                                                                                 
  - 운전면허증 사진                                                                                                          
  - 화물운송 자격증                                                                                                          
  - 사업자등록증 (개인사업자인 경우)                                                                                         
                                                                                                                             
  검증 항목:                                                                                                                 
  - 면허 유효성 (도로교통공단 API)                                                                                           
  - 화물운송 자격증 (verify-server)                                                                                          
  - 이름 일치 검증                                                                                                           
                                                                                                                             
  가입 플로우:                                                                                                               
  1. 기본 정보 입력                                                                                                          
  2. 서류 업로드 (복수)                                                                                                      
  3. 장비 정보 등록                                                                                                          
  4. 검증 대기 → 관리자 승인                                                                                                 
  ```                                                                                                                        
                                                                                                                             
  #### 확장 가능한 검증 설계                                                                                                 
  ```java                                                                                                                    
  // DocumentType Enum - 새 서류 추가 가능                                                                                   
  enum DocumentType {                                                                                                        
  BUSINESS_LICENSE,      // 사업자등록증                                                                                     
  DRIVER_LICENSE,        // 운전면허증                                                                                       
  CARGO_CERTIFICATE,     // 화물운송 자격증                                                                                  
  KOSHA_CERTIFICATE,     // KOSHA 교육이수증                                                                                 
  EQUIPMENT_PHOTO,       // 장비 사진                                                                                        
  // 향후 추가 가능...                                                                                                       
  }                                                                                                                          
                                                                                                                             
  // VerificationRule - 검증 규칙 설정                                                                                       
  entity VerificationRule {                                                                                                  
  documentType: DocumentType                                                                                                 
  isRequired: boolean                                                                                                        
  verificationMethod: String  // "API", "MANUAL", "NONE"                                                                     
  apiEndpoint: String         // verify-server URL                                                                           
  }                                                                                                                          
  ```                                                                                                                        
                                                                                                                             
  ### 2. 등급 시스템 (3단계)                                                                                                 
                                                                                                                             
  #### 기사 등급                                                                                                             
  ```                                                                                                                        
  등급 구분:                                                                                                                 
  - GRADE_1 (1등급): 최우선 배차 노출                                                                                        
  - GRADE_2 (2등급): 시간차 후 노출                                                                                          
  - GRADE_3 (3등급): 마지막 노출                                                                                             
                                                                                                                             
  등급 부여 기준 (관리자 설정):                                                                                              
  - 별점 평균                                                                                                                
  - 완료 건수                                                                                                                
  - 경고 횟수                                                                                                                
  - 수동 조정                                                                                                                
                                                                                                                             
  배차 노출 로직:                                                                                                            
  1. 신규 배차 등록                                                                                                          
  2. 1등급 기사에게 즉시 노출                                                                                                
  3. X분 후 (설정 가능) 2등급에게 노출                                                                                       
  4. Y분 후 3등급에게 노출                                                                                                   
  ```                                                                                                                        
                                                                                                                             
  #### 데이터 구조                                                                                                           
  ```java                                                                                                                    
  entity Driver {                                                                                                            
  grade: DriverGrade (GRADE_1, GRADE_2, GRADE_3)                                                                             
  gradeUpdatedAt: DateTime                                                                                                   
  gradeUpdatedBy: Long (관리자 ID)                                                                                           
  averageRating: Double (별점 평균)                                                                                          
  totalCompletedDispatches: Integer                                                                                          
  warningCount: Integer                                                                                                      
  }                                                                                                                          
                                                                                                                             
  entity GradeSetting {                                                                                                      
  gradeDelayMinutes: Map<DriverGrade, Integer>                                                                               
  // 예: {GRADE_2: 5, GRADE_3: 15} → 2등급 5분 후, 3등급 15분 후                                                             
  }                                                                                                                          
  ```                                                                                                                        
                                                                                                                             
  ### 3. 경고/정지/퇴장 시스템                                                                                               
                                                                                                                             
  #### 경고 관리                                                                                                             
  ```                                                                                                                        
  경고 유형:                                                                                                                 
  - 무단 취소                                                                                                                
  - 지각                                                                                                                     
  - 불친절                                                                                                                   
  - 안전 문제                                                                                                                
  - 기타                                                                                                                     
                                                                                                                             
  경고 처리:                                                                                                                 
  - 1~2회: 경고 기록                                                                                                         
  - 3회: 자동 3일 정지 (설정 가능)                                                                                           
  - 5회: 자동 7일 정지                                                                                                       
  - 심각한 문제: 즉시 퇴장 (관리자 결정)                                                                                     
  ```                                                                                                                        
                                                                                                                             
  #### 정지/퇴장                                                                                                             
  ```                                                                                                                        
  정지 유형:                                                                                                                 
  - SUSPENDED_TEMP: 일시 정지 (기간 지정)                                                                                    
  - SUSPENDED_PERMANENT: 영구 정지 (퇴장)                                                                                    
                                                                                                                             
  정지된 사용자:                                                                                                             
  - 앱/웹 로그인 가능하지만 배차 이용 불가                                                                                   
  - "정지 상태" 안내 메시지 표시                                                                                             
  - 정지 기간, 사유 확인 가능                                                                                                
  ```                                                                                                                        
                                                                                                                             
  #### 데이터 구조                                                                                                           
  ```java                                                                                                                    
  entity Warning {                                                                                                           
  userId: Long                                                                                                               
  type: WarningType                                                                                                          
  reason: String                                                                                                             
  dispatchId: Long (관련 배차)                                                                                               
  createdAt: DateTime                                                                                                        
  createdBy: Long (관리자)                                                                                                   
  }                                                                                                                          
                                                                                                                             
  entity Suspension {                                                                                                        
  userId: Long                                                                                                               
  type: SuspensionType (TEMP, PERMANENT)                                                                                     
  reason: String                                                                                                             
  startDate: DateTime                                                                                                        
  endDate: DateTime (TEMP인 경우)                                                                                            
  createdBy: Long                                                                                                            
  }                                                                                                                          
                                                                                                                             
  entity WarningSetting {                                                                                                    
  warningThreshold1: Integer (정지 시작 횟수)                                                                                
  suspensionDays1: Integer                                                                                                   
  warningThreshold2: Integer                                                                                                 
  suspensionDays2: Integer                                                                                                   
  // ...                                                                                                                     
  }                                                                                                                          
  ```                                                                                                                        
                                                                                                                             
  ### 4. 기사 평가 시스템 (별점)                                                                                             
                                                                                                                             
  #### 평가 프로세스                                                                                                         
  ```                                                                                                                        
  1. 작업 완료 후 전자서명                                                                                                   
  2. 발주처가 기사 평가 (필수)                                                                                               
  - 별점: 1~5                                                                                                                
  - 코멘트: 선택                                                                                                             
  3. 평가 저장 → 기사 평균 별점 업데이트                                                                                     
  ```                                                                                                                        
                                                                                                                             
  #### 별점 필터링                                                                                                           
  ```                                                                                                                        
  발주자가 배차 등록 시:                                                                                                     
  - "최소 별점" 설정 가능                                                                                                    
  - 예: "4점 이상 기사만 볼 수 있음"                                                                                         
  - 해당 별점 미만 기사에게는 배차 노출 안됨                                                                                 
  ```                                                                                                                        
                                                                                                                             
  #### 데이터 구조                                                                                                           
  ```java                                                                                                                    
  entity DriverRating {                                                                                                      
  dispatchId: Long                                                                                                           
  driverId: Long                                                                                                             
  clientId: Long (발주처)                                                                                                    
  rating: Integer (1-5)                                                                                                      
  comment: String                                                                                                            
  createdAt: DateTime                                                                                                        
  }                                                                                                                          
                                                                                                                             
  entity DispatchRequest {                                                                                                   
  // 기존 필드...                                                                                                            
  minDriverRating: Integer (발주자가 설정, null이면 제한 없음)                                                               
  }                                                                                                                          
  ```                                                                                                                        
                                                                                                                             
  ### 5. 긴급 배차 옵션                                                                                                      
                                                                                                                             
  ```                                                                                                                        
  긴급 배차 특징:                                                                                                            
  - 긴급 표시 (빨간 배지)                                                                                                    
  - 모든 등급에게 동시 노출 (등급 시간차 무시)                                                                               
  - 푸시 알림 강조                                                                                                           
  - 목록 최상단 고정                                                                                                         
                                                                                                                             
  추가 옵션 (설정 가능):                                                                                                     
  - 긴급 수수료 (추후 결제 시스템 도입 시)                                                                                   
  - 긴급 배차 가능 횟수 제한                                                                                                 
  ```                                                                                                                        
                                                                                                                             
  ### 6. 인앱 채팅                                                                                                           
                                                                                                                             
  ```                                                                                                                        
  채팅 범위:                                                                                                                 
  - 매칭된 기사 ↔ 발주처 담당자                                                                                              
  - 배차 건별 채팅방 생성                                                                                                    
  - 작업 완료 후에도 일정 기간 유지 (7일)                                                                                    
                                                                                                                             
  기능:                                                                                                                      
  - 텍스트 메시지                                                                                                            
  - 사진 전송                                                                                                                
  - 읽음 표시                                                                                                                
  - 푸시 알림                                                                                                                
                                                                                                                             
  구현 방식:                                                                                                                 
  - WebSocket (기존 인프라 활용)                                                                                             
  - 채팅 메시지 DB 저장                                                                                                      
  ```                                                                                                                        
                                                                                                                             
  ### 7. 상세 통계 (관리자)                                                                                                  
                                                                                                                             
  ```                                                                                                                        
  대시보드:                                                                                                                  
  - 일별/주별/월별 배차 건수                                                                                                 
  - 완료율, 취소율                                                                                                           
  - 평균 매칭 시간                                                                                                           
  - 신규 가입자 수                                                                                                           
                                                                                                                             
  기사별 통계:                                                                                                               
  - 총 배차 건수                                                                                                             
  - 완료 건수                                                                                                                
  - 취소 건수                                                                                                                
  - 평균 별점                                                                                                                
  - 경고 내역                                                                                                                
                                                                                                                             
  업체별 통계:                                                                                                               
  - 발주 건수                                                                                                                
  - 이용 금액 (합계)                                                                                                         
  - 선호 기사 목록                                                                                                           
                                                                                                                             
  리포트 기능:                                                                                                               
  - 기간별 조회                                                                                                              
  - CSV 다운로드                                                                                                             
  ```                                                                                                                        
                                                                                                                             
  ### 8. 메인 어드민 설정 관리                                                                                               
                                                                                                                             
  ```                                                                                                                        
  설정 항목:                                                                                                                 
  1. 등급 설정                                                                                                               
  - 등급별 배차 노출 딜레이 시간                                                                                             
  - 자동 등급 조정 기준                                                                                                      
                                                                                                                             
  2. 경고/정지 정책                                                                                                          
  - 경고 횟수별 자동 정지 기간                                                                                               
  - 정지 해제 조건                                                                                                           
                                                                                                                             
  3. 검증 설정                                                                                                               
  - 필수 서류 목록                                                                                                           
  - 자동 검증 활성화 여부                                                                                                    
                                                                                                                             
  4. 일반 설정                                                                                                               
  - 긴급 배차 노출 시간                                                                                                      
  - 채팅 보관 기간                                                                                                           
  - 기본 배차 반경 (km)                                                                                                      
  ```                                                                                                                        
                                                                                                                             
  ---                                                                                                                        
                                                                                                                             
  ## 시스템 아키텍처 (수정)                                                                                                  
                                                                                                                             
  ```                                                                                                                        
  ┌─────────────────────────────────────────────────────────────┐                                                            
  │                        클라이언트                            │                                                           
  ├──────────────────────┬──────────────────────────────────────┤                                                            
  │  Flutter 통합 앱      │         React 웹                     │                                                           
  │  (기사 + 발주자)      │  (발주처 웹 + 메인 관리자)            │                                                          
  └──────────┬───────────┴───────────────┬──────────────────────┘                                                            
  │                           │                                                                                              
  └───────────┬───────────────┘                                                                                              
  │                                                                                                                          
  ▼                                                                                                                          
  ┌─────────────────────────────────────────────────────────────┐                                                            
  │                    Spring Boot API                           │                                                           
  │                  (dispatch-api:8082)                         │                                                           
  │  ┌─────────────────────────────────────────────────────┐    │                                                            
  │  │ WebSocket (STOMP)                                    │    │                                                           
  │  │ - 실시간 알림                                        │    │                                                           
  │  │ - 위치 추적                                          │    │                                                           
  │  │ - 인앱 채팅                                          │    │                                                           
  │  └─────────────────────────────────────────────────────┘    │                                                            
  └─────────────────────────┬───────────────────────────────────┘                                                            
  │                                                                                                                          
  ┌───────────────┼───────────────┐                                                                                          
  ▼               ▼               ▼                                                                                          
  ┌─────────────────┐ ┌───────────┐ ┌─────────────────┐                                                                      
  │  PostgreSQL     │ │   Redis   │ │ verify-server   │                                                                      
  │  (메인 DB)      │ │ (캐시,    │ │ (자격 검증)     │                                                                      
  │                 │ │  채팅)    │ │                 │                                                                      
  └─────────────────┘ └───────────┘ └─────────────────┘                                                                      
  ```                                                                                                                        
                                                                                                                             
  ---                                                                                                                        
                                                                                                                             
  ## 데이터베이스 설계 (추가/수정)                                                                                           
                                                                                                                             
  ### 신규 테이블                                                                                                            
                                                                                                                             
  ```sql                                                                                                                     
  -- 업체 (발주처)                                                                                                           
  companies                                                                                                                  
  ├── id (PK)                                                                                                                
  ├── name (회사명)                                                                                                          
  ├── business_number (사업자번호)                                                                                           
  ├── business_license_image                                                                                                 
  ├── representative (대표자명)                                                                                              
  ├── address                                                                                                                
  ├── phone                                                                                                                  
  ├── status (PENDING, APPROVED, SUSPENDED, BANNED)                                                                          
  ├── verification_status                                                                                                    
  ├── warning_count                                                                                                          
  ├── created_at, approved_at, approved_by                                                                                   
                                                                                                                             
  -- 기사 등급 이력                                                                                                          
  driver_grade_history                                                                                                       
  ├── id (PK)                                                                                                                
  ├── driver_id                                                                                                              
  ├── previous_grade                                                                                                         
  ├── new_grade                                                                                                              
  ├── reason                                                                                                                 
  ├── changed_by                                                                                                             
  ├── changed_at                                                                                                             
                                                                                                                             
  -- 경고                                                                                                                    
  warnings                                                                                                                   
  ├── id (PK)                                                                                                                
  ├── user_id                                                                                                                
  ├── user_type (DRIVER, COMPANY)                                                                                            
  ├── type (CANCEL, LATE, RUDE, SAFETY, OTHER)                                                                               
  ├── reason                                                                                                                 
  ├── dispatch_id                                                                                                            
  ├── created_by                                                                                                             
  ├── created_at                                                                                                             
                                                                                                                             
  -- 정지                                                                                                                    
  suspensions                                                                                                                
  ├── id (PK)                                                                                                                
  ├── user_id                                                                                                                
  ├── user_type                                                                                                              
  ├── type (TEMP, PERMANENT)                                                                                                 
  ├── reason                                                                                                                 
  ├── start_date                                                                                                             
  ├── end_date                                                                                                               
  ├── created_by                                                                                                             
  ├── created_at                                                                                                             
                                                                                                                             
  -- 기사 평가                                                                                                               
  driver_ratings                                                                                                             
  ├── id (PK)                                                                                                                
  ├── dispatch_id                                                                                                            
  ├── driver_id                                                                                                              
  ├── company_id (발주처)                                                                                                    
  ├── rating (1-5)                                                                                                           
  ├── comment                                                                                                                
  ├── created_at                                                                                                             
                                                                                                                             
  -- 채팅 메시지                                                                                                             
  chat_messages                                                                                                              
  ├── id (PK)                                                                                                                
  ├── dispatch_id (채팅방 = 배차 건)                                                                                         
  ├── sender_id                                                                                                              
  ├── sender_type (DRIVER, COMPANY)                                                                                          
  ├── message                                                                                                                
  ├── image_url                                                                                                              
  ├── is_read                                                                                                                
  ├── created_at                                                                                                             
                                                                                                                             
  -- 시스템 설정                                                                                                             
  system_settings                                                                                                            
  ├── id (PK)                                                                                                                
  ├── setting_key                                                                                                            
  ├── setting_value (JSON)                                                                                                   
  ├── updated_by                                                                                                             
  ├── updated_at                                                                                                             
  ```                                                                                                                        
                                                                                                                             
  ### 테이블 수정                                                                                                            
                                                                                                                             
  ```sql                                                                                                                     
  -- users 수정                                                                                                              
  users                                                                                                                      
  ├── company_id (FK → companies, 발주처 직원인 경우)                                                                        
                                                                                                                             
  -- drivers 수정                                                                                                            
  drivers                                                                                                                    
  ├── grade (GRADE_1, GRADE_2, GRADE_3, default: GRADE_3)                                                                    
  ├── average_rating (평균 별점)                                                                                             
  ├── total_ratings (평가 건수)                                                                                              
  ├── warning_count                                                                                                          
                                                                                                                             
  -- dispatch_requests 수정                                                                                                  
  dispatch_requests                                                                                                          
  ├── company_id (FK → companies)                                                                                            
  ├── is_urgent (긴급 여부)                                                                                                  
  ├── min_driver_rating (최소 별점 필터)                                                                                     
  ```                                                                                                                        
                                                                                                                             
  ---                                                                                                                        
                                                                                                                             
  ## API 설계 (추가)                                                                                                         
                                                                                                                             
  ### 업체 관리 (Admin)                                                                                                      
  ```                                                                                                                        
  GET    /api/admin/companies              - 발주처 목록                                                                     
  GET    /api/admin/companies/pending      - 승인 대기 발주처                                                                
  POST   /api/admin/companies              - 관리자가 발주처 생성                                                            
  PUT    /api/admin/companies/{id}         - 발주처 정보 수정                                                                
  POST   /api/admin/companies/{id}/approve - 승인                                                                            
  POST   /api/admin/companies/{id}/reject  - 거절                                                                            
  DELETE /api/admin/companies/{id}         - 삭제 (퇴장)                                                                     
  ```                                                                                                                        
                                                                                                                             
  ### 등급 관리 (Admin)                                                                                                      
  ```                                                                                                                        
  PUT    /api/admin/drivers/{id}/grade     - 기사 등급 변경                                                                  
  GET    /api/admin/grade-settings         - 등급 설정 조회                                                                  
  PUT    /api/admin/grade-settings         - 등급 설정 수정                                                                  
  ```                                                                                                                        
                                                                                                                             
  ### 경고/정지 (Admin)                                                                                                      
  ```                                                                                                                        
  POST   /api/admin/warnings               - 경고 부여                                                                       
  GET    /api/admin/warnings               - 경고 목록                                                                       
  POST   /api/admin/suspensions            - 정지 처리                                                                       
  DELETE /api/admin/suspensions/{id}       - 정지 해제                                                                       
  GET    /api/admin/suspensions            - 정지 목록                                                                       
  ```                                                                                                                        
                                                                                                                             
  ### 기사 평가                                                                                                              
  ```                                                                                                                        
  POST   /api/dispatches/{id}/rating       - 기사 평가 (발주처)                                                              
  GET    /api/drivers/{id}/ratings         - 기사 평가 목록                                                                  
  ```                                                                                                                        
                                                                                                                             
  ### 채팅                                                                                                                   
  ```                                                                                                                        
  GET    /api/dispatches/{id}/messages     - 채팅 메시지 조회                                                                
  POST   /api/dispatches/{id}/messages     - 메시지 전송                                                                     
  PUT    /api/dispatches/{id}/messages/read - 읽음 처리                                                                      
  WebSocket: /topic/chat/{dispatchId}      - 실시간 메시지                                                                   
  ```                                                                                                                        
                                                                                                                             
  ### 통계 (Admin)                                                                                                           
  ```                                                                                                                        
  GET    /api/admin/statistics/dashboard   - 대시보드 통계                                                                   
  GET    /api/admin/statistics/drivers     - 기사별 통계                                                                     
  GET    /api/admin/statistics/companies   - 업체별 통계                                                                     
  GET    /api/admin/statistics/export      - CSV 다운로드                                                                    
  ```                                                                                                                        
                                                                                                                             
  ### 설정 (Admin)                                                                                                           
  ```                                                                                                                        
  GET    /api/admin/settings               - 전체 설정 조회                                                                  
  PUT    /api/admin/settings/{key}         - 설정 수정                                                                       
  ```                                                                                                                        
                                                                                                                             
  ---                                                                                                                        
                                                                                                                             
  ## 개발 우선순위 (수정)                                                                                                    
                                                                                                                             
  ### Phase 1: 발주처 관리 + 카카오맵                                                                                        
  1. 백엔드: Company 엔티티 + API                                                                                            
  2. 관리자 웹: 발주처 관리 페이지                                                                                           
  3. 웹: 발주자 회원가입 페이지                                                                                              
  4. 카카오맵 전환 (웹)                                                                                                      
                                                                                                                             
  ### Phase 2: 등급 + 경고/정지 시스템                                                                                       
  1. 백엔드: 등급, 경고, 정지 엔티티 + API                                                                                   
  2. 관리자 웹: 등급 관리, 경고 관리, 설정 페이지                                                                            
  3. 배차 노출 로직 (등급별 시간차)                                                                                          
                                                                                                                             
  ### Phase 3: 평가 + 긴급 배차                                                                                              
  1. 백엔드: 평가 엔티티 + API                                                                                               
  2. 앱/웹: 작업완료 시 평가 UI                                                                                              
  3. 배차 등록 시 별점 필터                                                                                                  
  4. 긴급 배차 옵션                                                                                                          
                                                                                                                             
  ### Phase 4: 통합 앱 (기사 + 발주자)                                                                                       
  1. 앱 구조 재설계 (역할별 화면)                                                                                            
  2. 발주자 앱 기능 (배차 등록, 기사 추적)                                                                                   
  3. 카카오맵 전환 (앱)                                                                                                      
  4. 카카오내비 연동                                                                                                         
                                                                                                                             
  ### Phase 5: 채팅 + 통계                                                                                                   
  1. 백엔드: 채팅 메시지 + WebSocket                                                                                         
  2. 앱/웹: 채팅 UI                                                                                                          
  3. 관리자: 상세 통계 대시보드                                                                                              
  4. 리포트 다운로드                                                                                                         
                                                                                                                             
  ---                                                                                                                        
                                                                                                                             
  ## 기술 스택                                                                                                               
                                                                                                                             
  | 항목 | 기술 |                                                                                                            
  |------|------|                                                                                                            
  | 백엔드 | Spring Boot 3.2, Java 17 |                                                                                      
  | DB | PostgreSQL |                                                                                                        
  | 캐시/채팅 | Redis |                                                                                                      
  | 실시간 | WebSocket (STOMP) |                                                                                             
  | 앱 | Flutter |                                                                                                           
  | 웹 | React + TypeScript |                                                                                                
  | 지도 | Kakao Maps |                                                                                                      
  | 네비게이션 | 카카오내비 |                                                                                                
  | 파일 저장 | 로컬 또는 S3 |                                                                                               
  | 검증 | verify-server |                                                                                                   
                                                                                                                             
  ---                                                                                                                        
                                                                                                                             
  ## Kakao API 키 발급 필요                                                                                                  
                                                                                                                             
  1. https://developers.kakao.com 접속                                                                                       
  2. 애플리케이션 추가                                                                                                       
  3. 플랫폼 등록:                                                                                                            
  - 웹: 도메인 등록                                                                                                          
  - Android: 패키지명 + 키 해시                                                                                              
  - iOS: 번들 ID                                                                                                             
  4. JavaScript 키, Native App 키 발급                                                                                       
                                                                                                                             
  ---                                                                                                                        
                                                                                                                             
  ## 검증 방법                                                                                                               
                                                                                                                             
  1. **발주처 관리**: 가입 → 승인 → 배차 등록                                                                                
  2. **등급 시스템**: 등급 변경 → 배차 노출 시간차 확인                                                                      
  3. **경고/정지**: 경고 부여 → 자동 정지 확인                                                                               
  4. **평가**: 작업완료 → 평가 → 별점 필터 동작                                                                              
  5. **채팅**: 매칭 후 메시지 송수신                                                                                         
  6. **통계**: 대시보드 데이터 확인                                                                                          
                                                                                                                             
                                                                                                                             
  If you need specific details from before exiting plan mode (like exact code snippets, error messages, or content you       
  generated), read the full transcript at:                                                                                   
  /Users/jojo/.claude/projects/-Users-jojo-pro-dispatch/a54c8653-6aa0-424a-af9a-2602e630b404.jsonl   