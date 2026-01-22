import 'package:flutter/material.dart';
import '../../services/api_service.dart';
import '../../models/chat_message.dart';
import '../chat_screen.dart';

class CompanyDispatchDetailScreen extends StatefulWidget {
  final int dispatchId;

  const CompanyDispatchDetailScreen({
    super.key,
    required this.dispatchId,
  });

  @override
  State<CompanyDispatchDetailScreen> createState() => _CompanyDispatchDetailScreenState();
}

class _CompanyDispatchDetailScreenState extends State<CompanyDispatchDetailScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _dispatch;
  bool _isLoading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadDispatch();
  }

  Future<void> _loadDispatch() async {
    try {
      final response = await _apiService.getDispatchDetail(widget.dispatchId);
      if (response.data['success']) {
        setState(() {
          _dispatch = response.data['data'];
          _isLoading = false;
        });
      } else {
        setState(() {
          _error = response.data['message'];
          _isLoading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = '배차 정보를 불러오지 못했습니다';
        _isLoading = false;
      });
    }
  }

  Future<void> _cancelDispatch() async {
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('배차 취소'),
        content: const Text('정말 이 배차를 취소하시겠습니까?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context, false),
            child: const Text('아니오'),
          ),
          TextButton(
            onPressed: () => Navigator.pop(context, true),
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('취소'),
          ),
        ],
      ),
    );

    if (confirmed == true) {
      try {
        final response = await _apiService.cancelDispatch(widget.dispatchId);
        if (response.data['success'] && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('배차가 취소되었습니다')),
          );
          Navigator.pop(context);
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('취소에 실패했습니다')),
          );
        }
      }
    }
  }

  Future<void> _rateDriver() async {
    final rating = await showDialog<int>(
      context: context,
      builder: (context) => _RatingDialog(),
    );

    if (rating != null) {
      try {
        final response = await _apiService.rateDriver(
          widget.dispatchId,
          rating,
          '',
        );
        if (response.data['success'] && mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('평가가 완료되었습니다')),
          );
          _loadDispatch();
        }
      } catch (e) {
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('평가에 실패했습니다')),
          );
        }
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final hasMatch = _dispatch != null && _dispatch!['driverName'] != null;

    return Scaffold(
      appBar: AppBar(
        title: Text('배차 #${widget.dispatchId}'),
        actions: [
          if (hasMatch)
            IconButton(
              icon: const Icon(Icons.chat_bubble_outline),
              tooltip: '채팅',
              onPressed: () {
                Navigator.of(context).push(
                  MaterialPageRoute(
                    builder: (_) => ChatScreen(
                      dispatchId: widget.dispatchId,
                      currentUserType: SenderType.COMPANY,
                    ),
                  ),
                );
              },
            ),
        ],
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_isLoading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(_error!, style: const TextStyle(color: Colors.red)),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadDispatch,
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    if (_dispatch == null) {
      return const Center(child: Text('배차 정보가 없습니다'));
    }

    final status = _dispatch!['status'] ?? 'OPEN';
    final matchStatus = _dispatch!['matchStatus'];

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // 상태 카드
          _StatusCard(status: status, matchStatus: matchStatus),
          const SizedBox(height: 16),

          // 현장 정보
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '현장 정보',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  const Divider(),
                  _InfoRow(icon: Icons.location_on, label: '주소', value: _dispatch!['siteAddress'] ?? '-'),
                  if (_dispatch!['siteDetail'] != null)
                    _InfoRow(icon: Icons.apartment, label: '상세', value: _dispatch!['siteDetail']),
                  _InfoRow(
                    icon: Icons.calendar_today,
                    label: '일시',
                    value: '${_dispatch!['workDate'] ?? '-'} ${_dispatch!['workTime'] ?? ''}',
                  ),
                  _InfoRow(icon: Icons.construction, label: '장비', value: _dispatch!['equipmentType'] ?? '-'),
                  if (_dispatch!['workDescription'] != null)
                    _InfoRow(icon: Icons.description, label: '작업내용', value: _dispatch!['workDescription']),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // 담당자 정보
          if (_dispatch!['contactName'] != null || _dispatch!['contactPhone'] != null)
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '현장 담당자',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Divider(),
                    if (_dispatch!['contactName'] != null)
                      _InfoRow(icon: Icons.person, label: '이름', value: _dispatch!['contactName']),
                    if (_dispatch!['contactPhone'] != null)
                      _InfoRow(icon: Icons.phone, label: '연락처', value: _dispatch!['contactPhone']),
                  ],
                ),
              ),
            ),

          // 기사 정보 (매칭된 경우)
          if (_dispatch!['driverName'] != null) ...[
            const SizedBox(height: 16),
            Card(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    const Text(
                      '배정된 기사',
                      style: TextStyle(
                        fontSize: 16,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                    const Divider(),
                    _InfoRow(icon: Icons.person, label: '기사명', value: _dispatch!['driverName']),
                    if (_dispatch!['driverPhone'] != null)
                      _InfoRow(icon: Icons.phone, label: '연락처', value: _dispatch!['driverPhone']),
                    if (_dispatch!['driverRating'] != null)
                      Row(
                        children: [
                          const Icon(Icons.star, size: 20, color: Colors.amber),
                          const SizedBox(width: 8),
                          Text(
                            '${_dispatch!['driverRating']}',
                            style: const TextStyle(fontWeight: FontWeight.w500),
                          ),
                        ],
                      ),
                  ],
                ),
              ),
            ),
          ],

          const SizedBox(height: 24),

          // 액션 버튼
          if (status == 'OPEN')
            ElevatedButton(
              onPressed: _cancelDispatch,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.red,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('배차 취소'),
            ),

          if (status == 'COMPLETED' && matchStatus == 'SIGNED' && _dispatch!['rated'] != true)
            ElevatedButton(
              onPressed: _rateDriver,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange[600],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: const Text('기사 평가하기'),
            ),
        ],
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  final String status;
  final String? matchStatus;

  const _StatusCard({required this.status, this.matchStatus});

  @override
  Widget build(BuildContext context) {
    Color color;
    IconData icon;
    String text;
    String description;

    switch (status) {
      case 'OPEN':
        color = Colors.blue;
        icon = Icons.hourglass_empty;
        text = '대기 중';
        description = '기사 배정을 기다리고 있습니다';
        break;
      case 'MATCHED':
        color = Colors.orange;
        icon = Icons.person_add;
        text = '매칭됨';
        description = _getMatchStatusDescription(matchStatus);
        break;
      case 'IN_PROGRESS':
        color = Colors.green;
        icon = Icons.construction;
        text = '진행 중';
        description = _getMatchStatusDescription(matchStatus);
        break;
      case 'COMPLETED':
        color = Colors.grey;
        icon = Icons.check_circle;
        text = '완료';
        description = '작업이 완료되었습니다';
        break;
      case 'CANCELLED':
        color = Colors.red;
        icon = Icons.cancel;
        text = '취소됨';
        description = '배차가 취소되었습니다';
        break;
      default:
        color = Colors.grey;
        icon = Icons.help;
        text = status;
        description = '';
    }

    return Card(
      color: color.withOpacity(0.1),
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Row(
          children: [
            Icon(icon, size: 48, color: color),
            const SizedBox(width: 16),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    text,
                    style: TextStyle(
                      fontSize: 20,
                      fontWeight: FontWeight.bold,
                      color: color,
                    ),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    description,
                    style: TextStyle(color: color.withOpacity(0.8)),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  String _getMatchStatusDescription(String? matchStatus) {
    switch (matchStatus) {
      case 'ACCEPTED':
        return '기사가 배차를 수락했습니다';
      case 'EN_ROUTE':
        return '기사가 현장으로 이동 중입니다';
      case 'ARRIVED':
        return '기사가 현장에 도착했습니다';
      case 'WORKING':
        return '작업이 진행 중입니다';
      case 'COMPLETED':
        return '작업이 완료되었습니다';
      case 'SIGNED':
        return '서명이 완료되었습니다';
      default:
        return '';
    }
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 20, color: Colors.grey),
          const SizedBox(width: 12),
          SizedBox(
            width: 60,
            child: Text(
              label,
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: const TextStyle(fontSize: 14),
            ),
          ),
        ],
      ),
    );
  }
}

class _RatingDialog extends StatefulWidget {
  @override
  State<_RatingDialog> createState() => _RatingDialogState();
}

class _RatingDialogState extends State<_RatingDialog> {
  int _rating = 5;

  @override
  Widget build(BuildContext context) {
    return AlertDialog(
      title: const Text('기사 평가'),
      content: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const Text('기사의 서비스를 평가해주세요'),
          const SizedBox(height: 20),
          Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: List.generate(5, (index) {
              return IconButton(
                icon: Icon(
                  index < _rating ? Icons.star : Icons.star_border,
                  color: Colors.amber,
                  size: 36,
                ),
                onPressed: () {
                  setState(() {
                    _rating = index + 1;
                  });
                },
              );
            }),
          ),
          Text(
            '$_rating점',
            style: const TextStyle(
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
        ],
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context),
          child: const Text('취소'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, _rating),
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.orange[600],
          ),
          child: const Text('평가하기'),
        ),
      ],
    );
  }
}
