import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class StatisticsScreen extends StatefulWidget {
  const StatisticsScreen({super.key});

  @override
  State<StatisticsScreen> createState() => _StatisticsScreenState();
}

class _StatisticsScreenState extends State<StatisticsScreen> {
  final ApiService _apiService = ApiService();
  Map<String, dynamic>? _stats;
  bool _loading = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    _loadStatistics();
  }

  Future<void> _loadStatistics() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final response = await _apiService.getDriverStatistics();
      if (response.data['success'] == true && response.data['data'] != null) {
        setState(() {
          _stats = response.data['data'];
          _loading = false;
        });
      } else {
        setState(() {
          _error = response.data['message'] ?? '통계를 불러올 수 없습니다';
          _loading = false;
        });
      }
    } catch (e) {
      setState(() {
        _error = '통계를 불러오는 중 오류가 발생했습니다';
        _loading = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('내 통계'),
      ),
      body: _buildBody(),
    );
  }

  Widget _buildBody() {
    if (_loading) {
      return const Center(child: CircularProgressIndicator());
    }

    if (_error != null) {
      return Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(Icons.error_outline, size: 64, color: Colors.grey[400]),
            const SizedBox(height: 16),
            Text(_error!, style: TextStyle(color: Colors.grey[600])),
            const SizedBox(height: 16),
            ElevatedButton(
              onPressed: _loadStatistics,
              child: const Text('다시 시도'),
            ),
          ],
        ),
      );
    }

    if (_stats == null) {
      return const Center(child: Text('통계 정보가 없습니다'));
    }

    final priceFormat = NumberFormat('#,###');
    final totalDispatches = _stats!['totalDispatches'] ?? 0;
    final completedDispatches = _stats!['completedDispatches'] ?? 0;
    final cancelledDispatches = _stats!['cancelledDispatches'] ?? 0;
    final averageRating = (_stats!['averageRating'] ?? 0.0).toDouble();
    final totalRatings = _stats!['totalRatings'] ?? 0;
    final totalEarnings = _stats!['totalEarnings'] ?? 0;
    final grade = _stats!['grade'] ?? 'GRADE_3';

    return RefreshIndicator(
      onRefresh: _loadStatistics,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 등급 카드
            _buildGradeCard(grade, averageRating, totalRatings),
            const SizedBox(height: 16),

            // 배차 통계 카드
            _buildDispatchStatsCard(
              totalDispatches,
              completedDispatches,
              cancelledDispatches,
            ),
            const SizedBox(height: 16),

            // 수익 카드
            _buildEarningsCard(totalEarnings, priceFormat),
            const SizedBox(height: 16),

            // 최근 배차 목록
            if (_stats!['recentDispatches'] != null)
              _buildRecentDispatchesCard(_stats!['recentDispatches']),
          ],
        ),
      ),
    );
  }

  Widget _buildGradeCard(String grade, double averageRating, int totalRatings) {
    Color gradeColor;
    String gradeText;
    IconData gradeIcon;

    switch (grade) {
      case 'GRADE_1':
        gradeColor = Colors.amber[700]!;
        gradeText = '1등급';
        gradeIcon = Icons.military_tech;
        break;
      case 'GRADE_2':
        gradeColor = Colors.grey[400]!;
        gradeText = '2등급';
        gradeIcon = Icons.workspace_premium;
        break;
      default:
        gradeColor = Colors.brown[400]!;
        gradeText = '3등급';
        gradeIcon = Icons.emoji_events;
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(gradeIcon, color: gradeColor, size: 48),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      gradeText,
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: gradeColor,
                      ),
                    ),
                    Text(
                      '현재 등급',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.grey[600],
                      ),
                    ),
                  ],
                ),
              ],
            ),
            const SizedBox(height: 20),
            const Divider(),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                const Icon(Icons.star, color: Colors.amber, size: 28),
                const SizedBox(width: 8),
                Text(
                  averageRating.toStringAsFixed(1),
                  style: const TextStyle(
                    fontSize: 24,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  '($totalRatings개 평가)',
                  style: TextStyle(
                    fontSize: 14,
                    color: Colors.grey[600],
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDispatchStatsCard(
    int total,
    int completed,
    int cancelled,
  ) {
    final completionRate = total > 0 ? (completed / total * 100) : 0.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '배차 통계',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildStatItem(
                    '총 배차',
                    total.toString(),
                    Icons.assignment,
                    Colors.blue,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    '완료',
                    completed.toString(),
                    Icons.check_circle,
                    Colors.green,
                  ),
                ),
                Expanded(
                  child: _buildStatItem(
                    '취소',
                    cancelled.toString(),
                    Icons.cancel,
                    Colors.red,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            const Divider(),
            const SizedBox(height: 12),
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text('완료율'),
                Text(
                  '${completionRate.toStringAsFixed(1)}%',
                  style: TextStyle(
                    fontWeight: FontWeight.bold,
                    color: completionRate >= 90
                        ? Colors.green
                        : completionRate >= 70
                            ? Colors.orange
                            : Colors.red,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 8),
            LinearProgressIndicator(
              value: completionRate / 100,
              backgroundColor: Colors.grey[200],
              valueColor: AlwaysStoppedAnimation<Color>(
                completionRate >= 90
                    ? Colors.green
                    : completionRate >= 70
                        ? Colors.orange
                        : Colors.red,
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatItem(
    String label,
    String value,
    IconData icon,
    Color color,
  ) {
    return Column(
      children: [
        Icon(icon, color: color, size: 28),
        const SizedBox(height: 8),
        Text(
          value,
          style: const TextStyle(
            fontSize: 24,
            fontWeight: FontWeight.bold,
          ),
        ),
        Text(
          label,
          style: TextStyle(
            fontSize: 12,
            color: Colors.grey[600],
          ),
        ),
      ],
    );
  }

  Widget _buildEarningsCard(int totalEarnings, NumberFormat priceFormat) {
    return Card(
      color: Colors.green[50],
      child: Padding(
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.account_balance_wallet, color: Colors.green[700], size: 32),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '총 수익',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.green[700],
                      ),
                    ),
                    Text(
                      '${priceFormat.format(totalEarnings)}원',
                      style: TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Colors.green[700],
                      ),
                    ),
                  ],
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildRecentDispatchesCard(List<dynamic> dispatches) {
    if (dispatches.isEmpty) {
      return const SizedBox.shrink();
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '최근 배차',
              style: TextStyle(
                fontSize: 18,
                fontWeight: FontWeight.bold,
              ),
            ),
            const Divider(),
            ...dispatches.take(5).map((dispatch) {
              final status = dispatch['status'] ?? '';
              final address = dispatch['siteAddress'] ?? '-';
              final date = dispatch['workDate'] ?? '-';

              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: _getStatusColor(status).withOpacity(0.2),
                  child: Icon(
                    _getStatusIcon(status),
                    color: _getStatusColor(status),
                    size: 20,
                  ),
                ),
                title: Text(
                  address,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(date),
                trailing: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withOpacity(0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    _getStatusText(status),
                    style: TextStyle(
                      color: _getStatusColor(status),
                      fontSize: 12,
                    ),
                  ),
                ),
              );
            }),
          ],
        ),
      ),
    );
  }

  Color _getStatusColor(String status) {
    switch (status) {
      case 'COMPLETED':
        return Colors.green;
      case 'CANCELLED':
        return Colors.red;
      case 'IN_PROGRESS':
        return Colors.orange;
      case 'MATCHED':
        return Colors.blue;
      default:
        return Colors.grey;
    }
  }

  IconData _getStatusIcon(String status) {
    switch (status) {
      case 'COMPLETED':
        return Icons.check_circle;
      case 'CANCELLED':
        return Icons.cancel;
      case 'IN_PROGRESS':
        return Icons.construction;
      case 'MATCHED':
        return Icons.handshake;
      default:
        return Icons.hourglass_empty;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'COMPLETED':
        return '완료';
      case 'CANCELLED':
        return '취소';
      case 'IN_PROGRESS':
        return '진행중';
      case 'MATCHED':
        return '매칭됨';
      case 'OPEN':
        return '대기중';
      default:
        return status;
    }
  }
}
