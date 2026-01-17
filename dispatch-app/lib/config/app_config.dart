// 앱 설정 - 실제 키는 .env 또는 dart-define으로 전달
class AppConfig {
  // Kakao Map API Key
  // 빌드 시: flutter run --dart-define=KAKAO_APP_KEY=your_key
  static const String kakaoAppKey = String.fromEnvironment(
    'KAKAO_APP_KEY',
    defaultValue: '',
  );

  // API Server URL
  static const String apiBaseUrl = String.fromEnvironment(
    'API_BASE_URL',
    defaultValue: 'http://10.0.2.2:8082/api',
  );
}
