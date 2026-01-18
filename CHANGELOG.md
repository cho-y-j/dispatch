# Changelog

모든 주요 변경 사항을 기록합니다.

## [2026-01-18] - 작업 확인서 기능 및 Docker 환경 구성

### 추가된 기능

#### Backend (dispatch-api)

**작업 확인서 (Work Report) 기능**
- `DispatchMatch` 엔티티 확장
  - 기사 서명 시간 (`driverSignedAt`)
  - 현장 담당자 서명 시간 (`clientSignedAt`)
  - 발주처 확인/서명 필드 (`companySignature`, `companySignedBy`, `companySignedAt`, `companyConfirmed`)
  - 작업 사진 필드 (`workPhotos`)

- `WorkReportResponse` DTO 생성
  - 배차 정보, 발주처 정보, 기사 정보
  - 요금 정보 (기본/최종)
  - 작업 시간 기록 (수락, 출발, 도착, 시작, 완료)
  - 전자서명 정보 (기사, 현장, 발주처)
  - 작업 메모 및 확인서 URL

- API 엔드포인트 추가
  - `POST /api/dispatches/{id}/sign/company` - 발주처 서명/확인
  - `GET /api/dispatches/{id}/work-report` - 작업 확인서 조회
  - `GET /api/dispatches/company/work-reports` - 발주처 작업 확인서 목록
  - `GET /api/admin/work-reports` - 관리자 전체 작업 확인서 목록
  - `GET /api/admin/work-reports/{id}` - 관리자 작업 확인서 상세

#### Frontend - Web (dispatch-web)

**작업 확인서 페이지**
- `WorkReportsPage.tsx` 생성
  - 필터링 기능 (전체/확인완료/대기중)
  - 검색 기능 (주소, 기사명, 발주처)
  - 날짜 필터
  - 상세 보기 모달
  - 발주처 서명/확인 모달 (캔버스 서명)

- API 클라이언트 추가 (`api/workReport.ts`)
- 사이드바에 "작업 확인서" 메뉴 추가
- 라우트 추가 (`/work-reports`)

#### Frontend - Flutter App (dispatch-app)

**발주처 작업 확인서 화면**
- `WorkReport` 모델 생성 (`models/work_report.dart`)
- `CompanyWorkReportsScreen` 생성
  - 필터 (전체/확인완료/대기중)
  - 작업 확인서 카드 리스트
  - 상세 보기 시트
  - 서명/확인 다이얼로그 (캔버스 서명)
- 하단 네비게이션에 "작업 확인서" 탭 추가
- API 메서드 추가 (`getCompanyWorkReports`, `getWorkReport`, `signByCompany`)

### Docker 환경 구성

**docker-compose.yml**
- PostgreSQL 15 (Alpine)
- Redis 7 (Alpine)
- Spring Boot API
- React Web (Nginx)
- Health checks 설정
- 볼륨 설정 (DB, Redis, 업로드 파일)

**Dockerfiles**
- `dispatch-api/Dockerfile` - 멀티스테이지 빌드
- `dispatch-web/Dockerfile` - 멀티스테이지 빌드 + Nginx
- `dispatch-web/nginx.conf` - SPA 라우팅 + API 프록시

**환경 설정**
- `application.yml` - Docker 프로필 추가
- `.env.docker` - 웹 Docker 환경 변수

### 버그 수정
- `CompanyRepository.findByEmployeesUserId` 쿼리 수정
  - `e.user.id` → `e.id` (employees가 User 타입이므로)

---

## 사용 방법

### Docker로 전체 서비스 실행

```bash
# 프로젝트 루트에서
docker-compose up -d

# 로그 확인
docker-compose logs -f

# 서비스 중지
docker-compose down
```

### 접속 URL

| 서비스 | URL |
|--------|-----|
| Web (관리자/발주처) | http://localhost |
| API | http://localhost:8080 |
| API Swagger | http://localhost:8080/swagger-ui.html |
| PostgreSQL | localhost:5432 |
| Redis | localhost:6379 |

### 테스트 계정

| 역할 | 이메일 | 비밀번호 |
|------|--------|----------|
| 관리자 | admin@dispatch.com | admin123 |

---

## 작업 흐름

```
1. 기사: 작업 완료 → 기사 서명
2. 현장 담당자: 기사 휴대폰에서 현장 서명
3. 발주처: 웹/앱에서 작업 확인서 열람 → 확인/서명
4. 관리자: 웹에서 모든 작업 확인서 열람 가능
```
