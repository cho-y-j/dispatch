import 'dart:async';
import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:stomp_dart_client/stomp_dart_client.dart';

enum MessageType {
  newDispatch,
  dispatchAccepted,
  dispatchArrived,
  dispatchCompleted,
  dispatchCancelled,
  driverApproved,
  driverRejected,
  locationUpdate,
  systemNotice,
}

class WebSocketMessage<T> {
  final MessageType type;
  final String title;
  final String message;
  final T? data;
  final DateTime timestamp;

  WebSocketMessage({
    required this.type,
    required this.title,
    required this.message,
    this.data,
    required this.timestamp,
  });

  factory WebSocketMessage.fromJson(Map<String, dynamic> json) {
    return WebSocketMessage(
      type: _parseMessageType(json['type']),
      title: json['title'] ?? '',
      message: json['message'] ?? '',
      data: json['data'] as T?,
      timestamp: DateTime.tryParse(json['timestamp'] ?? '') ?? DateTime.now(),
    );
  }

  static MessageType _parseMessageType(String? type) {
    switch (type) {
      case 'NEW_DISPATCH':
        return MessageType.newDispatch;
      case 'DISPATCH_ACCEPTED':
        return MessageType.dispatchAccepted;
      case 'DISPATCH_ARRIVED':
        return MessageType.dispatchArrived;
      case 'DISPATCH_COMPLETED':
        return MessageType.dispatchCompleted;
      case 'DISPATCH_CANCELLED':
        return MessageType.dispatchCancelled;
      case 'DRIVER_APPROVED':
        return MessageType.driverApproved;
      case 'DRIVER_REJECTED':
        return MessageType.driverRejected;
      case 'LOCATION_UPDATE':
        return MessageType.locationUpdate;
      case 'SYSTEM_NOTICE':
        return MessageType.systemNotice;
      default:
        return MessageType.systemNotice;
    }
  }
}

class DispatchNotification {
  final int dispatchId;
  final String siteAddress;
  final String? siteDetail;
  final double latitude;
  final double longitude;
  final String workDate;
  final String workTime;
  final int? estimatedHours;
  final String equipmentType;
  final double? price;
  final bool? priceNegotiable;
  final String status;

  DispatchNotification({
    required this.dispatchId,
    required this.siteAddress,
    this.siteDetail,
    required this.latitude,
    required this.longitude,
    required this.workDate,
    required this.workTime,
    this.estimatedHours,
    required this.equipmentType,
    this.price,
    this.priceNegotiable,
    required this.status,
  });

  factory DispatchNotification.fromJson(Map<String, dynamic> json) {
    return DispatchNotification(
      dispatchId: json['dispatchId'] ?? 0,
      siteAddress: json['siteAddress'] ?? '',
      siteDetail: json['siteDetail'],
      latitude: (json['latitude'] ?? 0).toDouble(),
      longitude: (json['longitude'] ?? 0).toDouble(),
      workDate: json['workDate'] ?? '',
      workTime: json['workTime'] ?? '',
      estimatedHours: json['estimatedHours'],
      equipmentType: json['equipmentType'] ?? '',
      price: json['price']?.toDouble(),
      priceNegotiable: json['priceNegotiable'],
      status: json['status'] ?? '',
    );
  }
}

class WebSocketService {
  static final WebSocketService _instance = WebSocketService._internal();
  factory WebSocketService() => _instance;
  WebSocketService._internal();

  StompClient? _client;
  bool _isConnected = false;
  String? _token;

  // 메시지 스트림
  final _messageController = StreamController<WebSocketMessage>.broadcast();
  Stream<WebSocketMessage> get messageStream => _messageController.stream;

  // 새 배차 스트림
  final _newDispatchController = StreamController<DispatchNotification>.broadcast();
  Stream<DispatchNotification> get newDispatchStream => _newDispatchController.stream;

  // 연결 상태 스트림
  final _connectionController = StreamController<bool>.broadcast();
  Stream<bool> get connectionStream => _connectionController.stream;

  bool get isConnected => _isConnected;

  void connect(String token) {
    if (_isConnected && _token == token) return;

    _token = token;
    disconnect();

    const baseUrl = String.fromEnvironment(
      'API_URL',
      defaultValue: 'http://10.0.2.2:8082', // Android 에뮬레이터용
    );
    final wsUrl = '$baseUrl/ws';

    _client = StompClient(
      config: StompConfig(
        url: wsUrl,
        stompConnectHeaders: {
          'Authorization': 'Bearer $token',
        },
        webSocketConnectHeaders: {
          'Authorization': 'Bearer $token',
        },
        onConnect: _onConnect,
        onDisconnect: _onDisconnect,
        onStompError: _onError,
        onWebSocketError: _onWebSocketError,
        reconnectDelay: const Duration(seconds: 5),
      ),
    );

    _client!.activate();
  }

  void disconnect() {
    if (_client != null) {
      _client!.deactivate();
      _client = null;
    }
    _isConnected = false;
    _connectionController.add(false);
  }

  void _onConnect(StompFrame frame) {
    debugPrint('[WebSocket] Connected');
    _isConnected = true;
    _connectionController.add(true);

    // 새 배차 구독 (브로드캐스트)
    _client?.subscribe(
      destination: '/topic/dispatches',
      callback: _handleDispatchMessage,
    );

    // 시스템 공지 구독 (브로드캐스트)
    _client?.subscribe(
      destination: '/topic/notices',
      callback: _handleMessage,
    );

    // 개인 알림 구독
    _client?.subscribe(
      destination: '/user/queue/notifications',
      callback: _handleMessage,
    );
  }

  void _onDisconnect(StompFrame frame) {
    debugPrint('[WebSocket] Disconnected');
    _isConnected = false;
    _connectionController.add(false);
  }

  void _onError(StompFrame frame) {
    debugPrint('[WebSocket] STOMP Error: ${frame.body}');
  }

  void _onWebSocketError(dynamic error) {
    debugPrint('[WebSocket] WebSocket Error: $error');
    _isConnected = false;
    _connectionController.add(false);
  }

  void _handleMessage(StompFrame frame) {
    if (frame.body == null) return;

    try {
      final json = jsonDecode(frame.body!);
      final message = WebSocketMessage.fromJson(json);
      _messageController.add(message);
    } catch (e) {
      debugPrint('[WebSocket] Parse error: $e');
    }
  }

  void _handleDispatchMessage(StompFrame frame) {
    if (frame.body == null) return;

    try {
      final json = jsonDecode(frame.body!);
      final message = WebSocketMessage.fromJson(json);
      _messageController.add(message);

      // 새 배차 데이터 파싱
      if (message.type == MessageType.newDispatch && message.data != null) {
        final dispatch = DispatchNotification.fromJson(message.data as Map<String, dynamic>);
        _newDispatchController.add(dispatch);
      }
    } catch (e) {
      debugPrint('[WebSocket] Parse error: $e');
    }
  }

  // 위치 업데이트 전송
  void sendLocationUpdate({
    required double latitude,
    required double longitude,
    double? heading,
    double? speed,
  }) {
    if (!_isConnected || _client == null) return;

    _client!.send(
      destination: '/app/location',
      body: jsonEncode({
        'latitude': latitude,
        'longitude': longitude,
        'heading': heading,
        'speed': speed,
        'timestamp': DateTime.now().toIso8601String(),
      }),
    );
  }

  // Ping 전송
  void ping() {
    if (!_isConnected || _client == null) return;

    _client!.send(
      destination: '/app/ping',
      body: '',
    );
  }

  void dispose() {
    disconnect();
    _messageController.close();
    _newDispatchController.close();
    _connectionController.close();
  }
}
