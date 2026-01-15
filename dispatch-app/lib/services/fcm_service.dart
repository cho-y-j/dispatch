import 'dart:convert';
import 'dart:io';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'api_service.dart';

/// 백그라운드 메시지 핸들러 (top-level function)
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  debugPrint('백그라운드 메시지 수신: ${message.messageId}');
}

class FcmService {
  static FcmService? _instance;
  static FcmService get instance {
    _instance ??= FcmService._internal();
    return _instance!;
  }
  factory FcmService() => instance;
  FcmService._internal();

  FirebaseMessaging? _messaging;
  FlutterLocalNotificationsPlugin? _localNotifications;

  String? _fcmToken;
  bool _isInitialized = false;
  bool _firebaseAvailable = false;

  String? get fcmToken => _fcmToken;
  bool get isAvailable => _firebaseAvailable;

  FirebaseMessaging? get messaging => _messaging;

  FlutterLocalNotificationsPlugin get localNotifications {
    _localNotifications ??= FlutterLocalNotificationsPlugin();
    return _localNotifications!;
  }

  /// FCM 초기화
  Future<void> initialize() async {
    if (_isInitialized) return;

    try {
      // Firebase 초기화
      await Firebase.initializeApp();

      // Firebase 초기화 성공 후 Messaging 인스턴스 생성
      _messaging = FirebaseMessaging.instance;
      _firebaseAvailable = true;

      // 백그라운드 핸들러 등록
      FirebaseMessaging.onBackgroundMessage(
          _firebaseMessagingBackgroundHandler);

      // 권한 요청
      await _requestPermission();

      // 로컬 알림 초기화
      await _initializeLocalNotifications();

      // 토큰 가져오기
      _fcmToken = await _messaging!.getToken();
      debugPrint('FCM Token: $_fcmToken');

      // 토큰 갱신 리스너
      _messaging!.onTokenRefresh.listen((token) {
        _fcmToken = token;
        _registerTokenToServer(token);
      });

      // 포그라운드 메시지 리스너
      FirebaseMessaging.onMessage.listen(_handleForegroundMessage);

      // 알림 탭 리스너 (앱이 백그라운드일 때)
      FirebaseMessaging.onMessageOpenedApp.listen(_handleNotificationTap);

      // 종료 상태에서 알림으로 앱이 열린 경우
      final initialMessage = await _messaging!.getInitialMessage();
      if (initialMessage != null) {
        _handleNotificationTap(initialMessage);
      }

      _isInitialized = true;
      debugPrint('FCM 초기화 완료');
    } catch (e) {
      debugPrint('FCM 초기화 실패 (Firebase 설정 없음): $e');
      _firebaseAvailable = false;
    }
  }

  /// 권한 요청
  Future<void> _requestPermission() async {
    if (_messaging == null) return;
    final settings = await _messaging!.requestPermission(
      alert: true,
      announcement: false,
      badge: true,
      carPlay: false,
      criticalAlert: false,
      provisional: false,
      sound: true,
    );

    debugPrint('FCM 권한 상태: ${settings.authorizationStatus}');
  }

  /// 로컬 알림 초기화
  Future<void> _initializeLocalNotifications() async {
    const androidSettings =
        AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const initSettings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await localNotifications.initialize(
      initSettings,
      onDidReceiveNotificationResponse: (response) {
        _handleLocalNotificationTap(response.payload);
      },
    );

    // Android 알림 채널 생성
    if (Platform.isAndroid) {
      const channel = AndroidNotificationChannel(
        'dispatch_channel',
        '배차 알림',
        description: '배차 관련 푸시 알림',
        importance: Importance.high,
      );

      await localNotifications
          .resolvePlatformSpecificImplementation<
              AndroidFlutterLocalNotificationsPlugin>()
          ?.createNotificationChannel(channel);
    }
  }

  /// 포그라운드 메시지 처리
  void _handleForegroundMessage(RemoteMessage message) {
    debugPrint('포그라운드 메시지: ${message.notification?.title}');

    final notification = message.notification;
    final android = message.notification?.android;

    // Android에서 포그라운드 알림 표시
    if (notification != null && android != null) {
      localNotifications.show(
        notification.hashCode,
        notification.title,
        notification.body,
        NotificationDetails(
          android: AndroidNotificationDetails(
            'dispatch_channel',
            '배차 알림',
            channelDescription: '배차 관련 푸시 알림',
            importance: Importance.high,
            priority: Priority.high,
            icon: '@mipmap/ic_launcher',
          ),
          iOS: const DarwinNotificationDetails(
            presentAlert: true,
            presentBadge: true,
            presentSound: true,
          ),
        ),
        payload: jsonEncode(message.data),
      );
    }

    // 콜백 호출
    _onMessageCallback?.call(message);
  }

  /// 알림 탭 처리
  void _handleNotificationTap(RemoteMessage message) {
    debugPrint('알림 탭: ${message.data}');
    _onNotificationTapCallback?.call(message.data);
  }

  /// 로컬 알림 탭 처리
  void _handleLocalNotificationTap(String? payload) {
    if (payload != null) {
      try {
        final data = jsonDecode(payload) as Map<String, dynamic>;
        _onNotificationTapCallback?.call(data);
      } catch (e) {
        debugPrint('페이로드 파싱 실패: $e');
      }
    }
  }

  /// 서버에 토큰 등록
  Future<void> _registerTokenToServer(String token) async {
    try {
      final apiService = ApiService();
      final deviceType = Platform.isIOS ? 'IOS' : 'ANDROID';
      await apiService.registerDeviceToken(token, deviceType);
      debugPrint('FCM 토큰 서버 등록 완료');
    } catch (e) {
      debugPrint('FCM 토큰 서버 등록 실패: $e');
    }
  }

  /// 서버에 토큰 등록 (로그인 후 호출)
  Future<void> registerToken() async {
    if (_fcmToken != null) {
      await _registerTokenToServer(_fcmToken!);
    }
  }

  /// 서버에서 토큰 삭제 (로그아웃 시 호출)
  Future<void> unregisterToken() async {
    if (_fcmToken != null) {
      try {
        final apiService = ApiService();
        await apiService.deleteDeviceToken(_fcmToken!);
        debugPrint('FCM 토큰 서버 삭제 완료');
      } catch (e) {
        debugPrint('FCM 토큰 서버 삭제 실패: $e');
      }
    }
  }

  // 콜백
  void Function(RemoteMessage)? _onMessageCallback;
  void Function(Map<String, dynamic>)? _onNotificationTapCallback;

  /// 메시지 수신 콜백 설정
  void setOnMessageCallback(void Function(RemoteMessage) callback) {
    _onMessageCallback = callback;
  }

  /// 알림 탭 콜백 설정
  void setOnNotificationTapCallback(
      void Function(Map<String, dynamic>) callback) {
    _onNotificationTapCallback = callback;
  }

  /// 토픽 구독
  Future<void> subscribeToTopic(String topic) async {
    if (_messaging == null) return;
    await _messaging!.subscribeToTopic(topic);
    debugPrint('토픽 구독: $topic');
  }

  /// 토픽 구독 해제
  Future<void> unsubscribeFromTopic(String topic) async {
    if (_messaging == null) return;
    await _messaging!.unsubscribeFromTopic(topic);
    debugPrint('토픽 구독 해제: $topic');
  }
}
