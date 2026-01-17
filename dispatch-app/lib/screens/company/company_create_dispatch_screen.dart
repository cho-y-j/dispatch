import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../../providers/auth_provider.dart';
import '../../services/api_service.dart';

class CompanyCreateDispatchScreen extends StatefulWidget {
  const CompanyCreateDispatchScreen({super.key});

  @override
  State<CompanyCreateDispatchScreen> createState() => _CompanyCreateDispatchScreenState();
}

class _CompanyCreateDispatchScreenState extends State<CompanyCreateDispatchScreen> {
  final _formKey = GlobalKey<FormState>();
  final _addressController = TextEditingController();
  final _detailController = TextEditingController();
  final _contactNameController = TextEditingController();
  final _contactPhoneController = TextEditingController();
  final _descriptionController = TextEditingController();
  final _priceController = TextEditingController();
  final ApiService _apiService = ApiService();

  DateTime _selectedDate = DateTime.now().add(const Duration(days: 1));
  TimeOfDay _selectedTime = const TimeOfDay(hour: 9, minute: 0);
  String _selectedEquipmentType = 'CRANE';
  int? _estimatedHours;
  double? _minHeight;
  int? _minDriverRating;
  bool _isUrgent = false;
  bool _isLoading = false;

  final List<Map<String, String>> _equipmentTypes = [
    {'value': 'CRANE', 'label': '크레인'},
    {'value': 'LADDER_TRUCK', 'label': '사다리차'},
    {'value': 'SKY_TRUCK', 'label': '스카이'},
    {'value': 'HIGH_LIFT_TRUCK', 'label': '고소작업차'},
  ];

  @override
  void dispose() {
    _addressController.dispose();
    _detailController.dispose();
    _contactNameController.dispose();
    _contactPhoneController.dispose();
    _descriptionController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  Future<void> _selectDate() async {
    final picked = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now(),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (picked != null) {
      setState(() {
        _selectedDate = picked;
      });
    }
  }

  Future<void> _selectTime() async {
    final picked = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
    );
    if (picked != null) {
      setState(() {
        _selectedTime = picked;
      });
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final response = await _apiService.createDispatch(
        siteAddress: _addressController.text.trim(),
        siteDetail: _detailController.text.trim(),
        contactName: _contactNameController.text.trim(),
        contactPhone: _contactPhoneController.text.trim(),
        workDate: DateFormat('yyyy-MM-dd').format(_selectedDate),
        workTime: '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}',
        equipmentType: _selectedEquipmentType,
        workDescription: _descriptionController.text.trim(),
        estimatedHours: _estimatedHours,
        minHeight: _minHeight,
        price: _priceController.text.isNotEmpty ? double.tryParse(_priceController.text) : null,
        isUrgent: _isUrgent,
        minDriverRating: _minDriverRating,
      );

      if (response.data['success'] && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('배차가 등록되었습니다')),
        );
        _clearForm();
      } else if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(response.data['message'] ?? '등록 실패')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('배차 등록에 실패했습니다')),
        );
      }
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  void _clearForm() {
    _addressController.clear();
    _detailController.clear();
    _contactNameController.clear();
    _contactPhoneController.clear();
    _descriptionController.clear();
    _priceController.clear();
    setState(() {
      _selectedDate = DateTime.now().add(const Duration(days: 1));
      _selectedTime = const TimeOfDay(hour: 9, minute: 0);
      _selectedEquipmentType = 'CRANE';
      _estimatedHours = null;
      _minHeight = null;
      _minDriverRating = null;
      _isUrgent = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    if (user != null && user.isPending) {
      return Center(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.hourglass_empty, size: 80, color: Colors.orange[300]),
              const SizedBox(height: 16),
              const Text(
                '승인 대기 중',
                style: TextStyle(
                  fontSize: 20,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                '관리자 승인 후 배차를\n등록하실 수 있습니다.',
                textAlign: TextAlign.center,
                style: TextStyle(
                  color: Colors.grey[600],
                ),
              ),
            ],
          ),
        ),
      );
    }

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Form(
        key: _formKey,
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // 긴급 배차 토글
            Card(
              color: _isUrgent ? Colors.red[50] : null,
              child: SwitchListTile(
                title: Row(
                  children: [
                    Icon(
                      Icons.priority_high,
                      color: _isUrgent ? Colors.red : Colors.grey,
                    ),
                    const SizedBox(width: 8),
                    const Text('긴급 배차'),
                  ],
                ),
                subtitle: const Text('모든 기사에게 즉시 노출됩니다'),
                value: _isUrgent,
                onChanged: (value) {
                  setState(() => _isUrgent = value);
                },
                activeColor: Colors.red,
              ),
            ),
            const SizedBox(height: 16),

            // 현장 주소
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(
                labelText: '현장 주소 *',
                hintText: '서울시 강남구 테헤란로 123',
                prefixIcon: Icon(Icons.location_on),
                border: OutlineInputBorder(),
              ),
              validator: (value) {
                if (value == null || value.isEmpty) {
                  return '현장 주소를 입력해주세요';
                }
                return null;
              },
            ),
            const SizedBox(height: 12),

            // 상세 주소
            TextFormField(
              controller: _detailController,
              decoration: const InputDecoration(
                labelText: '상세 주소',
                hintText: '건물명, 층수 등',
                prefixIcon: Icon(Icons.apartment),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // 날짜/시간 선택
            Row(
              children: [
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _selectDate,
                    icon: const Icon(Icons.calendar_today),
                    label: Text(DateFormat('yyyy-MM-dd').format(_selectedDate)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: OutlinedButton.icon(
                    onPressed: _selectTime,
                    icon: const Icon(Icons.access_time),
                    label: Text(_selectedTime.format(context)),
                    style: OutlinedButton.styleFrom(
                      padding: const EdgeInsets.symmetric(vertical: 16),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 장비 종류
            DropdownButtonFormField<String>(
              value: _selectedEquipmentType,
              decoration: const InputDecoration(
                labelText: '장비 종류 *',
                prefixIcon: Icon(Icons.construction),
                border: OutlineInputBorder(),
              ),
              items: _equipmentTypes.map((type) {
                return DropdownMenuItem(
                  value: type['value'],
                  child: Text(type['label']!),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _selectedEquipmentType = value!;
                });
              },
            ),
            const SizedBox(height: 12),

            // 예상 작업 시간
            DropdownButtonFormField<int>(
              value: _estimatedHours,
              decoration: const InputDecoration(
                labelText: '예상 작업 시간',
                prefixIcon: Icon(Icons.timer),
                border: OutlineInputBorder(),
              ),
              items: [1, 2, 3, 4, 5, 6, 7, 8].map((hours) {
                return DropdownMenuItem(
                  value: hours,
                  child: Text('$hours시간'),
                );
              }).toList(),
              onChanged: (value) {
                setState(() {
                  _estimatedHours = value;
                });
              },
            ),
            const SizedBox(height: 16),

            // 담당자 정보
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _contactNameController,
                    decoration: const InputDecoration(
                      labelText: '현장 담당자',
                      prefixIcon: Icon(Icons.person),
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _contactPhoneController,
                    keyboardType: TextInputType.phone,
                    decoration: const InputDecoration(
                      labelText: '담당자 연락처',
                      prefixIcon: Icon(Icons.phone),
                      border: OutlineInputBorder(),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 16),

            // 작업 내용
            TextFormField(
              controller: _descriptionController,
              maxLines: 3,
              decoration: const InputDecoration(
                labelText: '작업 내용',
                hintText: '작업 상세 내용을 입력해주세요',
                prefixIcon: Icon(Icons.description),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // 금액
            TextFormField(
              controller: _priceController,
              keyboardType: TextInputType.number,
              decoration: const InputDecoration(
                labelText: '제시 금액 (원)',
                hintText: '협의 가능',
                prefixIcon: Icon(Icons.payment),
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),

            // 최소 기사 별점
            DropdownButtonFormField<int>(
              value: _minDriverRating,
              decoration: const InputDecoration(
                labelText: '최소 기사 별점',
                prefixIcon: Icon(Icons.star),
                border: OutlineInputBorder(),
              ),
              items: [
                const DropdownMenuItem(
                  value: null,
                  child: Text('제한 없음'),
                ),
                ...List.generate(5, (index) => index + 1).map((rating) {
                  return DropdownMenuItem(
                    value: rating,
                    child: Row(
                      children: [
                        ...List.generate(rating, (_) => const Icon(Icons.star, size: 16, color: Colors.amber)),
                        const SizedBox(width: 4),
                        Text('$rating점 이상'),
                      ],
                    ),
                  );
                }),
              ],
              onChanged: (value) {
                setState(() {
                  _minDriverRating = value;
                });
              },
            ),
            const SizedBox(height: 24),

            // 등록 버튼
            ElevatedButton(
              onPressed: _isLoading ? null : _submit,
              style: ElevatedButton.styleFrom(
                backgroundColor: Colors.orange[600],
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: 16),
              ),
              child: _isLoading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                    )
                  : const Text(
                      '배차 등록',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                    ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
