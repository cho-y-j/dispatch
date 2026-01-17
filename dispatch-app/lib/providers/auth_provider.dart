import 'package:flutter/material.dart';
import '../models/user.dart';
import '../models/auth_response.dart';
import '../services/api_service.dart';
import '../services/fcm_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  final FcmService _fcmService = FcmService();
  User? _user;
  bool _isLoading = false;
  String? _error;
  String? _token;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null;
  bool get isAuthenticated => _user != null;
  String? get error => _error;
  String? get token => _token;

  Future<bool> register({
    required String email,
    required String password,
    required String name,
    required String phone,
  }) async {
    return registerWithRole(
      email: email,
      password: password,
      name: name,
      phone: phone,
      role: 'DRIVER',
    );
  }

  Future<bool> registerWithRole({
    required String email,
    required String password,
    required String name,
    required String phone,
    required String role,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.register(
        email: email,
        password: password,
        name: name,
        phone: phone,
        role: role,
      );

      if (response.data['success']) {
        final authResponse = AuthResponse.fromJson(response.data['data']);
        await _apiService.saveTokens(
          authResponse.accessToken,
          authResponse.refreshToken,
        );
        _token = authResponse.accessToken;
        _user = authResponse.user;
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response.data['message'];
      }
    } catch (e) {
      _error = '회원가입에 실패했습니다';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> login({required String email, required String password}) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      final response = await _apiService.login(
        email: email,
        password: password,
      );

      if (response.data['success']) {
        final authResponse = AuthResponse.fromJson(response.data['data']);
        await _apiService.saveTokens(
          authResponse.accessToken,
          authResponse.refreshToken,
        );
        _token = authResponse.accessToken;
        _user = authResponse.user;

        // FCM 토큰 등록 (실패해도 무시)
        try {
          await _fcmService.registerToken();
        } catch (e) {
          // FCM 미설정 시 무시
        }

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response.data['message'];
      }
    } catch (e) {
      _error = '로그인에 실패했습니다';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<void> logout() async {
    // FCM 토큰 삭제 (실패해도 무시)
    try {
      await _fcmService.unregisterToken();
    } catch (e) {
      // FCM 미설정 시 무시
    }

    await _apiService.clearTokens();
    _user = null;
    _token = null;
    notifyListeners();
  }

  Future<bool> checkLoginStatus() async {
    return checkAuthStatus();
  }

  Future<bool> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();

    final accessToken = await _apiService.getAccessToken();
    if (accessToken != null) {
      try {
        final response = await _apiService.getProfile();
        if (response.data['success']) {
          _token = accessToken;
          _user = User.fromJson(response.data['data']['user']);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      } catch (e) {
        // 토큰 만료 등
      }
    }
    _token = null;
    _isLoading = false;
    notifyListeners();
    return false;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
