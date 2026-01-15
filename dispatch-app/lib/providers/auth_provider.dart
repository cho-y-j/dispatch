import 'package:flutter/material.dart';
import '../models/user.dart';
import '../models/auth_response.dart';
import '../services/api_service.dart';

class AuthProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  User? _user;
  bool _isLoading = false;
  String? _error;

  User? get user => _user;
  bool get isLoading => _isLoading;
  bool get isLoggedIn => _user != null;
  bool get isAuthenticated => _user != null;
  String? get error => _error;

  Future<bool> register({
    required String email,
    required String password,
    required String name,
    required String phone,
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
      );

      if (response.data['success']) {
        final authResponse = AuthResponse.fromJson(response.data['data']);
        await _apiService.saveTokens(
          authResponse.accessToken,
          authResponse.refreshToken,
        );
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
        _user = authResponse.user;
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
    await _apiService.clearTokens();
    _user = null;
    notifyListeners();
  }

  Future<bool> checkLoginStatus() async {
    return checkAuthStatus();
  }

  Future<bool> checkAuthStatus() async {
    _isLoading = true;
    notifyListeners();

    final token = await _apiService.getAccessToken();
    if (token != null) {
      try {
        final response = await _apiService.getProfile();
        if (response.data['success']) {
          _user = User.fromJson(response.data['data']['user']);
          _isLoading = false;
          notifyListeners();
          return true;
        }
      } catch (e) {
        // 토큰 만료 등
      }
    }
    _isLoading = false;
    notifyListeners();
    return false;
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
