import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import '../models/dispatch.dart';
import '../services/api_service.dart';

class DispatchProvider with ChangeNotifier {
  final ApiService _apiService = ApiService();
  List<Dispatch> _availableDispatches = [];
  List<Dispatch> _myDispatches = [];
  Dispatch? _currentDispatch;
  bool _isLoading = false;
  String? _error;

  List<Dispatch> get availableDispatches => _availableDispatches;
  List<Dispatch> get myDispatches => _myDispatches;
  Dispatch? get currentDispatch => _currentDispatch;
  bool get isLoading => _isLoading;
  String? get error => _error;

  Future<void> loadAvailableDispatches({
    double? latitude,
    double? longitude,
  }) async {
    _isLoading = true;
    _error = null;
    notifyListeners();

    try {
      debugPrint('[DispatchProvider] loadAvailableDispatches 호출');
      final response = await _apiService.getAvailableDispatches(
        latitude: latitude,
        longitude: longitude,
      );
      debugPrint('[DispatchProvider] 응답: ${response.data}');

      if (response.data['success']) {
        final List<dynamic> data = response.data['data'];
        _availableDispatches = data.map((e) => Dispatch.fromJson(e)).toList();
        debugPrint('[DispatchProvider] 로드된 배차: ${_availableDispatches.length}건');
      } else {
        _error = response.data['message'];
        debugPrint('[DispatchProvider] 실패: $_error');
      }
    } catch (e) {
      _error = '배차 목록을 불러오는데 실패했습니다';
      debugPrint('[DispatchProvider] 에러: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<void> loadMyDispatches() async {
    _isLoading = true;
    notifyListeners();

    try {
      debugPrint('[DispatchProvider] loadMyDispatches 호출');
      final response = await _apiService.getDriverDispatches();
      debugPrint('[DispatchProvider] 내 배차 응답: ${response.data}');

      if (response.data['success']) {
        final List<dynamic> data = response.data['data'];
        _myDispatches = data.map((e) => Dispatch.fromJson(e)).toList();
        debugPrint('[DispatchProvider] 로드된 내 배차: ${_myDispatches.length}건');
      }
    } catch (e) {
      _error = '배차 이력을 불러오는데 실패했습니다';
      debugPrint('[DispatchProvider] 내 배차 에러: $e');
    }

    _isLoading = false;
    notifyListeners();
  }

  Future<bool> acceptDispatch(int id) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.acceptDispatch(id);

      if (response.data['success']) {
        _currentDispatch = Dispatch.fromJson(response.data['data']);
        await loadAvailableDispatches();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response.data['message'];
      }
    } catch (e) {
      _error = '배차 수락에 실패했습니다';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> updateStatus(int id, String action) async {
    _isLoading = true;
    notifyListeners();

    try {
      late final dynamic response;
      switch (action) {
        case 'depart':
          response = await _apiService.departForSite(id);
          break;
        case 'arrive':
          response = await _apiService.arriveAtSite(id);
          break;
        case 'start':
          response = await _apiService.startWork(id);
          break;
        case 'complete':
          response = await _apiService.completeWork(id);
          break;
        default:
          throw Exception('Invalid action');
      }

      if (response.data['success']) {
        _currentDispatch = Dispatch.fromJson(response.data['data']);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response.data['message'];
      }
    } catch (e) {
      _error = '상태 변경에 실패했습니다';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> signByDriver(int id, String signature, {double? finalPrice, String? workNotes}) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.signByDriver(
        id,
        signature,
        finalPrice: finalPrice,
        workNotes: workNotes,
      );

      if (response.data['success']) {
        _currentDispatch = Dispatch.fromJson(response.data['data']);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response.data['message'];
      }
    } catch (e) {
      _error = '서명에 실패했습니다';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  Future<bool> signByClient(int id, String signature, String clientName) async {
    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiService.signByClient(id, signature, clientName);

      if (response.data['success']) {
        _currentDispatch = Dispatch.fromJson(response.data['data']);
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _error = response.data['message'];
      }
    } catch (e) {
      _error = '서명에 실패했습니다';
    }

    _isLoading = false;
    notifyListeners();
    return false;
  }

  void setCurrentDispatch(Dispatch dispatch) {
    _currentDispatch = dispatch;
    notifyListeners();
  }

  void clearError() {
    _error = null;
    notifyListeners();
  }
}
