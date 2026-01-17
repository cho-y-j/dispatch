# 배차 시스템 개발 진행 상황

## 2026-01-18 (토) 작업 내용

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

## 다음 할 일 (우선순위 순)

### 즉시 확인 필요
- [ ] 에뮬레이터에서 카카오맵 표시 확인
- [ ] 마커 클릭 → 하단 시트 → 길안내 버튼 동작 확인
- [ ] 카카오내비/카카오맵 웹 연동 테스트

### Phase 4 남은 작업
- [ ] 발주처 앱 기능 테스트 (배차 등록, 목록 확인)
- [ ] 기사 위치 추적 기능 (발주처에서 기사 위치 확인)

### Phase 5: 채팅 + 통계
- [ ] 백엔드: 채팅 메시지 엔티티 + WebSocket
- [ ] 앱/웹: 인앱 채팅 UI
- [ ] 관리자: 상세 통계 대시보드
- [ ] 리포트 다운로드

### 기타
- [ ] Firebase 설정 (FCM 푸시 알림)
- [ ] iOS 시뮬레이터 테스트
- [ ] 실제 기기 테스트

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
