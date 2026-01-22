import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../services/fcm_service.dart';

class FcmProvider with ChangeNotifier {
  final FcmService _fcmService = FcmService();

  RemoteMessage? _lastMessage;
  Map<String, dynamic>? _pendingNotificationData;

  RemoteMessage? get lastMessage => _lastMessage;
  Map<String, dynamic>? get pendingNotificationData => _pendingNotificationData;
  String? get fcmToken => _fcmService.fcmToken;

  /// FCM 초기화
  Future<void> initialize() async {
    try {
      await _fcmService.initialize();

      // 메시지 수신 콜백
      _fcmService.setOnMessageCallback((message) {
        _lastMessage = message;
        notifyListeners();
      });

      // 알림 탭 콜백
      _fcmService.setOnNotificationTapCallback((data) {
        _pendingNotificationData = data;
        notifyListeners();
      });
    } catch (e) {
      debugPrint('FCM Provider 초기화 실패: $e');
    }
  }

  /// 서버에 토큰 등록 (로그인 후)
  Future<void> registerToken() async {
    await _fcmService.registerToken();
  }

  /// 서버에서 토큰 삭제 (로그아웃 시)
  Future<void> unregisterToken() async {
    await _fcmService.unregisterToken();
  }

  /// 알림 데이터 처리 완료
  void clearPendingNotification() {
    _pendingNotificationData = null;
    notifyListeners();
  }

  /// 토픽 구독
  Future<void> subscribeToTopic(String topic) async {
    await _fcmService.subscribeToTopic(topic);
  }

  /// 토픽 구독 해제
  Future<void> unsubscribeFromTopic(String topic) async {
    await _fcmService.unsubscribeFromTopic(topic);
  }
}
