import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:geolocator/geolocator.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../config/app_config.dart';
import '../providers/dispatch_provider.dart';
import '../models/dispatch.dart';
import 'dispatch_detail_screen.dart';

class MapScreen extends StatefulWidget {
  const MapScreen({super.key});

  @override
  State<MapScreen> createState() => _MapScreenState();
}

class _MapScreenState extends State<MapScreen> {
  WebViewController? _webViewController;
  Position? _currentPosition;
  bool _isLoading = true;
  String? _errorMessage;

  @override
  void initState() {
    super.initState();
    _initializeMap();
  }

  Future<void> _initializeMap() async {
    await _getCurrentLocation();
    await _loadDispatches();
    _initWebView();
  }

  Future<void> _getCurrentLocation() async {
    try {
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

      bool serviceEnabled = await Geolocator.isLocationServiceEnabled();
      if (!serviceEnabled) {
        setState(() {
          _errorMessage = '위치 서비스를 활성화해주세요';
          _isLoading = false;
        });
        return;
      }

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
    } catch (e) {
      debugPrint('배차 목록 로드 오류: $e');
    }
  }

  void _initWebView() {
    final dispatches = context.read<DispatchProvider>().availableDispatches;
    final html = _generateMapHtml(dispatches);

    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'FlutterChannel',
        onMessageReceived: (message) {
          _handleMarkerTap(message.message);
        },
      )
      ..loadHtmlString(html);

    setState(() {
      _isLoading = false;
    });
  }

  String _generateMapHtml(List<Dispatch> dispatches) {
    final lat = _currentPosition?.latitude ?? 37.5665;
    final lng = _currentPosition?.longitude ?? 126.9780;

    final markersJson = dispatches.map((d) => {
      'id': d.id,
      'lat': d.latitude,
      'lng': d.longitude,
      'title': d.equipmentTypeName,
      'address': d.siteAddress,
      'price': d.price?.toStringAsFixed(0) ?? '협의',
    }).toList();

    return '''
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <style>
    * { margin: 0; padding: 0; }
    html, body { width: 100%; height: 100%; }
    #map { width: 100%; height: 100%; }
    .info-window {
      padding: 8px;
      font-size: 12px;
      line-height: 1.4;
    }
    .info-title {
      font-weight: bold;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script src="https://dapi.kakao.com/v2/maps/sdk.js?appkey=${AppConfig.kakaoAppKey}&autoload=false"></script>
  <script>
    kakao.maps.load(function() {
      var container = document.getElementById('map');
      var options = {
        center: new kakao.maps.LatLng($lat, $lng),
        level: 5
      };
      var map = new kakao.maps.Map(container, options);

      // 현재 위치 마커
      var currentMarker = new kakao.maps.Marker({
        map: map,
        position: new kakao.maps.LatLng($lat, $lng),
        image: new kakao.maps.MarkerImage(
          'https://t1.daumcdn.net/localimg/localimages/07/mapapidoc/markerStar.png',
          new kakao.maps.Size(24, 35)
        )
      });

      // 배차 마커들
      var dispatches = ${jsonEncode(markersJson)};
      var bounds = new kakao.maps.LatLngBounds();
      bounds.extend(new kakao.maps.LatLng($lat, $lng));

      dispatches.forEach(function(d) {
        var position = new kakao.maps.LatLng(d.lat, d.lng);
        bounds.extend(position);

        var marker = new kakao.maps.Marker({
          map: map,
          position: position
        });

        var infoContent = '<div class="info-window">' +
          '<div class="info-title">' + d.title + '</div>' +
          '<div>' + d.address + '</div>' +
          '<div>' + d.price + '원</div>' +
          '</div>';

        var infowindow = new kakao.maps.InfoWindow({
          content: infoContent
        });

        kakao.maps.event.addListener(marker, 'click', function() {
          if (window.FlutterChannel) {
            FlutterChannel.postMessage(d.id.toString());
          }
        });

        kakao.maps.event.addListener(marker, 'mouseover', function() {
          infowindow.open(map, marker);
        });

        kakao.maps.event.addListener(marker, 'mouseout', function() {
          infowindow.close();
        });
      });

      if (dispatches.length > 0) {
        map.setBounds(bounds);
      }
    });
  </script>
</body>
</html>
''';
  }

  void _handleMarkerTap(String dispatchIdStr) {
    final dispatchId = int.tryParse(dispatchIdStr);
    if (dispatchId == null) return;

    final dispatches = context.read<DispatchProvider>().availableDispatches;
    final dispatch = dispatches.firstWhere(
      (d) => d.id == dispatchId,
      orElse: () => dispatches.first,
    );
    _showDispatchBottomSheet(dispatch);
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
        onNavigate: () {
          Navigator.pop(context);
          _openKakaoNavi(dispatch);
        },
      ),
    );
  }

  Future<void> _openKakaoNavi(Dispatch dispatch) async {
    final kakaoNaviUrl = Uri.parse(
      'kakaonavi-sdk://route?ep=${dispatch.latitude},${dispatch.longitude}&by=CAR',
    );
    final kakaoMapUrl = Uri.parse(
      'https://map.kakao.com/link/to/${Uri.encodeComponent(dispatch.siteAddress)},${dispatch.latitude},${dispatch.longitude}',
    );

    try {
      if (await canLaunchUrl(kakaoNaviUrl)) {
        await launchUrl(kakaoNaviUrl);
      } else if (await canLaunchUrl(kakaoMapUrl)) {
        await launchUrl(kakaoMapUrl, mode: LaunchMode.externalApplication);
      } else {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('내비게이션을 열 수 없습니다')),
          );
        }
      }
    } catch (e) {
      debugPrint('내비게이션 열기 오류: $e');
    }
  }

  Future<void> _refresh() async {
    setState(() => _isLoading = true);
    await _loadDispatches();
    _initWebView();
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

    return Stack(
      children: [
        if (_webViewController != null)
          WebViewWidget(controller: _webViewController!),
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
                heroTag: 'refresh',
                onPressed: _refresh,
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
          _legendItem(Colors.amber, '내 위치'),
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
}

class _DispatchInfoSheet extends StatelessWidget {
  final Dispatch dispatch;
  final Position? currentPosition;
  final VoidCallback onViewDetail;
  final VoidCallback onNavigate;

  const _DispatchInfoSheet({
    required this.dispatch,
    this.currentPosition,
    required this.onViewDetail,
    required this.onNavigate,
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
          Text(
            dispatch.equipmentTypeName,
            style: const TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
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
            ],
          ),
          const SizedBox(height: 16),
          Row(
            children: [
              Expanded(
                child: OutlinedButton.icon(
                  onPressed: onNavigate,
                  icon: const Icon(Icons.navigation),
                  label: const Text('길안내'),
                  style: OutlinedButton.styleFrom(
                    padding: const EdgeInsets.symmetric(vertical: 12),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              Expanded(
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
        ],
      ),
    );
  }
}
