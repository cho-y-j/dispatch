import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../services/api_service.dart';

class CompanyStatisticsScreen extends StatefulWidget {
  const CompanyStatisticsScreen({super.key});

  @override
  State<CompanyStatisticsScreen> createState() => _CompanyStatisticsScreenState();
}

class _CompanyStatisticsScreenState extends State<CompanyStatisticsScreen> {
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
      final response = await _apiService.getCompanyStatistics();
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
        title: const Text('발주처 통계'),
        backgroundColor: Colors.purple[600],
        foregroundColor: Colors.white,
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
    final totalAmount = _stats!['totalAmount'] ?? 0;
    final warningCount = _stats!['warningCount'] ?? 0;
    final employeeCount = _stats!['employeeCount'] ?? 0;

    return RefreshIndicator(
      onRefresh: _loadStatistics,
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 회사 정보 카드
            _buildCompanyInfoCard(),
            const SizedBox(height: 16),

            // 배차 통계 요약 카드
            _buildSummaryCards(
              totalDispatches,
              completedDispatches,
              cancelledDispatches,
            ),
            const SizedBox(height: 16),

            // 상세 배차 통계 카드
            _buildDispatchStatsCard(
              totalDispatches,
              completedDispatches,
              cancelledDispatches,
            ),
            const SizedBox(height: 16),

            // 이용 금액 카드
            _buildAmountCard(totalAmount, priceFormat),
            const SizedBox(height: 16),

            // 부가 정보 카드
            _buildInfoCard(warningCount, employeeCount),
            const SizedBox(height: 16),

            // 최근 배차 목록
            if (_stats!['recentDispatches'] != null)
              _buildRecentDispatchesCard(_stats!['recentDispatches']),
          ],
        ),
      ),
    );
  }

  Widget _buildCompanyInfoCard() {
    final companyName = _stats!['companyName'] ?? '-';
    final businessNumber = _stats!['businessNumber'] ?? '-';
    final status = _stats!['status'] ?? 'PENDING';

    return Card(
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.purple[600]!, Colors.purple[400]!],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.business, color: Colors.white.withOpacity(0.9), size: 32),
                const SizedBox(width: 12),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        companyName,
                        style: const TextStyle(
                          fontSize: 20,
                          fontWeight: FontWeight.bold,
                          color: Colors.white,
                        ),
                      ),
                      Text(
                        businessNumber,
                        style: TextStyle(
                          fontSize: 14,
                          color: Colors.white.withOpacity(0.8),
                        ),
                      ),
                    ],
                  ),
                ),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  decoration: BoxDecoration(
                    color: _getStatusColor(status).withOpacity(0.2),
                    borderRadius: BorderRadius.circular(20),
                    border: Border.all(color: Colors.white.withOpacity(0.3)),
                  ),
                  child: Text(
                    _getStatusText(status),
                    style: const TextStyle(
                      color: Colors.white,
                      fontSize: 12,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCards(int total, int completed, int cancelled) {
    return Row(
      children: [
        Expanded(
          child: _buildSummaryCard(
            '총 배차',
            total.toString(),
            Icons.assignment,
            Colors.blue,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildSummaryCard(
            '완료',
            completed.toString(),
            Icons.check_circle,
            Colors.green,
          ),
        ),
        const SizedBox(width: 12),
        Expanded(
          child: _buildSummaryCard(
            '취소',
            cancelled.toString(),
            Icons.cancel,
            Colors.red,
          ),
        ),
      ],
    );
  }

  Widget _buildSummaryCard(String label, String value, IconData icon, Color color) {
    return Card(
      child: Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: color.withOpacity(0.1),
                shape: BoxShape.circle,
              ),
              child: Icon(icon, color: color, size: 24),
            ),
            const SizedBox(height: 12),
            Text(
              value,
              style: TextStyle(
                fontSize: 24,
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey[600],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildDispatchStatsCard(int total, int completed, int cancelled) {
    final completionRate = total > 0 ? (completed / total * 100) : 0.0;
    final cancelRate = total > 0 ? (cancelled / total * 100) : 0.0;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.bar_chart, color: Colors.purple[600]),
                const SizedBox(width: 8),
                const Text(
                  '배차 현황',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 20),

            // 완료율 바
            _buildProgressRow(
              '완료율',
              completionRate,
              Colors.green,
            ),
            const SizedBox(height: 16),

            // 취소율 바
            _buildProgressRow(
              '취소율',
              cancelRate,
              Colors.red,
            ),
            const SizedBox(height: 20),

            // 시각적 차트 (간단한 바 차트)
            _buildSimpleBarChart(total, completed, cancelled),
          ],
        ),
      ),
    );
  }

  Widget _buildProgressRow(String label, double percentage, Color color) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(label, style: TextStyle(color: Colors.grey[700])),
            Text(
              '${percentage.toStringAsFixed(1)}%',
              style: TextStyle(
                fontWeight: FontWeight.bold,
                color: color,
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        ClipRRect(
          borderRadius: BorderRadius.circular(4),
          child: LinearProgressIndicator(
            value: percentage / 100,
            minHeight: 8,
            backgroundColor: Colors.grey[200],
            valueColor: AlwaysStoppedAnimation<Color>(color),
          ),
        ),
      ],
    );
  }

  Widget _buildSimpleBarChart(int total, int completed, int cancelled) {
    final maxValue = [total, completed, cancelled].reduce((a, b) => a > b ? a : b);
    if (maxValue == 0) return const SizedBox.shrink();

    return Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.grey[50],
        borderRadius: BorderRadius.circular(8),
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceEvenly,
        crossAxisAlignment: CrossAxisAlignment.end,
        children: [
          _buildBar('총', total, maxValue, Colors.blue),
          _buildBar('완료', completed, maxValue, Colors.green),
          _buildBar('취소', cancelled, maxValue, Colors.red),
        ],
      ),
    );
  }

  Widget _buildBar(String label, int value, int maxValue, Color color) {
    final height = maxValue > 0 ? (value / maxValue * 80) : 0.0;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Text(
          value.toString(),
          style: TextStyle(
            fontWeight: FontWeight.bold,
            fontSize: 12,
            color: color,
          ),
        ),
        const SizedBox(height: 4),
        Container(
          width: 40,
          height: height,
          decoration: BoxDecoration(
            color: color,
            borderRadius: BorderRadius.circular(4),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          label,
          style: TextStyle(fontSize: 11, color: Colors.grey[600]),
        ),
      ],
    );
  }

  Widget _buildAmountCard(int totalAmount, NumberFormat priceFormat) {
    return Card(
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            colors: [Colors.green[600]!, Colors.green[400]!],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        padding: const EdgeInsets.all(20),
        child: Column(
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.payments, color: Colors.white.withOpacity(0.9), size: 32),
                const SizedBox(width: 12),
                Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      '총 이용 금액',
                      style: TextStyle(
                        fontSize: 14,
                        color: Colors.white.withOpacity(0.8),
                      ),
                    ),
                    Text(
                      '${priceFormat.format(totalAmount)}원',
                      style: const TextStyle(
                        fontSize: 28,
                        fontWeight: FontWeight.bold,
                        color: Colors.white,
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

  Widget _buildInfoCard(int warningCount, int employeeCount) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Icon(Icons.info_outline, color: Colors.purple[600]),
                const SizedBox(width: 8),
                const Text(
                  '부가 정보',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),
            Row(
              children: [
                Expanded(
                  child: _buildInfoItem(
                    Icons.warning_amber,
                    '경고',
                    '$warningCount회',
                    warningCount > 0 ? Colors.orange : Colors.grey,
                  ),
                ),
                Expanded(
                  child: _buildInfoItem(
                    Icons.people,
                    '직원 수',
                    '$employeeCount명',
                    Colors.blue,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildInfoItem(IconData icon, String label, String value, Color color) {
    return Container(
      padding: const EdgeInsets.all(12),
      margin: const EdgeInsets.symmetric(horizontal: 4),
      decoration: BoxDecoration(
        color: color.withOpacity(0.1),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        children: [
          Icon(icon, color: color, size: 28),
          const SizedBox(height: 8),
          Text(
            value,
            style: TextStyle(
              fontSize: 18,
              fontWeight: FontWeight.bold,
              color: color,
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
            Row(
              children: [
                Icon(Icons.history, color: Colors.purple[600]),
                const SizedBox(width: 8),
                const Text(
                  '최근 배차',
                  style: TextStyle(
                    fontSize: 18,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
            const Divider(),
            ...dispatches.take(5).map((dispatch) {
              final status = dispatch['status'] ?? '';
              final address = dispatch['siteAddress'] ?? '-';
              final date = dispatch['workDate'] ?? '-';
              final price = dispatch['price'];

              return ListTile(
                contentPadding: EdgeInsets.zero,
                leading: CircleAvatar(
                  backgroundColor: _getDispatchStatusColor(status).withOpacity(0.2),
                  child: Icon(
                    _getDispatchStatusIcon(status),
                    color: _getDispatchStatusColor(status),
                    size: 20,
                  ),
                ),
                title: Text(
                  address,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                ),
                subtitle: Text(date),
                trailing: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                      decoration: BoxDecoration(
                        color: _getDispatchStatusColor(status).withOpacity(0.1),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text(
                        _getDispatchStatusText(status),
                        style: TextStyle(
                          color: _getDispatchStatusColor(status),
                          fontSize: 11,
                          fontWeight: FontWeight.bold,
                        ),
                      ),
                    ),
                    if (price != null)
                      Text(
                        '${NumberFormat('#,###').format(price)}원',
                        style: TextStyle(
                          fontSize: 12,
                          color: Colors.grey[600],
                        ),
                      ),
                  ],
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
      case 'APPROVED':
        return Colors.green;
      case 'PENDING':
        return Colors.orange;
      case 'SUSPENDED':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  String _getStatusText(String status) {
    switch (status) {
      case 'APPROVED':
        return '승인됨';
      case 'PENDING':
        return '대기중';
      case 'SUSPENDED':
        return '정지';
      default:
        return status;
    }
  }

  Color _getDispatchStatusColor(String status) {
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

  IconData _getDispatchStatusIcon(String status) {
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

  String _getDispatchStatusText(String status) {
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
