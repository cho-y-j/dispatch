import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class ApiService {
  static const String baseUrl = 'http://10.0.2.2:8082/api'; // Android 에뮬레이터
  // static const String baseUrl = 'http://localhost:8082/api'; // iOS 시뮬레이터

  late final Dio _dio;
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  ApiService() {
    _dio = Dio(BaseOptions(
      baseUrl: baseUrl,
      connectTimeout: const Duration(seconds: 10),
      receiveTimeout: const Duration(seconds: 10),
      headers: {'Content-Type': 'application/json'},
    ));

    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await _storage.read(key: 'accessToken');
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // 토큰 만료 시 리프레시 시도
          final refreshed = await _refreshToken();
          if (refreshed) {
            // 원래 요청 재시도
            final opts = error.requestOptions;
            final token = await _storage.read(key: 'accessToken');
            opts.headers['Authorization'] = 'Bearer $token';
            final response = await _dio.fetch(opts);
            return handler.resolve(response);
          }
        }
        return handler.next(error);
      },
    ));
  }

  Future<bool> _refreshToken() async {
    try {
      final refreshToken = await _storage.read(key: 'refreshToken');
      if (refreshToken == null) return false;

      final response = await _dio.post(
        '/auth/refresh',
        options: Options(headers: {'X-Refresh-Token': refreshToken}),
      );

      if (response.data['success']) {
        await _storage.write(
          key: 'accessToken',
          value: response.data['data']['accessToken'],
        );
        await _storage.write(
          key: 'refreshToken',
          value: response.data['data']['refreshToken'],
        );
        return true;
      }
    } catch (e) {
      // 리프레시 실패
    }
    return false;
  }

  // 인증
  Future<Response> register({
    required String email,
    required String password,
    required String name,
    required String phone,
    String role = 'DRIVER',
  }) {
    return _dio.post('/auth/register', data: {
      'email': email,
      'password': password,
      'name': name,
      'phone': phone,
      'role': role,
    });
  }

  Future<Response> login({required String email, required String password}) {
    return _dio.post('/auth/login', data: {
      'email': email,
      'password': password,
    });
  }

  // 기사
  Future<Response> registerDriver({
    required String businessRegNumber,
    required String driverLicenseNumber,
  }) {
    return _dio.post('/drivers/register', data: {
      'businessRegistrationNumber': businessRegNumber,
      'driverLicenseNumber': driverLicenseNumber,
    });
  }

  Future<Response> uploadDocument(String type, dynamic file) {
    final endpoint = type == 'business_registration'
        ? '/drivers/documents/business-registration'
        : '/drivers/documents/driver-license';

    return _dio.post(
      endpoint,
      data: FormData.fromMap({
        'file': MultipartFile.fromFileSync(file.path),
      }),
    );
  }

  Future<Response> uploadBusinessRegistration(String filePath) {
    return _dio.post(
      '/drivers/documents/business-registration',
      data: FormData.fromMap({
        'file': MultipartFile.fromFileSync(filePath),
      }),
    );
  }

  Future<Response> uploadDriverLicense(String filePath) {
    return _dio.post(
      '/drivers/documents/driver-license',
      data: FormData.fromMap({
        'file': MultipartFile.fromFileSync(filePath),
      }),
    );
  }

  // 장비
  Future<Response> registerEquipment({
    required String type,
    String? model,
    double? tonnage,
    String? vehicleNumber,
  }) {
    return _dio.post('/equipments', data: {
      'type': type,
      'model': model,
      'tonnage': tonnage,
      'vehicleNumber': vehicleNumber,
    });
  }

  Future<Response> uploadEquipmentImage(int equipmentId, dynamic file) {
    return _dio.post(
      '/equipments/$equipmentId/images',
      data: FormData.fromMap({
        'file': MultipartFile.fromFileSync(file.path),
      }),
    );
  }

  Future<Response> getProfile() {
    return _dio.get('/drivers/profile');
  }

  Future<Response> updateLocation(double latitude, double longitude) {
    return _dio.put('/drivers/location', data: {
      'latitude': latitude,
      'longitude': longitude,
    });
  }

  Future<Response> setActive(bool active) {
    return _dio.put('/drivers/active', queryParameters: {'active': active});
  }

  // 배차
  Future<Response> getAvailableDispatches({
    double? latitude,
    double? longitude,
    double radiusKm = 50,
  }) {
    return _dio.get('/dispatches/available', queryParameters: {
      if (latitude != null) 'latitude': latitude,
      if (longitude != null) 'longitude': longitude,
      'radiusKm': radiusKm,
    });
  }

  Future<Response> getDispatchDetail(int id) {
    return _dio.get('/dispatches/$id');
  }

  Future<Response> acceptDispatch(int id) {
    return _dio.post('/dispatches/$id/accept');
  }

  Future<Response> departForSite(int id) {
    return _dio.post('/dispatches/$id/depart');
  }

  Future<Response> arriveAtSite(int id) {
    return _dio.post('/dispatches/$id/arrive');
  }

  Future<Response> startWork(int id) {
    return _dio.post('/dispatches/$id/start-work');
  }

  Future<Response> completeWork(int id) {
    return _dio.post('/dispatches/$id/complete');
  }

  Future<Response> signByDriver(int id, String signature, {double? finalPrice, String? workNotes}) {
    return _dio.post('/dispatches/$id/sign/driver', data: {
      'signature': signature,
      if (finalPrice != null) 'finalPrice': finalPrice,
      if (workNotes != null) 'workNotes': workNotes,
    });
  }

  Future<Response> signByClient(int id, String signature, String clientName) {
    return _dio.post('/dispatches/$id/sign/client', data: {
      'signature': signature,
      'clientName': clientName,
    });
  }

  Future<Response> getDriverDispatches() {
    return _dio.get('/dispatches/driver/history');
  }

  // 발주처용 배차 등록
  Future<Response> createDispatch({
    required String siteAddress,
    String? siteDetail,
    String? contactName,
    String? contactPhone,
    required String workDate,
    required String workTime,
    required String equipmentType,
    String? workDescription,
    int? estimatedHours,
    double? minHeight,
    double? price,
    bool isUrgent = false,
    int? minDriverRating,
  }) {
    return _dio.post('/dispatches', data: {
      'siteAddress': siteAddress,
      if (siteDetail != null && siteDetail.isNotEmpty) 'siteDetail': siteDetail,
      if (contactName != null && contactName.isNotEmpty) 'contactName': contactName,
      if (contactPhone != null && contactPhone.isNotEmpty) 'contactPhone': contactPhone,
      'workDate': workDate,
      'workTime': workTime,
      'equipmentType': equipmentType,
      if (workDescription != null && workDescription.isNotEmpty) 'workDescription': workDescription,
      if (estimatedHours != null) 'estimatedHours': estimatedHours,
      if (minHeight != null) 'minHeight': minHeight,
      if (price != null) 'price': price,
      'isUrgent': isUrgent,
      if (minDriverRating != null) 'minDriverRating': minDriverRating,
    });
  }

  // 발주처용 배차 목록
  Future<Response> getCompanyDispatches() {
    return _dio.get('/dispatches/company/history');
  }

  // 배차 취소
  Future<Response> cancelDispatch(int id) {
    return _dio.post('/dispatches/$id/cancel');
  }

  // 기사 평가
  Future<Response> rateDriver(int dispatchId, int rating, String? comment) {
    return _dio.post('/dispatches/$dispatchId/rating', data: {
      'rating': rating,
      if (comment != null && comment.isNotEmpty) 'comment': comment,
    });
  }

  // 채팅
  Future<Response> getChatMessages(int dispatchId) {
    return _dio.get('/dispatches/$dispatchId/chat/messages');
  }

  Future<Response> sendChatMessage(int dispatchId, String message, {String? imageUrl}) {
    return _dio.post('/dispatches/$dispatchId/chat/messages', data: {
      'message': message,
      if (imageUrl != null) 'imageUrl': imageUrl,
    });
  }

  Future<Response> markChatAsRead(int dispatchId) {
    return _dio.put('/dispatches/$dispatchId/chat/messages/read');
  }

  Future<Response> getUnreadChatCount(int dispatchId) {
    return _dio.get('/dispatches/$dispatchId/chat/unread-count');
  }

  // 통계
  Future<Response> getDriverStatistics() {
    return _dio.get('/drivers/statistics');
  }

  // 디바이스 토큰 (FCM)
  Future<Response> registerDeviceToken(String token, String deviceType) {
    return _dio.post('/devices/token', data: {
      'token': token,
      'deviceType': deviceType,
    });
  }

  Future<Response> deleteDeviceToken(String token) {
    return _dio.delete('/devices/token', queryParameters: {'token': token});
  }

  // 토큰 저장
  Future<void> saveTokens(String accessToken, String refreshToken) async {
    await _storage.write(key: 'accessToken', value: accessToken);
    await _storage.write(key: 'refreshToken', value: refreshToken);
  }

  Future<void> clearTokens() async {
    await _storage.delete(key: 'accessToken');
    await _storage.delete(key: 'refreshToken');
  }

  Future<String?> getAccessToken() async {
    return await _storage.read(key: 'accessToken');
  }
}
