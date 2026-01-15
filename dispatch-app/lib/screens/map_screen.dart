import 'dart:async';
import 'package:flutter/material.dart';
import 'package:google_maps_flutter/google_maps_flutter.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import '../providers/dispatch_provider.dart';
import '../models/dispatch.dart';
import 'dispatch_detail_screen.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  GoogleMapController? _mapController;
  Position? _currentPosition;
  bool _isLoading = true;
  String? _errorMessage;
  Set<Marker> _markers = {};

  // 서울 기본 위치
  static const LatLng _defaultLocation = LatLng(37.5665, 126.9780);

  @override
  void initState() {
    super.initState();
    _initializeMap();
  }

  Future<void> _initializeMap() async {
    await _getCurrentLocation();
    await _loadDispatches();
  }

  Future<void> _getCurrentLocation() async {
    try {
      // 위치 권한 확인
      LocationPermission permission = await Geolocator.checkPermission();
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        if (permission == LocationPermission.denied) {
          setState(() {
            _errorMessage = '위치 권한이 필요합니다';
            _isLoading = false;
          });
          return;
        }
      }

      if (permission == LocationPermission.deniedForever) {
        setState(() {
          _errorMessage = '설정에서 위치 권한을 허용해주세요';
          _isLoading = false;
        });
        return;
      }

      // 위치 서비스 활성화 확인
      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _errorMessage = '위치 서비스를 활성화해주세요';
          _isLoading = false;
        });
        return;
      }

      // 현재 위치 가져오기
      Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      setState(() {
        _currentPosition = position;
      });
    } catch (e) {
      debugPrint('위치 가져오기 오류: $e');
    }
  }

  Future<void> _loadDispatches() async {
    try {
      await context.read<DispatchProvider>().loadAvailableDispatches(
        latitude: _currentPosition?.latitude,
        longitude: _currentPosition?.longitude,
      );
      _updateMarkers();
    } catch (e) {
      debugPrint('배차 목록 로드 오류: $e');
    } finally {
      setState(() {
        _isLoading = false;
      });
    }
  }

  void _updateMarkers() {
    final dispatches = context.read<DispatchProvider>().availableDispatches;
    final Set<Marker> markers = {};

    // 현재 위치 마커
    if (_currentPosition != null) {
      markers.add(
        Marker(
          markerId: const MarkerId('current_location'),
          position: LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(BitmapDescriptor.hueAzure),
          infoWindow: const InfoWindow(title: '내 위치'),
        ),
      );
    }

    // 배차 마커
    for (final dispatch in dispatches) {
      markers.add(
        Marker(
          markerId: MarkerId('dispatch_${dispatch.id}'),
          position: LatLng(dispatch.latitude, dispatch.longitude),
          icon: BitmapDescriptor.defaultMarkerWithHue(_getMarkerColor(dispatch)),
          infoWindow: InfoWindow(
            title: dispatch.equipmentTypeName,
            snippet: '${dispatch.siteAddress}\n${_formatPrice(dispatch.price)}',
            onTap: () => _onMarkerTap(dispatch),
          ),
          onTap: () => _showDispatchBottomSheet(dispatch),
        ),
      );
    }

    setState(() {
      _markers = markers;
    });
  }

  double _getMarkerColor(Dispatch dispatch) {
    switch (dispatch.status) {
      case DispatchStatus.OPEN:
        return BitmapDescriptor.hueGreen;
      case DispatchStatus.MATCHED:
        return BitmapDescriptor.hueOrange;
      case DispatchStatus.IN_PROGRESS:
        return BitmapDescriptor.hueYellow;
      case DispatchStatus.COMPLETED:
        return BitmapDescriptor.hueBlue;
      case DispatchStatus.CANCELLED:
        return BitmapDescriptor.hueRed;
    }
  }

  String _formatPrice(double? price) {
    if (price == null) return '가격 협의';
    return '${price.toStringAsFixed(0)}원';
  }

  void _onMarkerTap(Dispatch dispatch) {
    context.read<DispatchProvider>().setCurrentDispatch(dispatch);
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (_) => DispatchDetailScreen(dispatch: dispatch),
      ),
    );
  }

  void _showDispatchBottomSheet(Dispatch dispatch) {
    showModalBottomSheet(
      context: context,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(16)),
      ),
      builder: (context) => _DispatchInfoSheet(
        dispatch: dispatch,
        currentPosition: _currentPosition,
        onViewDetail: () {
          Navigator.pop(context);
          context.read<DispatchProvider>().setCurrentDispatch(dispatch);
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (_) => DispatchDetailScreen(dispatch: dispatch),
            ),
          );
        },
      ),
    );
  }

  void _moveToCurrentLocation() {
    if (_currentPosition != null && _mapController != null) {
      _mapController!.animateCamera(
        CameraUpdate.newLatLngZoom(
          LatLng(_currentPosition!.latitude, _currentPosition!.longitude),
          14,
        ),
      );
    }
  }

  void _fitAllMarkers() {
    if (_markers.isEmpty || _mapController == null) return;

    double minLat = 90, maxLat = -90, minLng = 180, maxLng = -180;

    for (final marker in _markers) {
      final lat = marker.position.latitude;
      final lng = marker.position.longitude;
      if (lat < minLat) minLat = lat;
      if (lat > maxLat) maxLat = lat;
      if (lng < minLng) minLng = lng;
      if (lng > maxLng) maxLng = lng;
    }

    _mapController!.animateCamera(
      CameraUpdate.newLatLngBounds(
        LatLngBounds(
          southwest: LatLng(minLat, minLng),
          northeast: LatLng(maxLat, maxLng),
        ),
        50,
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            CircularProgressIndicator(),
            SizedBox(height: 16),
            Text('지도를 불러오는 중...'),
          ],
        ),
      );
    }

    if (_errorMessage != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.location_off, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(_errorMessage!, style: const TextStyle(fontSize: 16)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _initializeMap,
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    final initialPosition = _currentPosition != null
        ? LatLng(_currentPosition!.latitude, _currentPosition!.longitude)
        : _defaultLocation;

    return Stack(
      children: [
        GoogleMap(
          initialCameraPosition: CameraPosition(
            target: initialPosition,
            zoom: 12,
          ),
          markers: _markers,
          myLocationEnabled: true,
          myLocationButtonEnabled: false,
          zoomControlsEnabled: false,
          mapToolbarEnabled: false,
          onMapCreated: (controller) {
            _mapController = controller;
            // 모든 마커가 보이도록 카메라 조정
            Future.delayed(const Duration(milliseconds: 500), _fitAllMarkers);
          },
        ),
        // 범례
        Positioned(
          top: 16,
          left: 16,
          child: _buildLegend(),
        ),
        // 컨트롤 버튼들
        Positioned(
          bottom: 16,
          right: 16,
          child: Column(
            children: [
              FloatingActionButton.small(
                heroTag: 'fit_all',
                onPressed: _fitAllMarkers,
                child: const Icon(Icons.fit_screen),
              ),
              const SizedBox(height: 8),
              FloatingActionButton.small(
                heroTag: 'my_location',
                onPressed: _moveToCurrentLocation,
                child: const Icon(Icons.my_location),
              ),
              const SizedBox(height: 8),
              FloatingActionButton.small(
                heroTag: 'refresh',
                onPressed: () async {
                  setState(() => _isLoading = true);
                  await _loadDispatches();
                },
                child: const Icon(Icons.refresh),
              ),
            ],
          ),
        ),
        // 배차 개수 표시
        Positioned(
          top: 16,
          right: 16,
          child: Consumer<DispatchProvider>(
            builder: (context, provider, child) {
              return Container(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(20),
                  boxShadow: [
                    BoxShadow(
                      color: Colors.black.withOpacity(0.1),
                      blurRadius: 4,
                      offset: const Offset(0, 2),
                    ),
                  ],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    const Icon(Icons.local_shipping, size: 18, color: Colors.green),
                    const SizedBox(width: 4),
                    Text(
                      '${provider.availableDispatches.length}건',
                      style: const TextStyle(fontWeight: FontWeight.bold),
                    ),
                  ],
                ),
              );
            },
          ),
        ),
      ],
    );
  }

  Widget _buildLegend() {
    return Container(
      padding: const EdgeInsets.all(8),
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(8),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          _legendItem(Colors.green, '배차 대기'),
          _legendItem(Colors.orange, '매칭 완료'),
          _legendItem(Colors.blue, '내 위치'),
        ],
      ),
    );
  }

  Widget _legendItem(Color color, String label) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 2),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 6),
          Text(label, style: const TextStyle(fontSize: 12)),
        ],
      ),
    );
  }

  @override
  void dispose() {
    _mapController?.dispose();
    super.dispose();
  }
}

class _DispatchInfoSheet extends StatelessWidget {
  final Dispatch dispatch;
  final Position? currentPosition;
  final VoidCallback onViewDetail;

  const _DispatchInfoSheet({
    required this.dispatch,
    this.currentPosition,
    required this.onViewDetail,
  });

  String _calculateDistance() {
    if (currentPosition == null) return '';

    double distance = Geolocator.distanceBetween(
      currentPosition!.latitude,
      currentPosition!.longitude,
      dispatch.latitude,
      dispatch.longitude,
    );

    if (distance < 1000) {
      return '${distance.toStringAsFixed(0)}m';
    } else {
      return '${(distance / 1000).toStringAsFixed(1)}km';
    }
  }

  @override
  Widget build(BuildContext context) {
    final distance = _calculateDistance();

    return Container(
      padding: const EdgeInsets.all(20),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // 헤더
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                decoration: BoxDecoration(
                  color: Colors.green,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Text(
                  dispatch.statusText,
                  style: const TextStyle(
                    color: Colors.white,
                    fontSize: 12,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ),
              const Spacer(),
              if (distance.isNotEmpty)
                Row(
                  children: [
                    const Icon(Icons.near_me, size: 16, color: Colors.blue),
                    const SizedBox(width: 4),
                    Text(
                      distance,
                      style: const TextStyle(
                        color: Colors.blue,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ],
                ),
            ],
          ),
          const SizedBox(height: 12),

          // 장비 종류
          Text(
            dispatch.equipmentTypeName,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),

          // 주소
          Row(
            children: [
              const Icon(Icons.location_on, size: 16, color: Colors.grey),
              const SizedBox(width: 4),
              Expanded(
                child: Text(
                  dispatch.siteAddress,
                  style: TextStyle(color: Colors.grey[700]),
                ),
              ),
            ],
          ),
          const SizedBox(height: 4),

          // 작업일시
          Row(
            children: [
              const Icon(Icons.calendar_today, size: 16, color: Colors.grey),
              const SizedBox(width: 4),
              Text(
                '${dispatch.workDate.year}.${dispatch.workDate.month}.${dispatch.workDate.day} ${dispatch.workTime}',
                style: TextStyle(color: Colors.grey[700]),
              ),
            ],
          ),
          const SizedBox(height: 4),

          // 가격
          Row(
            children: [
              const Icon(Icons.payments, size: 16, color: Colors.grey),
              const SizedBox(width: 4),
              Text(
                dispatch.price != null
                    ? '${dispatch.price!.toStringAsFixed(0)}원'
                    : '가격 협의',
                style: TextStyle(
                  color: Colors.grey[700],
                  fontWeight: FontWeight.bold,
                ),
              ),
              if (dispatch.priceNegotiable == true)
                const Text(' (협의 가능)', style: TextStyle(color: Colors.grey)),
            ],
          ),
          const SizedBox(height: 16),

          // 상세 보기 버튼
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: onViewDetail,
              style: ElevatedButton.styleFrom(
                padding: const EdgeInsets.symmetric(vertical: 12),
              ),
              child: const Text('상세 보기'),
            ),
          ),
        ],
      ),
    );
  }
}
