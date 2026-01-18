import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import 'package:url_launcher/url_launcher.dart';
import '../providers/dispatch_provider.dart';
import '../models/dispatch.dart';
import '../models/chat_message.dart';
import 'signature_screen.dart';
import 'chat_screen.dart';

class DispatchDetailScreen extends StatelessWidget {
  final Dispatch dispatch;

  const DispatchDetailScreen({super.key, required this.dispatch});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('배차 상세'),
        actions: [
          if (dispatch.match != null)
            IconButton(
              icon: const Icon(Icons.chat_bubble_outline),
              tooltip: '채팅',
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => ChatScreen(
                      dispatchId: dispatch.id,
                      currentUserType: SenderType.DRIVER,
                    ),
                  ),
                );
              },
            ),
        ],
      ),
      body: Consumer<DispatchProvider>(
        builder: (context, provider, child) {
          final currentDispatch = provider.currentDispatch ?? dispatch;
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                _buildInfoCard(context, currentDispatch),
                const SizedBox(height: 16),
                _buildLocationCard(context, currentDispatch),
                const SizedBox(height: 16),
                _buildWorkCard(currentDispatch),
                const SizedBox(height: 24),
                _buildActionButton(context, provider, currentDispatch),
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildInfoCard(BuildContext context, Dispatch dispatch) {
    final dateFormat = DateFormat('yyyy년 MM월 dd일 (E)', 'ko_KR');
    final priceFormat = NumberFormat('#,###');

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: Theme.of(context).primaryColor,
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    dispatch.equipmentTypeName,
                    style: const TextStyle(color: Colors.white, fontWeight: FontWeight.bold),
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getStatusColor(dispatch),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text(
                    dispatch.match != null ? dispatch.matchStatusText : dispatch.statusText,
                    style: const TextStyle(color: Colors.white, fontSize: 12),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Text(
              dateFormat.format(dispatch.workDate),
              style: const TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 4),
            Text(
              '${dispatch.workTime.substring(0, 5)} 시작',
              style: const TextStyle(fontSize: 16, color: Colors.grey),
            ),
            if (dispatch.price != null) ...[
              const Divider(height: 24),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  const Text('요금', style: TextStyle(color: Colors.grey)),
                  Text(
                    '${priceFormat.format(dispatch.price)}원',
                    style: const TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: Colors.green,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildLocationCard(BuildContext context, Dispatch dispatch) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                const Icon(Icons.location_on, color: Colors.red),
                const SizedBox(width: 8),
                const Text('현장 위치', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
                const Spacer(),
                TextButton.icon(
                  onPressed: () => _openKakaoNavi(context, dispatch),
                  icon: const Icon(Icons.navigation, size: 18),
                  label: const Text('길안내'),
                  style: TextButton.styleFrom(
                    padding: const EdgeInsets.symmetric(horizontal: 8),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Text(dispatch.siteAddress, style: const TextStyle(fontSize: 15)),
            if (dispatch.siteDetail != null) ...[
              const SizedBox(height: 4),
              Text(
                dispatch.siteDetail!,
                style: const TextStyle(color: Colors.grey),
              ),
            ],
            const SizedBox(height: 12),
            if (dispatch.contactName != null || dispatch.contactPhone != null) ...[
              const Divider(),
              const SizedBox(height: 8),
              const Text('현장 담당자', style: TextStyle(color: Colors.grey, fontSize: 12)),
              const SizedBox(height: 4),
              Row(
                children: [
                  if (dispatch.contactName != null)
                    Text(dispatch.contactName!, style: const TextStyle(fontWeight: FontWeight.bold)),
                  if (dispatch.contactPhone != null) ...[
                    const SizedBox(width: 8),
                    Text(dispatch.contactPhone!, style: const TextStyle(color: Colors.blue)),
                  ],
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }

  Future<void> _openKakaoNavi(BuildContext context, Dispatch dispatch) async {
    // 카카오내비 딥링크
    final kakaoNaviUrl = Uri.parse(
      'kakaonavi-sdk://route?ep=${dispatch.latitude},${dispatch.longitude}&by=CAR',
    );

    // 카카오맵 웹 URL (카카오내비가 없을 경우 폴백)
    final kakaoMapUrl = Uri.parse(
      'https://map.kakao.com/link/to/${Uri.encodeComponent(dispatch.siteAddress)},${dispatch.latitude},${dispatch.longitude}',
    );

    try {
      if (await canLaunchUrl(kakaoNaviUrl)) {
        await launchUrl(kakaoNaviUrl);
      } else if (await canLaunchUrl(kakaoMapUrl)) {
        await launchUrl(kakaoMapUrl, mode: LaunchMode.externalApplication);
      } else {
        if (context.mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('내비게이션을 열 수 없습니다')),
          );
        }
      }
    } catch (e) {
      debugPrint('내비게이션 열기 오류: $e');
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('내비게이션을 열 수 없습니다')),
        );
      }
    }
  }

  Widget _buildWorkCard(Dispatch dispatch) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Row(
              children: [
                Icon(Icons.work, color: Colors.blue),
                SizedBox(width: 8),
                Text('작업 정보', style: TextStyle(fontWeight: FontWeight.bold, fontSize: 16)),
              ],
            ),
            const SizedBox(height: 12),
            if (dispatch.estimatedHours != null)
              _buildInfoRow('예상 작업 시간', '약 ${dispatch.estimatedHours}시간'),
            if (dispatch.minHeight != null)
              _buildInfoRow('최소 작업 높이', '${dispatch.minHeight}m'),
            if (dispatch.equipmentRequirements != null)
              _buildInfoRow('장비 요구사항', dispatch.equipmentRequirements!),
            if (dispatch.workDescription != null) ...[
              const SizedBox(height: 8),
              const Text('작업 내용', style: TextStyle(color: Colors.grey, fontSize: 12)),
              const SizedBox(height: 4),
              Text(dispatch.workDescription!),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildInfoRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Widget _buildActionButton(BuildContext context, DispatchProvider provider, Dispatch dispatch) {
    if (provider.isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    // 배차 상태에 따른 버튼
    if (dispatch.status == DispatchStatus.OPEN) {
      return ElevatedButton(
        onPressed: () => _acceptDispatch(context, provider, dispatch.id),
        style: ElevatedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: 16),
          backgroundColor: Colors.green,
        ),
        child: const Text('배차 수락', style: TextStyle(fontSize: 16, color: Colors.white)),
      );
    }

    if (dispatch.match != null) {
      switch (dispatch.match!.status) {
        case MatchStatus.ACCEPTED:
          return ElevatedButton(
            onPressed: () => _updateStatus(context, provider, dispatch.id, 'depart'),
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            child: const Text('출발하기', style: TextStyle(fontSize: 16)),
          );
        case MatchStatus.EN_ROUTE:
          return ElevatedButton(
            onPressed: () => _updateStatus(context, provider, dispatch.id, 'arrive'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: Colors.orange,
            ),
            child: const Text('현장 도착', style: TextStyle(fontSize: 16, color: Colors.white)),
          );
        case MatchStatus.ARRIVED:
          return ElevatedButton(
            onPressed: () => _updateStatus(context, provider, dispatch.id, 'start'),
            style: ElevatedButton.styleFrom(padding: const EdgeInsets.symmetric(vertical: 16)),
            child: const Text('작업 시작', style: TextStyle(fontSize: 16)),
          );
        case MatchStatus.WORKING:
          return ElevatedButton(
            onPressed: () => _updateStatus(context, provider, dispatch.id, 'complete'),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: Colors.blue,
            ),
            child: const Text('작업 완료', style: TextStyle(fontSize: 16, color: Colors.white)),
          );
        case MatchStatus.COMPLETED:
          return ElevatedButton(
            onPressed: () => _goToSignature(context, dispatch),
            style: ElevatedButton.styleFrom(
              padding: const EdgeInsets.symmetric(vertical: 16),
              backgroundColor: Colors.purple,
            ),
            child: const Text('서명하기', style: TextStyle(fontSize: 16, color: Colors.white)),
          );
        case MatchStatus.SIGNED:
          return Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(
              color: Colors.green.shade50,
              borderRadius: BorderRadius.circular(8),
            ),
            child: const Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.check_circle, color: Colors.green),
                SizedBox(width: 8),
                Text('완료됨', style: TextStyle(color: Colors.green, fontWeight: FontWeight.bold)),
              ],
            ),
          );
        default:
          return const SizedBox.shrink();
      }
    }

    return const SizedBox.shrink();
  }

  Color _getStatusColor(Dispatch dispatch) {
    if (dispatch.match != null) {
      switch (dispatch.match!.status) {
        case MatchStatus.ACCEPTED:
          return Colors.blue;
        case MatchStatus.EN_ROUTE:
          return Colors.orange;
        case MatchStatus.ARRIVED:
          return Colors.purple;
        case MatchStatus.WORKING:
          return Colors.deepPurple;
        case MatchStatus.COMPLETED:
          return Colors.teal;
        case MatchStatus.SIGNED:
          return Colors.green;
        case MatchStatus.CANCELLED:
          return Colors.red;
      }
    }
    switch (dispatch.status) {
      case DispatchStatus.OPEN:
        return Colors.green;
      case DispatchStatus.MATCHED:
        return Colors.blue;
      case DispatchStatus.IN_PROGRESS:
        return Colors.orange;
      case DispatchStatus.COMPLETED:
        return Colors.grey;
      case DispatchStatus.CANCELLED:
        return Colors.red;
    }
  }

  Future<void> _acceptDispatch(BuildContext context, DispatchProvider provider, int id) async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('배차 수락'),
        content: const Text('이 배차를 수락하시겠습니까?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('취소')),
          ElevatedButton(onPressed: () => Navigator.pop(context, true), child: const Text('수락')),
        ],
      ),
    );

    if (confirmed == true) {
      final success = await provider.acceptDispatch(id);
      if (success && context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('배차를 수락했습니다')),
        );
      }
    }
  }

  Future<void> _updateStatus(BuildContext context, DispatchProvider provider, int id, String action) async {
    await provider.updateStatus(id, action);
  }

  void _goToSignature(BuildContext context, Dispatch dispatch) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => SignatureScreen(dispatch: dispatch),
      ),
    );
  }
}
