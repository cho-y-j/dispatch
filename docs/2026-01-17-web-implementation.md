# 배차 시스템 웹 프론트엔드 구현 (2026-01-17)

## 개요
Phase 1-3의 웹 프론트엔드 구현을 완료했습니다.

---

## Phase 1: 발주처 관리 + 카카오맵

### 1. 발주처 회원가입 페이지
**파일**: `dispatch-web/src/pages/CompanyRegistrationPage.tsx`

3단계 회원가입 폼:
1. **Step 1**: 회사 정보 (회사명, 사업자번호, 대표자명, 주소, 전화번호)
2. **Step 2**: 담당자 정보 (이름, 이메일, 전화번호)
3. **Step 3**: 계정 정보 (비밀번호)

**특징**:
- 사업자번호 10자리 자동 포맷팅
- 이메일 유효성 검증
- 비밀번호 확인
- 가입 완료 후 안내 화면

**라우트**: `/register/company`

### 2. 발주처 API
**파일**: `dispatch-web/src/api/company.ts`

```typescript
registerCompany(data)      // POST /api/companies/register
getMyCompany()             // GET /api/companies/my
uploadBusinessLicense(file) // POST /api/companies/my/business-license
```

### 3. 카카오맵 전환
**변경된 파일**:
- `dispatch-web/index.html`: Google Maps → Kakao Maps SDK
- `dispatch-web/src/hooks/useKakaoAddress.ts`: 새로 생성
- `dispatch-web/src/pages/DispatchesPage.tsx`: 주소 검색 UI 변경

**Kakao API 설정** (`index.html`):
```html
<!-- Kakao 주소 검색 API (Daum Postcode) -->
<script src="//t1.daumcdn.net/mapjsapi/bundle/postcode/prod/postcode.v2.js"></script>
<!-- Kakao Maps JavaScript SDK -->
<script src="//dapi.kakao.com/v2/maps/sdk.js?appkey=KAKAO_APP_KEY&libraries=services"></script>
```

**useKakaoAddress Hook**:
```typescript
const { openAddressSearch, geocodeAddress, reverseGeocode } = useKakaoAddress();

// 주소 검색 팝업 열기
openAddressSearch((result) => {
  console.log(result.address, result.latitude, result.longitude);
});
```

---

## Phase 2: 등급/경고 관리

### 1. 기사 관리 페이지 개선
**파일**: `dispatch-web/src/pages/DriversPage.tsx`

**추가된 기능**:
- 탭 UI: "승인 대기" / "전체 기사"
- 전체 기사 목록 테이블 (등급, 평점, 장비, 상태, 경고 표시)
- 등급 변경 모달 (GRADE_1, GRADE_2, GRADE_3)

**Backend API 추가**:
- `GET /api/admin/drivers`: 전체 기사 목록
- `GET /api/admin/drivers/approved`: 승인된 기사 목록
- `PUT /api/admin/drivers/{id}/grade`: 등급 변경

### 2. 경고/정지 관리 페이지
**파일**: `dispatch-web/src/pages/WarningsPage.tsx` (기존)

**기능**:
- 경고 목록 조회 및 부여
- 정지 목록 조회 및 처리/해제
- 대상 유형 선택 (기사/발주처)

### 3. 설정 페이지
**파일**: `dispatch-web/src/pages/SettingsPage.tsx` (기존)

**설정 항목**:
- 등급 설정: 등급별 배차 노출 지연 시간
- 경고/정지 설정: 자동 정지 기준
- 일반 설정: 긴급 배차 노출 시간, 채팅 보관 기간 등

---

## Phase 3: 평가 UI

### 1. 평가 API
**파일**: `dispatch-web/src/api/rating.ts`

```typescript
createRating(dispatchId, { rating, comment })  // POST /api/dispatches/{id}/rating
getRatingByDispatch(dispatchId)                // GET /api/dispatches/{id}/rating
getRatingsByDriver(driverId)                   // GET /api/drivers/{id}/ratings
```

### 2. 평가 모달
**파일**: `dispatch-web/src/pages/DispatchesPage.tsx`

**기능**:
- 완료된 배차에 "평가하기" 버튼 표시 (미평가 건만)
- 별점 선택 UI (1-5점, 호버 효과)
- 평가 라벨: 매우 불만족 ~ 매우 만족
- 선택적 코멘트 입력
- 기존 평가 표시 (별점 아이콘)

---

## 타입 변경

### Driver 인터페이스 확장
**파일**: `dispatch-web/src/types/index.ts`

```typescript
export interface Driver {
  // 기존 필드...
  grade?: DriverGrade;
  averageRating?: number;
  totalRatings: number;
  warningCount: number;
}
```

### Dispatch 인터페이스 확장
```typescript
export interface Dispatch {
  // 기존 필드...
  rating?: DriverRating;
  isUrgent?: boolean;
}
```

---

## 파일 목록

### 새로 생성된 파일
| 파일 | 설명 |
|------|------|
| `src/pages/CompanyRegistrationPage.tsx` | 발주처 회원가입 페이지 |
| `src/api/company.ts` | 발주처 API |
| `src/api/rating.ts` | 평가 API |
| `src/hooks/useKakaoAddress.ts` | 카카오 주소 검색 훅 |

### 수정된 파일
| 파일 | 변경 내용 |
|------|----------|
| `index.html` | Google Maps → Kakao Maps |
| `src/App.tsx` | 회원가입 라우트 추가 |
| `src/pages/LoginPage.tsx` | 회원가입 링크 추가 |
| `src/pages/DispatchesPage.tsx` | 카카오 주소검색, 평가 UI |
| `src/pages/DriversPage.tsx` | 전체 기사 목록, 등급 변경 |
| `src/api/admin.ts` | getAllDrivers, getApprovedDrivers 추가 |
| `src/types/index.ts` | Driver, Dispatch 타입 확장 |

### Backend 수정
| 파일 | 변경 내용 |
|------|----------|
| `AdminController.java` | getAllDrivers, getApprovedDrivers 엔드포인트 |
| `DriverService.java` | getAllDrivers, getApprovedDrivers 메소드 |

---

## TODO (다음 작업)

### Phase 4: Flutter 앱
- [ ] 통합 앱 구조 재설계 (기사 + 발주자)
- [ ] 발주자 기능 (배차 등록, 기사 추적)
- [ ] 카카오맵 + 카카오내비 연동

### Phase 5: 채팅 + 통계
- [ ] 인앱 채팅 UI (앱/웹)
- [ ] 상세 통계 대시보드

---

## 테스트 체크리스트

### 발주처 회원가입
- [ ] `/register/company` 접속 확인
- [ ] Step 1 → Step 2 → Step 3 이동
- [ ] 유효성 검증 (사업자번호 10자리, 이메일 형식, 비밀번호 일치)
- [ ] 회원가입 API 호출
- [ ] 완료 화면 → 로그인 페이지 이동

### 카카오 주소 검색
- [ ] 배차 등록 시 주소 검색 버튼 동작
- [ ] Daum Postcode 팝업 표시
- [ ] 주소 선택 시 좌표 변환 확인

### 기사 관리
- [ ] "전체 기사" 탭에서 목록 표시
- [ ] 등급 변경 모달 동작
- [ ] 등급 변경 후 목록 갱신

### 평가 기능
- [ ] 완료된 배차에 "평가하기" 버튼 표시
- [ ] 별점 선택 및 제출
- [ ] 평가 후 별점 표시

---

## 환경 설정 필요

### Kakao API 키 (승인 완료)

**발급된 키:**
| 키 종류 | 값 | 용도 |
|---------|-----|------|
| REST API | `6abe6c3e2de3d246c49ecc811e003276` | 백엔드 API 호출 |
| JavaScript | `b59b1a8e9a3df2de8cfa33158061f337` | 웹 지도/주소검색 |
| Native App | `83a4d4e01ca9e4e2afcf6d698540f492` | Flutter 앱 |

**환경변수 설정 (.env):**
```bash
# dispatch-web/.env
VITE_KAKAO_JS_KEY=b59b1a8e9a3df2de8cfa33158061f337
```

**설정 완료 파일:**
- `dispatch-web/.env`: JavaScript 키 (환경변수)
- `dispatch-web/src/hooks/useKakaoAddress.ts`: SDK 동적 로드

**Flutter 앱 설정 필요:**
- Android: `android/app/src/main/AndroidManifest.xml`
- iOS: `ios/Runner/Info.plist`
