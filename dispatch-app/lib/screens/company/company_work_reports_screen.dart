import 'dart:ui' as ui;
import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import '../../models/work_report.dart';
import '../../services/api_service.dart';

class CompanyWorkReportsScreen extends StatefulWidget {
  const CompanyWorkReportsScreen({super.key});

  @override
  State<CompanyWorkReportsScreen> createState() => _CompanyWorkReportsScreenState();
}

class _CompanyWorkReportsScreenState extends State<CompanyWorkReportsScreen> {
  final ApiService _apiService = ApiService();
  List<WorkReport> _reports = [];
  bool _isLoading = true;
  String _filter = 'ALL'; // ALL, CONFIRMED, PENDING

  @override
  void initState() {
    super.initState();
    _loadReports();
  }

  Future<void> _loadReports() async {
    setState(() => _isLoading = true);
    try {
      final response = await _apiService.getCompanyWorkReports();
      if (response.data['success']) {
        final List<dynamic> data = response.data['data'] ?? [];
        setState(() {
          _reports = data.map((json) => WorkReport.fromJson(json)).toList();
        });
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('작업 확인서 로딩 실패: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  List<WorkReport> get _filteredReports {
    switch (_filter) {
      case 'CONFIRMED':
        return _reports.where((r) => r.isConfirmedByCompany).toList();
      case 'PENDING':
        return _reports.where((r) => !r.isConfirmedByCompany).toList();
      default:
        return _reports;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Column(
        children: [
          // Filter chips
          Container(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                _buildFilterChip('전체', 'ALL'),
                const SizedBox(width: 8),
                _buildFilterChip('확인완료', 'CONFIRMED'),
                const SizedBox(width: 8),
                _buildFilterChip('대기중', 'PENDING'),
              ],
            ),
          ),
          // Stats
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Text(
                  '총 ${_filteredReports.length}건',
                  style: const TextStyle(fontWeight: FontWeight.w500),
                ),
                const Spacer(),
                Text(
                  '확인: ${_reports.where((r) => r.isConfirmedByCompany).length}  ',
                  style: TextStyle(color: Colors.green[700], fontSize: 13),
                ),
                Text(
                  '대기: ${_reports.where((r) => !r.isConfirmedByCompany).length}',
                  style: TextStyle(color: Colors.orange[700], fontSize: 13),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // List
          Expanded(
            child: _isLoading
                ? const Center(child: CircularProgressIndicator())
                : _filteredReports.isEmpty
                    ? const Center(
                        child: Text(
                          '작업 확인서가 없습니다.',
                          style: TextStyle(color: Colors.grey),
                        ),
                      )
                    : RefreshIndicator(
                        onRefresh: _loadReports,
                        child: ListView.builder(
                          padding: const EdgeInsets.all(16),
                          itemCount: _filteredReports.length,
                          itemBuilder: (context, index) {
                            return _WorkReportCard(
                              report: _filteredReports[index],
                              onTap: () => _showReportDetail(_filteredReports[index]),
                              onSign: () => _showSignDialog(_filteredReports[index]),
                            );
                          },
                        ),
                      ),
          ),
        ],
      ),
    );
  }

  Widget _buildFilterChip(String label, String value) {
    final isSelected = _filter == value;
    return FilterChip(
      label: Text(label),
      selected: isSelected,
      onSelected: (_) => setState(() => _filter = value),
      selectedColor: Colors.orange[100],
      checkmarkColor: Colors.orange[700],
    );
  }

  void _showReportDetail(WorkReport report) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (context) => _WorkReportDetailSheet(report: report),
    );
  }

  Future<void> _showSignDialog(WorkReport report) async {
    final result = await showDialog<bool>(
      context: context,
      builder: (context) => _CompanySignDialog(
        report: report,
        apiService: _apiService,
      ),
    );

    if (result == true) {
      _loadReports();
    }
  }
}

class _WorkReportCard extends StatelessWidget {
  final WorkReport report;
  final VoidCallback onTap;
  final VoidCallback onSign;

  const _WorkReportCard({
    required this.report,
    required this.onTap,
    required this.onSign,
  });

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('yyyy-MM-dd');
    final currencyFormat = NumberFormat('#,###');

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Header
              Row(
                children: [
                  Text(
                    dateFormat.format(report.workDate),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                      fontSize: 16,
                    ),
                  ),
                  const Spacer(),
                  _buildConfirmBadge(),
                ],
              ),
              const SizedBox(height: 8),
              // Address
              Row(
                children: [
                  const Icon(Icons.location_on, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      report.siteAddress,
                      style: const TextStyle(color: Colors.grey),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 4),
              // Equipment & Driver
              Row(
                children: [
                  if (report.equipmentTypeName != null) ...[
                    const Icon(Icons.construction, size: 16, color: Colors.grey),
                    const SizedBox(width: 4),
                    Text(
                      report.equipmentTypeName!,
                      style: const TextStyle(color: Colors.grey, fontSize: 13),
                    ),
                    const SizedBox(width: 16),
                  ],
                  const Icon(Icons.person, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Text(
                    report.driverName,
                    style: const TextStyle(color: Colors.grey, fontSize: 13),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              // Price & Signatures
              Row(
                children: [
                  Text(
                    '${currencyFormat.format(report.displayPrice)}원',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.blue[700],
                    ),
                  ),
                  const Spacer(),
                  _buildSignatureStatus('기사', report.isSignedByDriver),
                  const SizedBox(width: 4),
                  _buildSignatureStatus('현장', report.isSignedByClient),
                ],
              ),
              // Sign button
              if (!report.isConfirmedByCompany && report.isSignedByClient) ...[
                const SizedBox(height: 12),
                SizedBox(
                  width: double.infinity,
                  child: ElevatedButton.icon(
                    onPressed: onSign,
                    icon: const Icon(Icons.check_circle_outline),
                    label: const Text('확인/서명'),
                    style: ElevatedButton.styleFrom(
                      backgroundColor: Colors.orange[600],
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildConfirmBadge() {
    if (report.isConfirmedByCompany) {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.green[100],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.check_circle, size: 14, color: Colors.green[700]),
            const SizedBox(width: 4),
            Text(
              '확인완료',
              style: TextStyle(fontSize: 12, color: Colors.green[700]),
            ),
          ],
        ),
      );
    } else {
      return Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
        decoration: BoxDecoration(
          color: Colors.orange[100],
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.hourglass_empty, size: 14, color: Colors.orange[700]),
            const SizedBox(width: 4),
            Text(
              '확인대기',
              style: TextStyle(fontSize: 12, color: Colors.orange[700]),
            ),
          ],
        ),
      );
    }
  }

  Widget _buildSignatureStatus(String label, bool signed) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: signed ? Colors.green[50] : Colors.grey[100],
        borderRadius: BorderRadius.circular(4),
      ),
      child: Text(
        '$label ${signed ? "완료" : "-"}',
        style: TextStyle(
          fontSize: 11,
          color: signed ? Colors.green[700] : Colors.grey,
        ),
      ),
    );
  }
}

class _WorkReportDetailSheet extends StatelessWidget {
  final WorkReport report;

  const _WorkReportDetailSheet({required this.report});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('yyyy-MM-dd');
    final dateTimeFormat = DateFormat('yyyy-MM-dd HH:mm');
    final currencyFormat = NumberFormat('#,###');

    return DraggableScrollableSheet(
      initialChildSize: 0.9,
      minChildSize: 0.5,
      maxChildSize: 0.95,
      builder: (context, scrollController) => Container(
        decoration: const BoxDecoration(
          color: Colors.white,
          borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            // Handle
            Container(
              margin: const EdgeInsets.symmetric(vertical: 12),
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: Colors.grey[300],
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            // Header
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 20),
              child: Row(
                children: [
                  const Text(
                    '작업 확인서 상세',
                    style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
                  ),
                  const Spacer(),
                  IconButton(
                    onPressed: () => Navigator.pop(context),
                    icon: const Icon(Icons.close),
                  ),
                ],
              ),
            ),
            const Divider(),
            // Content
            Expanded(
              child: ListView(
                controller: scrollController,
                padding: const EdgeInsets.all(20),
                children: [
                  // 배차 정보
                  _buildSection('배차 정보', [
                    _buildInfoRow('배차 번호', '#${report.dispatchId}'),
                    _buildInfoRow('작업일', dateFormat.format(report.workDate)),
                    if (report.workTime != null)
                      _buildInfoRow('작업 시간', report.workTime!),
                    if (report.equipmentTypeName != null)
                      _buildInfoRow('장비 종류', report.equipmentTypeName!),
                    _buildInfoRow('현장 주소', report.siteAddress),
                    if (report.siteDetail != null)
                      _buildInfoRow('상세 주소', report.siteDetail!),
                    if (report.workDescription != null)
                      _buildInfoRow('작업 내용', report.workDescription!),
                  ]),
                  const SizedBox(height: 20),
                  // 기사 정보
                  _buildSection('기사 정보', [
                    _buildInfoRow('이름', report.driverName),
                    _buildInfoRow('연락처', report.driverPhone),
                  ]),
                  const SizedBox(height: 20),
                  // 금액 정보
                  _buildSection('금액 정보', [
                    if (report.originalPrice != null)
                      _buildInfoRow('기본 금액', '${currencyFormat.format(report.originalPrice)}원'),
                    _buildInfoRow(
                      '최종 금액',
                      '${currencyFormat.format(report.displayPrice)}원',
                      highlight: true,
                    ),
                  ]),
                  const SizedBox(height: 20),
                  // 작업 시간 기록
                  _buildSection('작업 시간 기록', [
                    if (report.matchedAt != null)
                      _buildInfoRow('배차 수락', dateTimeFormat.format(report.matchedAt!)),
                    if (report.departedAt != null)
                      _buildInfoRow('현장 출발', dateTimeFormat.format(report.departedAt!)),
                    if (report.arrivedAt != null)
                      _buildInfoRow('현장 도착', dateTimeFormat.format(report.arrivedAt!)),
                    if (report.workStartedAt != null)
                      _buildInfoRow('작업 시작', dateTimeFormat.format(report.workStartedAt!)),
                    if (report.completedAt != null)
                      _buildInfoRow('작업 완료', dateTimeFormat.format(report.completedAt!)),
                  ]),
                  const SizedBox(height: 20),
                  // 서명 현황
                  _buildSection('서명 현황', [
                    _buildSignatureRow(
                      '기사 서명',
                      report.driverSignature,
                      report.driverSignedAt,
                      report.driverName,
                    ),
                    _buildSignatureRow(
                      '현장 담당자 서명',
                      report.clientSignature,
                      report.clientSignedAt,
                      report.clientName,
                    ),
                    _buildSignatureRow(
                      '발주처 확인',
                      report.companySignature,
                      report.companySignedAt,
                      report.companySignedBy,
                      confirmed: report.companyConfirmed,
                    ),
                  ]),
                  if (report.workNotes != null) ...[
                    const SizedBox(height: 20),
                    _buildSection('작업 메모', [
                      Container(
                        padding: const EdgeInsets.all(12),
                        decoration: BoxDecoration(
                          color: Colors.yellow[50],
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(report.workNotes!),
                      ),
                    ]),
                  ],
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection(String title, List<Widget> children) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.bold,
            color: Colors.black87,
          ),
        ),
        const SizedBox(height: 12),
        Container(
          padding: const EdgeInsets.all(16),
          decoration: BoxDecoration(
            color: Colors.grey[50],
            borderRadius: BorderRadius.circular(12),
          ),
          child: Column(children: children),
        ),
      ],
    );
  }

  Widget _buildInfoRow(String label, String value, {bool highlight = false}) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: TextStyle(color: Colors.grey[600], fontSize: 14),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: TextStyle(
                fontWeight: highlight ? FontWeight.bold : FontWeight.w500,
                color: highlight ? Colors.blue[700] : Colors.black87,
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildSignatureRow(
    String label,
    String? signature,
    DateTime? signedAt,
    String? signerName, {
    bool? confirmed,
  }) {
    final dateTimeFormat = DateFormat('yyyy-MM-dd HH:mm');
    final hasSignature = signature != null || confirmed == true;

    return Container(
      margin: const EdgeInsets.symmetric(vertical: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: hasSignature ? Colors.green[50] : Colors.grey[100],
        borderRadius: BorderRadius.circular(8),
        border: Border.all(
          color: hasSignature ? Colors.green[200]! : Colors.grey[300]!,
        ),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Icon(
                hasSignature ? Icons.check_circle : Icons.radio_button_unchecked,
                size: 18,
                color: hasSignature ? Colors.green[700] : Colors.grey,
              ),
              const SizedBox(width: 8),
              Text(
                label,
                style: TextStyle(
                  fontWeight: FontWeight.w500,
                  color: hasSignature ? Colors.green[700] : Colors.grey,
                ),
              ),
            ],
          ),
          if (hasSignature) ...[
            const SizedBox(height: 8),
            if (signature != null && signature.startsWith('data:image'))
              Container(
                height: 60,
                decoration: BoxDecoration(
                  color: Colors.white,
                  borderRadius: BorderRadius.circular(4),
                ),
                child: Center(
                  child: Image.memory(
                    Uri.parse(signature).data!.contentAsBytes(),
                    height: 50,
                  ),
                ),
              ),
            if (signerName != null)
              Text(
                '서명자: $signerName',
                style: TextStyle(fontSize: 13, color: Colors.grey[600]),
              ),
            if (signedAt != null)
              Text(
                '일시: ${dateTimeFormat.format(signedAt)}',
                style: TextStyle(fontSize: 13, color: Colors.grey[600]),
              ),
          ],
        ],
      ),
    );
  }
}

class _CompanySignDialog extends StatefulWidget {
  final WorkReport report;
  final ApiService apiService;

  const _CompanySignDialog({
    required this.report,
    required this.apiService,
  });

  @override
  State<_CompanySignDialog> createState() => _CompanySignDialogState();
}

class _CompanySignDialogState extends State<_CompanySignDialog> {
  final TextEditingController _nameController = TextEditingController();
  final GlobalKey _signatureKey = GlobalKey();
  List<Offset?> _points = [];
  bool _isLoading = false;

  @override
  void dispose() {
    _nameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final currencyFormat = NumberFormat('#,###');

    return AlertDialog(
      title: const Text('발주처 확인/서명'),
      content: SingleChildScrollView(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Summary
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: Colors.grey[100],
                borderRadius: BorderRadius.circular(8),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    DateFormat('yyyy-MM-dd').format(widget.report.workDate),
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    widget.report.siteAddress,
                    style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '기사: ${widget.report.driverName}',
                    style: TextStyle(fontSize: 13, color: Colors.grey[600]),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    '금액: ${currencyFormat.format(widget.report.displayPrice)}원',
                    style: TextStyle(
                      fontWeight: FontWeight.bold,
                      color: Colors.blue[700],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            // Name input
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: '확인자 이름 *',
                hintText: '이름을 입력하세요',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            // Signature
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                const Text(
                  '서명 (선택)',
                  style: TextStyle(fontWeight: FontWeight.w500),
                ),
                TextButton(
                  onPressed: () => setState(() => _points = []),
                  child: const Text('지우기'),
                ),
              ],
            ),
            const SizedBox(height: 8),
            Container(
              height: 120,
              decoration: BoxDecoration(
                border: Border.all(color: Colors.grey[300]!),
                borderRadius: BorderRadius.circular(8),
              ),
              child: GestureDetector(
                onPanStart: (details) {
                  setState(() {
                    _points.add(details.localPosition);
                  });
                },
                onPanUpdate: (details) {
                  setState(() {
                    _points.add(details.localPosition);
                  });
                },
                onPanEnd: (details) {
                  setState(() {
                    _points.add(null);
                  });
                },
                child: CustomPaint(
                  key: _signatureKey,
                  size: const Size(double.infinity, 120),
                  painter: _SignaturePainter(points: _points),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Text(
              '서명은 선택사항입니다. 이름만 입력해도 확인 처리됩니다.',
              style: TextStyle(fontSize: 12, color: Colors.grey[600]),
            ),
          ],
        ),
      ),
      actions: [
        TextButton(
          onPressed: _isLoading ? null : () => Navigator.pop(context, false),
          child: const Text('취소'),
        ),
        ElevatedButton(
          onPressed: _isLoading ? null : _submit,
          style: ElevatedButton.styleFrom(
            backgroundColor: Colors.orange[600],
            foregroundColor: Colors.white,
          ),
          child: _isLoading
              ? const SizedBox(
                  width: 20,
                  height: 20,
                  child: CircularProgressIndicator(
                    strokeWidth: 2,
                    valueColor: AlwaysStoppedAnimation<Color>(Colors.white),
                  ),
                )
              : const Text('확인 완료'),
        ),
      ],
    );
  }

  Future<void> _submit() async {
    final name = _nameController.text.trim();
    if (name.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('확인자 이름을 입력해주세요.')),
      );
      return;
    }

    setState(() => _isLoading = true);

    try {
      String? signatureData;

      // Get signature if drawn
      if (_points.isNotEmpty && _points.any((p) => p != null)) {
        signatureData = await _getSignatureDataUrl();
      }

      await widget.apiService.signByCompany(
        widget.report.dispatchId,
        name,
        signature: signatureData,
      );

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('발주처 확인이 완료되었습니다.')),
        );
        Navigator.pop(context, true);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('확인 처리 실패: $e')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<String?> _getSignatureDataUrl() async {
    try {
      final recorder = ui.PictureRecorder();
      final canvas = Canvas(recorder);
      final size = const Size(300, 120);

      // Draw white background
      canvas.drawRect(
        Rect.fromLTWH(0, 0, size.width, size.height),
        Paint()..color = Colors.white,
      );

      // Draw signature
      final paint = Paint()
        ..color = Colors.black
        ..strokeCap = StrokeCap.round
        ..strokeWidth = 2.0;

      for (int i = 0; i < _points.length - 1; i++) {
        if (_points[i] != null && _points[i + 1] != null) {
          canvas.drawLine(_points[i]!, _points[i + 1]!, paint);
        }
      }

      final picture = recorder.endRecording();
      final img = await picture.toImage(size.width.toInt(), size.height.toInt());
      final byteData = await img.toByteData(format: ui.ImageByteFormat.png);

      if (byteData == null) return null;

      final bytes = byteData.buffer.asUint8List();
      final base64 = Uri.dataFromBytes(bytes, mimeType: 'image/png').toString();

      return base64;
    } catch (e) {
      debugPrint('Error generating signature: $e');
      return null;
    }
  }
}

class _SignaturePainter extends CustomPainter {
  final List<Offset?> points;

  _SignaturePainter({required this.points});

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = Colors.black
      ..strokeCap = StrokeCap.round
      ..strokeWidth = 2.0;

    for (int i = 0; i < points.length - 1; i++) {
      if (points[i] != null && points[i + 1] != null) {
        canvas.drawLine(points[i]!, points[i + 1]!, paint);
      }
    }
  }

  @override
  bool shouldRepaint(_SignaturePainter oldDelegate) => true;
}
