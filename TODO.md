# 배차 시스템 개발 진행 상황

## 2026-01-18 (토) 저녁 작업 내용

### 작업 확인서 (Work Report) 기능 구현

발주처가 작업 완료 후 확인/서명할 수 있는 기능 추가

#### 1. Backend (Spring Boot)

**DispatchMatch 엔티티 확장**
- `driverSignedAt` - 기사 서명 시간
- `clientSignedAt` - 현장 담당자 서명 시간
- `companySignature` - 발주처 서명 이미지 (Base64)
- `companySignedBy` - 발주처 확인자 이름
- `companySignedAt` - 발주처 확인 시간
- `companyConfirmed` - 발주처 확인 여부
- `workPhotos` - 작업 사진 (JSON)

**WorkReportResponse DTO** - 신규 생성
- 배차/발주처/기사 정보
- 요금 (기본/최종)
- 작업 시간 기록 (수락~완료)
- 전자서명 정보 (기사/현장/발주처)
- 작업 메모 및 확인서 URL

**API 엔드포인트**
| 메서드 | URL | 설명 |
|--------|-----|------|
| POST | `/api/dispatches/{id}/sign/company` | 발주처 서명/확인 |
| GET | `/api/dispatches/{id}/work-report` | 작업 확인서 조회 |
| GET | `/api/dispatches/company/work-reports` | 발주처 확인서 목록 |
| GET | `/api/admin/work-reports` | 관리자 전체 목록 |
| GET | `/api/admin/work-reports/{id}` | 관리자 확인서 상세 |

#### 2. Web (React)

**WorkReportsPage.tsx** - 신규
- 필터링 (전체/확인완료/대기중)
- 검색 (주소, 기사명, 발주처)
- 날짜 필터
- 상세 보기 모달 (배차정보, 시간기록, 서명현황)
- 발주처 서명/확인 모달 (캔버스 서명)

**workReport.ts** (API 클라이언트) - 신규
- `getWorkReport()`, `getCompanyWorkReports()`
- `signByCompany()`, `getAllWorkReports()`

**UI 연동**
- 사이드바에 "작업 확인서" 메뉴 추가
- `/work-reports` 라우트 추가

#### 3. Flutter App

**WorkReport 모델** (`lib/models/work_report.dart`) - 신규

**CompanyWorkReportsScreen** (`lib/screens/company/company_work_reports_screen.dart`) - 신규
- 필터 (전체/확인완료/대기중)
- 작업 확인서 카드 리스트
- 상세 보기 시트
- 서명/확인 다이얼로그 (캔버스 서명)

**company_home_screen.dart** 수정
- 하단 네비게이션에 "작업 확인서" 탭 추가

**api_service.dart** 수정
- `getCompanyWorkReports()`
- `getWorkReport()`
- `signByCompany()`

---

### Docker 환경 구성 (협업자용)

#### docker-compose.yml 업데이트
```yaml
services:
  postgres:    # PostgreSQL 15 - 포트 5432
  redis:       # Redis 7 - 포트 6379
  api:         # Spring Boot - 포트 8080
  web:         # React (Nginx) - 포트 80
```

#### Dockerfiles
- `dispatch-api/Dockerfile` - 멀티스테이지 빌드 (Gradle → JRE Alpine)
- `dispatch-web/Dockerfile` - 멀티스테이지 빌드 (Node → Nginx)
- `dispatch-web/nginx.conf` - SPA 라우팅 + API 프록시

#### 환경 설정
- `application.yml` - Docker 프로필 추가 (`spring.profiles.active=docker`)
- `.env.docker` - 웹 Docker 환경 변수

#### 사용 방법
```bash
# 전체 서비스 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

#### 접속 URL (Docker)
| 서비스 | URL |
|--------|-----|
| 웹 | http://localhost |
| API | http://localhost:8080 |
| Swagger | http://localhost:8080/swagger-ui.html |

---

### 버그 수정
- `CompanyRepository.findByEmployeesUserId` 쿼리 수정
  - `e.user.id` → `e.id` (employees가 User 타입)

---

### 작업 흐름 (완성)
```
1. 기사: 작업 완료 → 기사 서명
2. 현장 담당자: 기사 휴대폰에서 현장 서명
3. 발주처: 웹/앱에서 작업 확인서 열람 → 확인/서명
4. 관리자: 웹에서 모든 작업 확인서 열람 가능
```

---

## 2026-01-18 (토) 오후 작업 내용

### 버그 수정 및 기능 개선

#### 1. 회원가입 시 Driver 엔티티 자동 생성
- **AuthService.java** 수정
  - DRIVER 역할 회원가입 시 Driver 엔티티 자동 생성
  - `verificationStatus: PENDING`, `grade: GRADE_3`, `isActive: false` 설정

#### 2. DriverService 업데이트
- **DriverService.java** 수정
  - `register()` 메서드: 기존 Driver가 있으면 업데이트, 없으면 새로 생성
  - 장비 정보 등록 로직 개선

#### 3. 웹 관리자 기사 관리 개선
- **DriversPage.tsx** 수정
  - 기사 목록에 이름/전화번호/이메일 표시 (API 응답 필드 매핑 수정)
  - **기사 상세보기 모달 추가**: 기본정보, 사업자정보, 장비, 가입정보 표시
  - 전체 기사 탭에 "상세" 버튼 추가
- **types/index.ts** 수정
  - Driver 인터페이스에 `name`, `email`, `phone`, `userId` 필드 추가

#### 4. 앱 프로필 화면 수정
- **profile_screen.dart** 수정
  - enum 비교 방식 수정 (`status.name` → `UserStatus.APPROVED` 직접 비교)
  - `UserStatus`, `UserRole` import 추가
- **auth_provider.dart** 수정
  - `checkAuthStatus()`: API 응답에서 User 정보 올바르게 파싱
  - `_parseUserStatus()` 헬퍼 메서드 추가

#### 5. 로그아웃 기능 추가
- **profile_screen.dart** - 기사 프로필에 로그아웃 버튼 추가
- **company_profile_screen.dart** - 발주처 프로필에 로그아웃 버튼 추가
- 확인 다이얼로그 포함

---

### API 배차 플로우 테스트 완료 ✅

| 단계 | 기능 | 결과 |
|------|------|------|
| 1 | 발주처 로그인 | ✅ 성공 |
| 2 | 배차 등록 | ✅ 성공 (서울시 강남구 테헤란로 123) |
| 3 | 기사 로그인 | ✅ 성공 |
| 4 | 가용 배차 조회 | ✅ 성공 |
| 5 | 배차 수락 | ✅ 성공 (MATCHED) |
| 6 | 현장 출발 | ✅ 성공 (EN_ROUTE) |
| 7 | 현장 도착 | ✅ 성공 (ARRIVED) |
| 8 | 작업 시작 | ✅ 성공 (WORKING) |
| 9 | 작업 완료 | ✅ 성공 (COMPLETED) |
| 10 | 기사 서명 | ✅ 성공 |
| 11 | 고객 서명 | ✅ 성공 (SIGNED) |
| 12 | 기사 평가 | ✅ 성공 (5점) |

### 테스트 계정
| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 발주처 | company@test.com | test12345678 |
| 기사 | driver@test.com | test12345678 |
| 관리자 | admin@test.com | test12345678 |

---

## 2026-01-18 (토) 오전 작업 내용

### Phase 4: 통합 앱 (기사 + 발주자) - 완료

#### 1. 앱 구조 재설계 (역할별 화면)
- **User 모델 수정** (`lib/models/user.dart`)
  - `COMPANY` 역할 추가
  - `isDriver`, `isCompany`, `isAdmin` 헬퍼 메서드 추가

- **역할 선택 화면** (`lib/screens/role_selection_screen.dart`) - 신규
  - 앱 시작 시 기사/발주처 선택
  - SharedPreferences에 역할 저장

- **main.dart 재구성**
  - AuthWrapper에서 역할 기반 라우팅
  - 기사 → HomeScreen, 발주처 → CompanyHomeScreen

#### 2. 발주처 전용 화면 (6개 신규 생성)
| 파일 | 설명 |
|------|------|
| `lib/screens/company/company_login_screen.dart` | 발주처 로그인 (역할 검증) |
| `lib/screens/company/company_register_screen.dart` | 발주처 회원가입 |
| `lib/screens/company/company_home_screen.dart` | 탭 네비게이션 (배차목록, 배차등록, 프로필) |
| `lib/screens/company/company_dispatch_list_screen.dart` | 발주처 배차 내역 |
| `lib/screens/company/company_create_dispatch_screen.dart` | 배차 등록 폼 |
| `lib/screens/company/company_dispatch_detail_screen.dart` | 배차 상세 + 기사 평가 |
| `lib/screens/company/company_profile_screen.dart` | 발주처 프로필 |

#### 3. AuthProvider 업데이트 (`lib/providers/auth_provider.dart`)
- `registerWithRole()` 메서드 추가 (역할 지정 회원가입)

#### 4. ApiService 업데이트 (`lib/services/api_service.dart`)
- `createDispatch()` - 배차 등록
- `getCompanyDispatches()` - 발주처 배차 목록
- `cancelDispatch()` - 배차 취소
- `rateDriver()` - 기사 평가

---

### 카카오맵 연동 - 완료

#### 1. 패키지 변경
- ~~google_maps_flutter~~ 제거
- `webview_flutter: ^4.4.0` 추가 (카카오맵 웹뷰 방식)
- `url_launcher: ^6.2.2` 추가 (카카오내비 연동)

> **참고**: `kakao_map_plugin`은 현재 Flutter SDK 3.5.0과 호환되지 않아 웹뷰 방식으로 전환

#### 2. 설정 파일 수정

**Android:**
- `android/app/build.gradle` - KAKAO_APP_KEY manifestPlaceholder 추가
- `android/app/src/main/AndroidManifest.xml` - 카카오맵 meta-data, url_launcher queries 추가
- `android/local.properties` - KAKAO_APP_KEY 설정

**iOS:**
- `ios/Runner/Info.plist` - KAKAO_APP_KEY, 위치 권한, LSApplicationQueriesSchemes 추가
- `ios/Flutter/Debug.xcconfig` - KAKAO_APP_KEY 설정
- `ios/Flutter/Release.xcconfig` - KAKAO_APP_KEY 설정

#### 3. 앱 설정 (`lib/config/app_config.dart`) - 신규
```dart
class AppConfig {
  static const String kakaoAppKey = String.fromEnvironment('KAKAO_APP_KEY');
  static const String apiBaseUrl = String.fromEnvironment('API_BASE_URL');
}
```

#### 4. 지도 화면 재구현 (`lib/screens/map_screen.dart`)
- 카카오맵 JavaScript API를 웹뷰로 로드
- 마커 클릭 시 Flutter와 JS 통신 (JavaScriptChannel)
- 배차 하단 시트에 "길안내" 버튼 추가

#### 5. 카카오내비 연동
- `map_screen.dart` - 마커 클릭 시 카카오내비 실행
- `dispatch_detail_screen.dart` - 현장 위치 카드에 "길안내" 버튼 추가
- 카카오내비 앱 없을 시 카카오맵 웹으로 폴백

#### 6. 빌드 테스트
- Android 에뮬레이터 빌드 성공 (API 36)
- 앱 실행 확인 (Firebase 미설정 경고는 무시 가능)

---

## Phase 5: 채팅 + 통계 - 완료 ✅

### 1. 웹 채팅 기능 구현 (2026-01-18)

#### API 클라이언트 (`dispatch-web/src/api/chat.ts`) - 신규
```typescript
- getMessages(dispatchId): 채팅 메시지 조회
- sendMessage(dispatchId, message, imageUrl?): 메시지 전송
- markAsRead(dispatchId): 읽음 처리
- getUnreadCount(dispatchId): 읽지 않은 메시지 수
```

#### 채팅 UI (`dispatch-web/src/components/ChatPanel.tsx`) - 신규
- 메시지 목록 (내 메시지/상대 메시지 구분)
- 5초 간격 폴링으로 새 메시지 확인
- 메시지 전송 입력창
- 읽음 처리 자동화
- 스크롤 자동 이동

#### 배차 페이지 통합 (`dispatch-web/src/pages/DispatchesPage.tsx`)
- 매칭된 배차에 "채팅" 버튼 추가
- 채팅 모달로 ChatPanel 표시

### 2. 앱 채팅 기능 구현

#### 채팅 모델 (`dispatch-app/lib/models/chat_message.dart`) - 신규
- ChatMessage 클래스
- SenderType enum (DRIVER, COMPANY)

#### 채팅 화면 (`dispatch-app/lib/screens/chat_screen.dart`) - 신규
- 메시지 목록 (말풍선 UI)
- 5초 간격 폴링
- 메시지 전송
- 자동 스크롤

#### API 서비스 업데이트 (`dispatch-app/lib/services/api_service.dart`)
- getChatMessages(dispatchId)
- sendChatMessage(dispatchId, message, imageUrl?)
- markChatAsRead(dispatchId)
- getUnreadChatCount(dispatchId)

#### 화면 연동
- 기사 배차 상세 (`dispatch_detail_screen.dart`): AppBar에 채팅 버튼 추가
- 발주처 배차 상세 (`company_dispatch_detail_screen.dart`): AppBar에 채팅 버튼 추가

### 3. 앱 통계 기능 구현

#### 통계 화면 (`dispatch-app/lib/screens/statistics_screen.dart`) - 신규
- 등급 카드 (1등급/2등급/3등급 + 평균 별점)
- 배차 통계 카드 (총 배차/완료/취소 + 완료율)
- 수익 카드 (총 수익)
- 최근 배차 목록

#### API 서비스 업데이트
- getDriverStatistics(): 기사 통계 조회

#### 프로필 화면 연동 (`profile_screen.dart`)
- "내 통계" 메뉴 추가

### 4. 백엔드 통계 API 추가

#### StatisticsService.java
- getMyDriverStatistics(userId): 기사 본인 통계 조회 메서드 추가

#### DriverController.java
- GET /api/drivers/statistics: 기사 본인 통계 엔드포인트 추가

### 채팅 API 테스트 결과 ✅
| 테스트 | 결과 |
|--------|------|
| 기사 → 메시지 전송 | ✅ 성공 (Message ID: 1) |
| 발주처 → 메시지 전송 | ✅ 성공 (Message ID: 2) |
| 메시지 조회 | ✅ 성공 (2개 메시지) |
| 발신자 구분 | ✅ DRIVER/COMPANY 정상 구분 |

---

## 다음 할 일 (우선순위 순)

### 즉시 확인 필요
- [ ] 에뮬레이터에서 카카오맵 표시 확인
- [ ] 마커 클릭 → 하단 시트 → 길안내 버튼 동작 확인
- [ ] 카카오내비/카카오맵 웹 연동 테스트
- [ ] 채팅 실시간 테스트 (앱 ↔ 웹)

### 기타
- [ ] Firebase 설정 (FCM 푸시 알림)
- [ ] iOS 시뮬레이터 테스트
- [ ] 실제 기기 테스트
- [ ] 에뮬레이터 한글 키보드 설정

---

## 앱 실행 방법

```bash
# Android
cd dispatch-app
flutter run -d emulator-5554 --dart-define=KAKAO_APP_KEY=b59b1a8e9a3df2de8cfa33158061f337

# iOS (시뮬레이터 필요)
flutter run -d iPhone --dart-define=KAKAO_APP_KEY=b59b1a8e9a3df2de8cfa33158061f337
```

---

## 참고: 카카오 API 키
- **위치**: `dispatch-web/.env` → `VITE_KAKAO_JS_KEY`
- **용도**: 카카오맵 JavaScript API, 카카오내비 연동
