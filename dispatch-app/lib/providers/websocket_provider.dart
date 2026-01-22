import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import '../services/websocket_service.dart';

class WebSocketProvider extends ChangeNotifier {
  final WebSocketService _wsService = WebSocketService();
  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();

  bool _isConnected = false;
  final List<WebSocketMessage> _messages = [];
  StreamSubscription? _messageSubscription;
  StreamSubscription? _connectionSubscription;
  StreamSubscription? _dispatchSubscription;

  bool get isConnected => _isConnected;
  List<WebSocketMessage> get messages => List.unmodifiable(_messages);
  int get unreadCount => _messages.where((m) => m.type != MessageType.locationUpdate).length;

  WebSocketProvider() {
    _initNotifications();
  }

  Future<void> _initNotifications() async {
    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );
    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _notifications.initialize(settings);
  }

  void connect(String token) {
    _wsService.connect(token);

    _connectionSubscription = _wsService.connectionStream.listen((connected) {
      _isConnected = connected;
      notifyListeners();
    });

    _messageSubscription = _wsService.messageStream.listen((message) {
      // 위치 업데이트는 저장하지 않음
      if (message.type != MessageType.locationUpdate) {
        _messages.insert(0, message);
        if (_messages.length > 100) {
          _messages.removeLast();
        }

        // 로컬 알림 표시
        _showNotification(message);

        notifyListeners();
      }
    });
  }

  void disconnect() {
    _wsService.disconnect();
    _messageSubscription?.cancel();
    _connectionSubscription?.cancel();
    _dispatchSubscription?.cancel();
    _isConnected = false;
    notifyListeners();
  }

  Future<void> _showNotification(WebSocketMessage message) async {
    const androidDetails = AndroidNotificationDetails(
      'dispatch_channel',
      '배차 알림',
      channelDescription: '배차 관련 알림',
      importance: Importance.high,
      priority: Priority.high,
      showWhen: true,
    );

    const iosDetails = DarwinNotificationDetails(
      presentAlert: true,
      presentBadge: true,
      presentSound: true,
    );

    const details = NotificationDetails(
      android: androidDetails,
      iOS: iosDetails,
    );

    await _notifications.show(
      DateTime.now().millisecondsSinceEpoch ~/ 1000,
      message.title,
      message.message,
      details,
    );
  }

  // 위치 업데이트 전송
  void sendLocationUpdate({
    required double latitude,
    required double longitude,
    double? heading,
    double? speed,
  }) {
    _wsService.sendLocationUpdate(
      latitude: latitude,
      longitude: longitude,
      heading: heading,
      speed: speed,
    );
  }

  // 메시지 삭제
  void clearMessages() {
    _messages.clear();
    notifyListeners();
  }

  // 특정 메시지 삭제
  void removeMessage(int index) {
    if (index >= 0 && index < _messages.length) {
      _messages.removeAt(index);
      notifyListeners();
    }
  }

  // 새 배차 스트림 접근
  Stream<DispatchNotification> get newDispatchStream => _wsService.newDispatchStream;

  @override
  void dispose() {
    disconnect();
    _wsService.dispose();
    super.dispose();
  }
}
