# 배차 시스템 (Dispatch System) - 프로젝트 요약

## 프로젝트 개요

고소작업차/고소작업대 등 건설장비 배차 매칭 플랫폼

- **프로젝트명**: Dispatch System
- **생성일**: 2026-01-16
- **위치**: /Users/jojo/pro/dispatch

---

## 기술 스택

| 구분 | 기술 |
|------|------|
| 백엔드 | Spring Boot 3.2.0 + Java 17 |
| 데이터베이스 | PostgreSQL 15 (운영) / H2 (개발) |
| 캐시 | Redis 7 |
| 인증 | JWT (Access Token + Refresh Token) |
| API 문서 | Swagger/OpenAPI 3.0 |
| 컨테이너 | Docker + Docker Compose |
| 모바일 앱 | Flutter 3.24.0 + Dart |
| 상태관리 | Provider |

---

## 프로젝트 구조

```
/Users/jojo/pro/dispatch/
├── dispatch-api/                     # Spring Boot 백엔드
│   ├── src/main/java/com/dispatch/
│   │   ├── DispatchApiApplication.java
│   │   ├── config/
│   │   │   └── SecurityConfig.java
│   │   ├── controller/
│   │   │   ├── AuthController.java
│   │   │   ├── DriverController.java
│   │   │   ├── DispatchController.java
│   │   │   ├── AdminController.java
│   │   │   └── HealthController.java
│   │   ├── service/
│   │   │   ├── AuthService.java
│   │   │   ├── DriverService.java
│   │   │   ├── DispatchService.java
│   │   │   ├── FileStorageService.java
│   │   │   ├── NotificationService.java
│   │   │   ├── FcmService.java
│   │   │   ├── PdfGenerationService.java
│   │   │   └── VerifyService.java
│   │   ├── repository/
│   │   ├── entity/
│   │   ├── dto/
│   │   ├── security/
│   │   └── exception/
│   ├── src/main/resources/
│   │   └── application.yml
│   ├── build.gradle
│   └── Dockerfile
│
├── dispatch-app/                     # Flutter 앱 (기사용)
│   ├── lib/
│   │   ├── main.dart                 # 앱 진입점
│   │   ├── models/
│   │   │   ├── user.dart             # 사용자 모델
│   │   │   ├── auth_response.dart    # 인증 응답 모델
│   │   │   └── dispatch.dart         # 배차 모델
│   │   ├── services/
│   │   │   ├── api_service.dart      # API 통신 서비스
│   │   │   ├── websocket_service.dart # WebSocket 서비스
│   │   │   └── fcm_service.dart      # FCM 푸시 서비스
│   │   ├── providers/
│   │   │   ├── auth_provider.dart    # 인증 상태 관리
│   │   │   ├── dispatch_provider.dart # 배차 상태 관리
│   │   │   ├── websocket_provider.dart # WebSocket 상태 관리
│   │   │   └── fcm_provider.dart     # FCM 상태 관리
│   │   └── screens/
│   │       ├── login_screen.dart     # 로그인 화면
│   │       ├── register_screen.dart  # 회원가입 화면
│   │       ├── home_screen.dart      # 홈 (탭 네비게이션)
│   │       ├── dispatch_list_screen.dart    # 배차 목록
│   │       ├── dispatch_detail_screen.dart  # 배차 상세
│   │       ├── my_dispatches_screen.dart    # 내 배차 이력
│   │       ├── profile_screen.dart          # 프로필
│   │       ├── driver_registration_screen.dart # 기사 등록
│   │       └── signature_screen.dart        # 전자서명
│   ├── android/
│   │   ├── app/build.gradle          # Android 빌드 설정
│   │   ├── build.gradle              # 프로젝트 빌드 설정
│   │   ├── settings.gradle           # Gradle 플러그인 설정
│   │   └── gradle.properties         # Gradle 속성 (Java 17)
│   ├── pubspec.yaml                  # Flutter 의존성
│   └── build/app/outputs/flutter-apk/
│       └── app-debug.apk             # 빌드된 APK (94MB)
│
├── dispatch-web/                     # React 웹 (직원/관리자용)
│   ├── src/
│   │   ├── App.tsx                   # 라우팅
│   │   ├── types/index.ts            # TypeScript 타입
│   │   ├── api/                      # API 클라이언트
│   │   ├── services/
│   │   │   ├── websocket.ts          # WebSocket 서비스
│   │   │   ├── firebase.ts           # Firebase 초기화
│   │   │   └── fcm.ts                # FCM 푸시 서비스
│   │   ├── store/
│   │   │   ├── authStore.ts          # 인증 상태
│   │   │   └── notificationStore.ts  # 알림 상태
│   │   ├── hooks/
│   │   │   ├── useWebSocket.ts       # WebSocket 훅
│   │   │   └── useFcm.ts             # FCM 훅
│   │   ├── layouts/MainLayout.tsx    # 사이드바 레이아웃
│   │   └── pages/
│   │       ├── LoginPage.tsx         # 로그인
│   │       ├── DashboardPage.tsx     # 대시보드
│   │       ├── DispatchesPage.tsx    # 배차 관리
│   │       └── DriversPage.tsx       # 기사 승인
│   ├── public/
│   │   └── firebase-messaging-sw.js  # FCM 서비스 워커
│   ├── .env                          # 환경 변수
│   ├── .env.example                  # 환경 변수 예제
│   ├── package.json                  # npm 의존성
│   ├── tailwind.config.js            # Tailwind 설정
│   └── dist/                         # 빌드 결과
│
├── docker-compose.yml
└── PROJECT_SUMMARY.md
```

---

## Phase 1: 백엔드 API (완료)

### 데이터베이스 스키마

#### users (사용자)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| email | VARCHAR | 이메일 (unique) |
| password | VARCHAR | 암호화된 비밀번호 |
| name | VARCHAR | 이름 |
| phone | VARCHAR | 전화번호 |
| role | ENUM | DRIVER, STAFF, ADMIN |
| status | ENUM | PENDING, APPROVED, REJECTED, SUSPENDED |

#### drivers (기사)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| user_id | BIGINT | FK → users |
| business_registration_number | VARCHAR | 사업자등록번호 |
| business_registration_image | VARCHAR | 사업자등록증 이미지 경로 |
| driver_license_number | VARCHAR | 운전면허번호 |
| driver_license_image | VARCHAR | 운전면허증 이미지 경로 |
| verification_status | ENUM | PENDING, VERIFYING, VERIFIED, FAILED, REJECTED |
| latitude, longitude | DOUBLE | 현재 위치 |
| is_active | BOOLEAN | 활동 상태 |

#### equipments (장비)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| driver_id | BIGINT | FK → drivers |
| type | ENUM | HIGH_LIFT_TRUCK, AERIAL_PLATFORM, SCISSOR_LIFT 등 |
| model | VARCHAR | 모델명 |
| tonnage | VARCHAR | 톤수 |
| max_height | DOUBLE | 최대 작업 높이 |
| vehicle_number | VARCHAR | 차량 번호 |

#### dispatch_requests (배차 요청)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| staff_id | BIGINT | FK → users |
| site_address | VARCHAR | 현장 주소 |
| latitude, longitude | DOUBLE | 현장 좌표 |
| work_date | DATE | 작업 날짜 |
| work_time | TIME | 작업 시간 |
| equipment_type | ENUM | 필요 장비 종류 |
| price | DECIMAL | 제시 요금 |
| status | ENUM | OPEN, MATCHED, IN_PROGRESS, COMPLETED, CANCELLED |

#### dispatch_matches (배차 매칭)
| 컬럼 | 타입 | 설명 |
|------|------|------|
| id | BIGINT | PK |
| request_id | BIGINT | FK → dispatch_requests |
| driver_id | BIGINT | FK → drivers |
| matched_at | TIMESTAMP | 매칭 시간 |
| arrived_at | TIMESTAMP | 도착 시간 |
| completed_at | TIMESTAMP | 완료 시간 |
| driver_signature | TEXT | 기사 서명 (Base64) |
| client_signature | TEXT | 고객 서명 (Base64) |
| status | ENUM | ACCEPTED, EN_ROUTE, ARRIVED, WORKING, COMPLETED, SIGNED |

### API 엔드포인트

#### 인증 API (/api/auth)
| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /register | 회원가입 | X |
| POST | /login | 로그인 | X |
| POST | /refresh | 토큰 갱신 | X |

#### 기사 API (/api/drivers)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | /register | 기사 등록 | DRIVER |
| POST | /documents/business-registration | 사업자등록증 업로드 | DRIVER |
| POST | /documents/driver-license | 운전면허증 업로드 | DRIVER |
| GET | /profile | 내 프로필 조회 | DRIVER |
| PUT | /location | 위치 업데이트 | DRIVER |
| PUT | /active | 활동 상태 변경 | DRIVER |

#### 배차 API (/api/dispatches)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| POST | / | 배차 등록 | STAFF/ADMIN |
| GET | /available | 가용 배차 목록 | DRIVER |
| POST | /{id}/accept | 배차 수락 | DRIVER |
| POST | /{id}/depart | 출발 | DRIVER |
| POST | /{id}/arrive | 현장 도착 | DRIVER |
| POST | /{id}/start-work | 작업 시작 | DRIVER |
| POST | /{id}/complete | 작업 완료 | DRIVER |
| POST | /{id}/sign/driver | 기사 서명 | DRIVER |
| POST | /{id}/sign/client | 고객 서명 | - |
| GET | /driver/history | 기사 배차 이력 | DRIVER |

#### 관리자 API (/api/admin)
| Method | Endpoint | 설명 | 권한 |
|--------|----------|------|------|
| GET | /drivers/pending | 승인 대기 기사 목록 | ADMIN |
| POST | /drivers/{id}/approve | 기사 승인 | ADMIN |
| POST | /drivers/{id}/reject | 기사 거절 | ADMIN |

---

## Phase 2: Flutter 앱 (완료)

### 앱 구조

```
dispatch-app/lib/
├── main.dart                         # MultiProvider 설정, AuthWrapper
├── models/
│   ├── user.dart                     # User, UserRole, UserStatus
│   ├── auth_response.dart            # AuthResponse
│   └── dispatch.dart                 # Dispatch, DispatchMatch, 상태 Enum
├── services/
│   └── api_service.dart              # Dio 기반 API 통신
├── providers/
│   ├── auth_provider.dart            # 로그인/로그아웃/토큰관리
│   └── dispatch_provider.dart        # 배차 목록/상태 관리
└── screens/
    ├── login_screen.dart             # 이메일/비밀번호 로그인
    ├── register_screen.dart          # 회원가입 (이름, 이메일, 비밀번호, 전화번호)
    ├── home_screen.dart              # BottomNavigationBar (배차/이력/프로필)
    ├── dispatch_list_screen.dart     # 수락 가능한 배차 목록 (Pull to Refresh)
    ├── dispatch_detail_screen.dart   # 배차 상세 + 상태 변경 버튼
    ├── my_dispatches_screen.dart     # 내 배차 이력
    ├── profile_screen.dart           # 사용자 정보 + 메뉴
    ├── driver_registration_screen.dart # Stepper 기반 기사 등록
    └── signature_screen.dart         # 기사/고객 전자서명
```

### 화면별 기능

| 화면 | 파일 | 주요 기능 |
|------|------|----------|
| 로그인 | `login_screen.dart` | 이메일/비밀번호 로그인, 회원가입 이동 |
| 회원가입 | `register_screen.dart` | 기사 계정 생성, 유효성 검사 |
| 홈 | `home_screen.dart` | 3탭 네비게이션 (배차/이력/프로필), 로그아웃 |
| 배차 목록 | `dispatch_list_screen.dart` | 가용 배차 카드 목록, 당겨서 새로고침 |
| 배차 상세 | `dispatch_detail_screen.dart` | 날짜/위치/요금/담당자 정보, 상태별 버튼 |
| 내 배차 | `my_dispatches_screen.dart` | 수락한 배차 이력, 상태 표시 |
| 프로필 | `profile_screen.dart` | 사용자 정보, 기사등록/설정 메뉴 |
| 기사 등록 | `driver_registration_screen.dart` | 3단계 Stepper (사업자정보/장비정보/장비사진) |
| 전자서명 | `signature_screen.dart` | 기사 서명 → 고객 서명 → 완료 |

### 배차 상태 플로우 (앱에서 처리)

```
OPEN (배차 등록됨)
  ↓ [배차 수락] acceptDispatch()
ACCEPTED (수락됨)
  ↓ [출발하기] depart
EN_ROUTE (이동 중)
  ↓ [현장 도착] arrive
ARRIVED (도착)
  ↓ [작업 시작] start
WORKING (작업 중)
  ↓ [작업 완료] complete
COMPLETED (완료)
  ↓ [서명하기] → SignatureScreen
SIGNED (서명 완료)
```

### Flutter 빌드 설정

#### pubspec.yaml 주요 의존성
```yaml
dependencies:
  provider: ^6.1.1          # 상태관리
  dio: ^5.4.0               # HTTP 통신
  flutter_secure_storage: ^9.0.0  # 토큰 저장
  image_picker: ^1.0.7      # 이미지 선택
  signature: ^5.4.1         # 전자서명
  flutter_local_notifications: ^18.0.1  # 알림
  intl: ^0.19.0             # 날짜 포맷
```

#### Android 빌드 설정 (build.gradle)
```groovy
android {
    compileSdk = 35
    targetSdk = 35
    minSdk = 21

    compileOptions {
        coreLibraryDesugaringEnabled true
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
}
```

#### Gradle 설정
| 항목 | 버전 |
|------|------|
| Gradle | 8.5 |
| Android Gradle Plugin | 8.1.0 |
| Kotlin | 1.9.0 |
| Java | 17 (Temurin) |

#### gradle.properties
```properties
org.gradle.java.home=/Library/Java/JavaVirtualMachines/temurin-17.jdk/Contents/Home
```

### 빌드 결과
- **APK 위치**: `dispatch-app/build/app/outputs/flutter-apk/app-debug.apk`
- **APK 크기**: 약 94MB (debug 빌드)

---

## 실행 방법

### 백엔드 (개발 모드)
```bash
cd /Users/jojo/pro/dispatch/dispatch-api
./gradlew bootRun
```
- API: http://localhost:8082
- Swagger: http://localhost:8082/swagger-ui.html

### Flutter 앱
```bash
cd /Users/jojo/pro/dispatch/dispatch-app

# 의존성 설치
~/flutter/bin/flutter pub get

# 코드 분석
~/flutter/bin/flutter analyze

# APK 빌드
~/flutter/bin/flutter build apk --debug

# 앱 실행 (에뮬레이터)
~/flutter/bin/flutter run
```

### Docker (운영 모드)
```bash
cd /Users/jojo/pro/dispatch
docker-compose up -d
```

---

## 배차 플로우

```
1. 직원(웹): 배차 등록 (POST /api/dispatches)
         ↓
2. 기사(앱): 가용 배차 목록 조회 (GET /api/dispatches/available)
         ↓
3. 기사(앱): 배차 수락 (POST /api/dispatches/{id}/accept)
         ↓
4. 기사(앱): 출발 (POST /api/dispatches/{id}/depart)
         ↓
5. 기사(앱): 현장 도착 (POST /api/dispatches/{id}/arrive)
         ↓
6. 기사(앱): 작업 시작 (POST /api/dispatches/{id}/start-work)
         ↓
7. 기사(앱): 작업 완료 (POST /api/dispatches/{id}/complete)
         ↓
8. 기사(앱): 기사 서명 (POST /api/dispatches/{id}/sign/driver)
         ↓
9. 고객(앱): 고객 서명 (POST /api/dispatches/{id}/sign/client)
         ↓
10. 완료 (작업 확인서 생성)
```

---

## 해결된 이슈

### 1. Java/Gradle 호환성 문제
- **문제**: Android Studio JBR (JDK 21)과 Gradle 7.6.3 호환성 문제
- **해결**:
  - Gradle 8.5로 업그레이드
  - AGP 8.1.0 + Kotlin 1.9.0 설정
  - `gradle.properties`에 Java 17 경로 명시

### 2. geolocator 플러그인 빌드 오류
- **문제**: `flutter.compileSdkVersion` 속성 누락 오류
- **해결**: geolocator/google_maps_flutter 임시 비활성화 (추후 재활성화 예정)

### 3. PENDING 사용자 로그인 차단
- **문제**: CustomUserDetails.isEnabled()가 APPROVED만 허용
- **해결**: REJECTED 상태만 비활성화하도록 수정

---

## Phase 3: React 웹 (완료)

### 웹 구조

```
dispatch-web/src/
├── App.tsx                       # 라우팅 설정
├── index.css                     # Tailwind CSS
├── types/
│   └── index.ts                  # TypeScript 타입 정의
├── api/
│   ├── client.ts                 # Axios 클라이언트 (인터셉터)
│   ├── auth.ts                   # 인증 API
│   ├── dispatch.ts               # 배차 API
│   └── admin.ts                  # 관리자 API
├── store/
│   └── authStore.ts              # Zustand 인증 상태
├── layouts/
│   └── MainLayout.tsx            # 사이드바 레이아웃
└── pages/
    ├── LoginPage.tsx             # 로그인
    ├── DashboardPage.tsx         # 대시보드
    ├── DispatchesPage.tsx        # 배차 관리 + 등록 모달
    └── DriversPage.tsx           # 기사 승인 (관리자)
```

### 화면별 기능

| 화면 | 경로 | 접근 권한 | 주요 기능 |
|------|------|----------|----------|
| 로그인 | `/login` | 공개 | 이메일/비밀번호 로그인 |
| 대시보드 | `/dashboard` | STAFF/ADMIN | 통계 카드, 최근 배차, 승인 대기 알림 |
| 배차 관리 | `/dispatches` | STAFF/ADMIN | 배차 목록, 필터, 배차 등록 모달 |
| 기사 승인 | `/drivers` | ADMIN | 승인 대기 기사 목록, 승인/거절 |

### 기술 스택

| 항목 | 기술 |
|------|------|
| 프레임워크 | React 19 + Vite 7 |
| 언어 | TypeScript 5 |
| 상태관리 | Zustand |
| HTTP | Axios (인터셉터로 토큰 자동 갱신) |
| 스타일 | Tailwind CSS v4 |
| 아이콘 | Lucide React |
| 날짜 | Day.js |
| 라우팅 | React Router v7 |

### 빌드 및 실행

```bash
cd /Users/jojo/pro/dispatch/dispatch-web

# 의존성 설치
npm install

# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build
```

### 환경 변수 (.env)
```
VITE_API_URL=http://localhost:8082/api
```

---

## Phase 4: WebSocket 실시간 알림 (완료)

### 백엔드 WebSocket 구성

```
dispatch-api/src/main/java/com/dispatch/
├── config/
│   └── WebSocketConfig.java          # STOMP 설정, JWT 인증
├── controller/
│   └── WebSocketController.java      # 위치 업데이트 수신, ping/pong
├── service/
│   └── NotificationService.java      # 알림 전송 서비스
└── dto/websocket/
    ├── WebSocketMessage.java         # 메시지 래퍼 (type, title, message, data)
    ├── DispatchNotification.java     # 배차 알림 데이터
    └── LocationUpdate.java           # 위치 업데이트 데이터
```

### WebSocket 엔드포인트

| 엔드포인트 | 설명 |
|-----------|------|
| `/ws` (SockJS) | WebSocket 연결 (SockJS fallback 포함) |
| `/topic/dispatches` | 새 배차 알림 (브로드캐스트) |
| `/topic/notices` | 시스템 공지 (브로드캐스트) |
| `/user/queue/notifications` | 개인 알림 |
| `/user/queue/location` | 위치 업데이트 |
| `/app/location` | 위치 업데이트 전송 (기사 → 서버) |
| `/app/ping` | 연결 확인 |

### 메시지 타입

| 타입 | 설명 | 수신자 |
|------|------|--------|
| `NEW_DISPATCH` | 새 배차 등록 | 모든 기사 |
| `DISPATCH_ACCEPTED` | 배차 수락됨 | 직원 |
| `DISPATCH_ARRIVED` | 기사 현장 도착 | 직원 |
| `DISPATCH_COMPLETED` | 작업 완료 | 직원 |
| `DISPATCH_CANCELLED` | 배차 취소 | 직원 + 기사 |
| `DRIVER_APPROVED` | 기사 승인됨 | 기사 |
| `DRIVER_REJECTED` | 기사 거절됨 | 기사 |
| `LOCATION_UPDATE` | 위치 업데이트 | 직원 |
| `SYSTEM_NOTICE` | 시스템 공지 | 모든 사용자 |

### React 웹 WebSocket 구성

```
dispatch-web/src/
├── services/
│   └── websocket.ts                  # STOMP 클라이언트
├── store/
│   └── notificationStore.ts          # 알림 상태 (Zustand)
├── hooks/
│   └── useWebSocket.ts               # WebSocket 훅
└── components/
    └── NotificationDropdown.tsx      # 알림 드롭다운 UI
```

### Flutter 앱 WebSocket 구성

```
dispatch-app/lib/
├── services/
│   └── websocket_service.dart        # STOMP 클라이언트
└── providers/
    └── websocket_provider.dart       # WebSocket Provider
```

### Flutter 추가 패키지

```yaml
dependencies:
  stomp_dart_client: ^2.0.0     # STOMP 클라이언트
  web_socket_channel: ^3.0.2    # WebSocket 채널
```

---

## Phase 5: verify-server 연동 (완료)

### 연동 구조

```
dispatch-api/src/main/java/com/dispatch/
├── controller/
│   └── VerifyController.java         # 검증 API 엔드포인트
├── service/
│   └── VerifyService.java            # verify-server 연동 서비스
└── dto/verify/
    ├── CargoVerifyRequest.java       # 화물운송 자격증 검증 요청
    └── VerifyResponse.java           # 검증 응답
```

### 검증 API 엔드포인트

| Method | Endpoint | 설명 | 상태 |
|--------|----------|------|------|
| POST | /api/verify/cargo | 화물운송 자격증 검증 | verify-server 연동 |
| POST | /api/verify/kosha | KOSHA 교육이수증 검증 (이미지) | verify-server 연동 |
| POST | /api/verify/business-registration | 사업자등록번호 검증 | 형식 검증 (API 대기) |
| POST | /api/verify/driver-license | 운전면허 검증 | 미구현 |

### 자동 검증

- 기사 등록 시 사업자등록번호 형식 및 체크섬 자동 검증
- 사업자등록번호 10자리 숫자 + 체크섬 알고리즘 적용

### verify-server 설정 (application.yml)

```yaml
verify:
  api:
    url: ${VERIFY_API_URL:http://localhost:8080}
    key: ${VERIFY_API_KEY:}
```

---

## Phase 6: 작업 확인서 PDF 생성 (완료)

### 구조

```
dispatch-api/src/main/java/com/dispatch/
├── config/
│   └── WebConfig.java                # 정적 파일 제공 설정
├── controller/
│   └── ReportController.java         # PDF 다운로드/조회/재생성 API
└── service/
    └── PdfGenerationService.java     # iText 7 기반 PDF 생성
```

### PDF 생성 라이브러리

```groovy
// build.gradle
implementation 'com.itextpdf:itext7-core:7.2.5'
implementation 'com.itextpdf:html2pdf:4.0.5'
```

### 리포트 API 엔드포인트

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /api/reports/dispatches/{id}/generate | PDF 재생성 | 필요 |
| GET | /api/reports/dispatches/{id}/download | PDF 다운로드 | 필요 |
| GET | /api/reports/dispatches/{id}/view | PDF 보기 (브라우저) | 공개 |

### 작업 확인서 PDF 내용

1. **제목**: 작업 확인서 (Work Confirmation Report)
2. **문서 정보**: 문서번호, 발행일시
3. **배차 정보**: 작업일, 시간, 현장주소, 담당자
4. **장비/기사 정보**: 기사명, 연락처, 장비종류, 차량번호, 사업자정보
5. **작업 내용**: 작업내용, 예상시간, 실제 작업시간, 메모
6. **요금 정보**: 기본요금, 최종요금
7. **서명**: 기사 서명 (이미지), 고객 서명 (이미지)
8. **푸터**: 법적 효력 안내

### 자동 생성

- 고객 서명 완료 시 (`/api/dispatches/{id}/sign/client`) 자동 PDF 생성
- 생성된 PDF URL은 `DispatchMatch.workReportUrl`에 저장
- 파일 저장 경로: `uploads/reports/work-report-{id}-{uuid}.pdf`

---

## Phase 7: FCM 푸시 알림 (완료)

### 백엔드 FCM 구성

```
dispatch-api/src/main/java/com/dispatch/
├── config/
│   └── FirebaseConfig.java          # Firebase Admin SDK 초기화
├── controller/
│   └── DeviceTokenController.java   # 디바이스 토큰 등록/삭제 API
├── service/
│   └── FcmService.java              # FCM 푸시 알림 전송 서비스
├── entity/
│   └── DeviceToken.java             # 디바이스 토큰 Entity
└── repository/
    └── DeviceTokenRepository.java   # 토큰 조회 Repository
```

### FCM API 엔드포인트

| Method | Endpoint | 설명 | 인증 |
|--------|----------|------|------|
| POST | /api/devices/token | 디바이스 토큰 등록 | 필요 |
| DELETE | /api/devices/token | 디바이스 토큰 삭제 | 필요 |

### FCM 알림 타입

| 타입 | 설명 | 수신자 |
|------|------|--------|
| `NEW_DISPATCH` | 새 배차 등록 | 모든 기사 (DRIVER 역할) |
| `DISPATCH_ACCEPTED` | 배차 수락됨 | 담당 직원 |
| `DISPATCH_ARRIVED` | 기사 현장 도착 | 담당 직원 |
| `DISPATCH_COMPLETED` | 작업 완료 | 담당 직원 |
| `DISPATCH_CANCELLED` | 배차 취소 | 직원 + 기사 |
| `DRIVER_APPROVED` | 기사 승인됨 | 해당 기사 |
| `DRIVER_REJECTED` | 기사 거절됨 | 해당 기사 |

### Flutter 앱 FCM 구성

```
dispatch-app/lib/
├── services/
│   └── fcm_service.dart             # FCM 서비스 (Lazy 초기화)
└── providers/
    └── fcm_provider.dart            # FCM 상태 Provider
```

#### Flutter FCM 패키지

```yaml
dependencies:
  firebase_core: ^3.13.0             # Firebase Core
  firebase_messaging: ^15.2.5        # Firebase Cloud Messaging
```

### React 웹 FCM 구성

```
dispatch-web/src/
├── services/
│   ├── firebase.ts                  # Firebase 초기화
│   └── fcm.ts                       # FCM 서비스
├── hooks/
│   └── useFcm.ts                    # FCM React 훅
└── public/
    └── firebase-messaging-sw.js     # 서비스 워커 (백그라운드 알림)
```

### Firebase 설정 (application.yml)

```yaml
firebase:
  enabled: ${FIREBASE_ENABLED:true}
  config-path: ${FIREBASE_CONFIG_PATH:firebase-service-account.json}
```

### 알림 전송 플로우

```
1. 사용자 로그인 시 → 디바이스 토큰 서버 등록
2. 이벤트 발생 (배차 등록/상태 변경 등)
   ↓
3. NotificationService.notifyXXX() 호출
   ↓
4. WebSocket 알림 전송 (실시간)
   + FCM 푸시 알림 전송 (백그라운드)
   ↓
5. 사용자 로그아웃 시 → 디바이스 토큰 삭제
```

---

## 다음 작업

### 추가 기능
- [ ] geolocator/google_maps_flutter 재활성화
- [ ] 사업자등록상태 조회 API 연동 (국세청)
- [ ] 운전면허 검증 API 연동 (도로교통공단)

---

## 연동 시스템

- **verify-server-main**: http://localhost:8080 (Docker)
  - 화물운송 자격증 검증
  - KOSHA 교육이수증 검증

---

## 테스트 계정 예시

```bash
# 기사 회원가입
curl -X POST http://localhost:8082/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@test.com","password":"password123","name":"홍길동","phone":"010-1234-5678","role":"DRIVER"}'

# 로그인
curl -X POST http://localhost:8082/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"driver@test.com","password":"password123"}'
```

---

## 작업 이력

| 날짜 | 작업 내용 |
|------|----------|
| 2026-01-16 | Phase 1: Spring Boot 백엔드 완료 (인증, 기사, 배차, 관리자 API) |
| 2026-01-16 | Phase 2: Flutter 앱 완료 (로그인, 배차, 서명 등 9개 화면) |
| 2026-01-16 | Phase 3: React 웹 완료 (로그인, 대시보드, 배차관리, 기사승인) |
| 2026-01-16 | Phase 4: WebSocket 실시간 알림 완료 (백엔드 + 웹 + 앱) |
| 2026-01-16 | Phase 5: verify-server 연동 완료 (화물운송/KOSHA/사업자등록 검증) |
| 2026-01-16 | Phase 6: 작업 확인서 PDF 생성 완료 (iText 7, 자동생성, 다운로드) |
| 2026-01-16 | Phase 7: FCM 푸시 알림 완료 (백엔드 + Flutter + React 웹) |

---

## GitHub 저장소

- **URL**: https://github.com/cho-y-j/dispatch.git
- **브랜치**: main
