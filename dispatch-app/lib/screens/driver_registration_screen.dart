import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/auth_provider.dart';
import '../services/api_service.dart';

class DriverRegistrationScreen extends StatefulWidget {
  const DriverRegistrationScreen({super.key});

  @override
  State<DriverRegistrationScreen> createState() => _DriverRegistrationScreenState();
}

class _DriverRegistrationScreenState extends State<DriverRegistrationScreen> {
  final _formKey = GlobalKey<FormState>();
  final _businessRegController = TextEditingController();
  final _driverLicenseController = TextEditingController();
  final ApiService _apiService = ApiService();

  int _currentStep = 0;
  bool _isLoading = false;
  String? _errorMessage;

  // 업로드된 파일들
  File? _businessRegImage;
  File? _driverLicenseImage;
  final List<File> _equipmentImages = [];

  // 장비 정보
  String _selectedEquipmentType = 'HIGH_LIFT_TRUCK';
  final _equipmentModelController = TextEditingController();
  final _equipmentTonnageController = TextEditingController();
  final _vehicleNumberController = TextEditingController();

  final Map<String, String> _equipmentTypes = {
    'HIGH_LIFT_TRUCK': '고소작업차',
    'AERIAL_PLATFORM': '고소작업대',
    'SCISSOR_LIFT': '시저리프트',
    'BOOM_LIFT': '붐리프트',
    'LADDER_TRUCK': '사다리차',
    'CRANE': '크레인',
    'FORKLIFT': '지게차',
    'OTHER': '기타',
  };

  @override
  void dispose() {
    _businessRegController.dispose();
    _driverLicenseController.dispose();
    _equipmentModelController.dispose();
    _equipmentTonnageController.dispose();
    _vehicleNumberController.dispose();
    super.dispose();
  }

  Future<void> _pickImage(ImageSource source, Function(File) onPicked) async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: source,
      maxWidth: 1920,
      maxHeight: 1920,
      imageQuality: 85,
    );

    if (pickedFile != null) {
      onPicked(File(pickedFile.path));
    }
  }

  void _showImagePickerOptions(Function(File) onPicked) {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Wrap(
          children: [
            ListTile(
              leading: const Icon(Icons.photo_camera),
              title: const Text('카메라로 촬영'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.camera, onPicked);
              },
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('갤러리에서 선택'),
              onTap: () {
                Navigator.pop(context);
                _pickImage(ImageSource.gallery, onPicked);
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _submitRegistration() async {
    if (!_formKey.currentState!.validate()) return;

    if (_businessRegImage == null) {
      setState(() => _errorMessage = '사업자등록증을 업로드해주세요');
      return;
    }

    if (_driverLicenseImage == null) {
      setState(() => _errorMessage = '운전면허증을 업로드해주세요');
      return;
    }

    setState(() {
      _isLoading = true;
      _errorMessage = null;
    });

    try {
      // 1. 기사 정보 등록
      final driverResponse = await _apiService.registerDriver(
        businessRegNumber: _businessRegController.text,
        driverLicenseNumber: _driverLicenseController.text,
      );

      if (!driverResponse.data['success']) {
        throw Exception(driverResponse.data['message'] ?? '기사 등록 실패');
      }

      // 2. 사업자등록증 업로드
      await _apiService.uploadDocument('business_registration', _businessRegImage!);

      // 3. 운전면허증 업로드
      await _apiService.uploadDocument('driver_license', _driverLicenseImage!);

      // 4. 장비 등록
      final equipmentResponse = await _apiService.registerEquipment(
        type: _selectedEquipmentType,
        model: _equipmentModelController.text,
        tonnage: double.tryParse(_equipmentTonnageController.text),
        vehicleNumber: _vehicleNumberController.text,
      );

      if (!equipmentResponse.data['success']) {
        throw Exception(equipmentResponse.data['message'] ?? '장비 등록 실패');
      }

      // 5. 장비 사진 업로드
      for (final image in _equipmentImages) {
        await _apiService.uploadEquipmentImage(
          equipmentResponse.data['data']['id'],
          image,
        );
      }

      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('기사 등록이 완료되었습니다. 관리자 승인을 기다려주세요.')),
        );
        Navigator.pop(context);
      }
    } catch (e) {
      setState(() => _errorMessage = e.toString());
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('기사 등록'),
      ),
      body: Form(
        key: _formKey,
        child: Stepper(
          currentStep: _currentStep,
          onStepContinue: () {
            if (_currentStep < 2) {
              setState(() => _currentStep++);
            } else {
              _submitRegistration();
            }
          },
          onStepCancel: () {
            if (_currentStep > 0) {
              setState(() => _currentStep--);
            }
          },
          controlsBuilder: (context, details) {
            return Padding(
              padding: const EdgeInsets.only(top: 16),
              child: Row(
                children: [
                  if (_currentStep < 2)
                    ElevatedButton(
                      onPressed: details.onStepContinue,
                      child: const Text('다음'),
                    )
                  else
                    ElevatedButton(
                      onPressed: _isLoading ? null : details.onStepContinue,
                      child: _isLoading
                          ? const SizedBox(
                              width: 20,
                              height: 20,
                              child: CircularProgressIndicator(strokeWidth: 2),
                            )
                          : const Text('등록 완료'),
                    ),
                  const SizedBox(width: 8),
                  if (_currentStep > 0)
                    TextButton(
                      onPressed: details.onStepCancel,
                      child: const Text('이전'),
                    ),
                ],
              ),
            );
          },
          steps: [
            // Step 1: 사업자 정보
            Step(
              title: const Text('사업자 정보'),
              content: Column(
                children: [
                  TextFormField(
                    controller: _businessRegController,
                    decoration: const InputDecoration(
                      labelText: '사업자등록번호',
                      hintText: '000-00-00000',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '사업자등록번호를 입력해주세요';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildImageUploader(
                    title: '사업자등록증',
                    image: _businessRegImage,
                    onTap: () => _showImagePickerOptions((file) {
                      setState(() => _businessRegImage = file);
                    }),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _driverLicenseController,
                    decoration: const InputDecoration(
                      labelText: '운전면허번호',
                      hintText: '00-00-000000-00',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '운전면허번호를 입력해주세요';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  _buildImageUploader(
                    title: '운전면허증',
                    image: _driverLicenseImage,
                    onTap: () => _showImagePickerOptions((file) {
                      setState(() => _driverLicenseImage = file);
                    }),
                  ),
                ],
              ),
              isActive: _currentStep >= 0,
            ),

            // Step 2: 장비 정보
            Step(
              title: const Text('장비 정보'),
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  DropdownButtonFormField<String>(
                    value: _selectedEquipmentType,
                    decoration: const InputDecoration(
                      labelText: '장비 종류',
                      border: OutlineInputBorder(),
                    ),
                    items: _equipmentTypes.entries.map((e) {
                      return DropdownMenuItem(
                        value: e.key,
                        child: Text(e.value),
                      );
                    }).toList(),
                    onChanged: (value) {
                      if (value != null) {
                        setState(() => _selectedEquipmentType = value);
                      }
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _equipmentModelController,
                    decoration: const InputDecoration(
                      labelText: '모델명',
                      hintText: '예: 현대 150T',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _equipmentTonnageController,
                    decoration: const InputDecoration(
                      labelText: '톤수 / 작업높이',
                      hintText: '예: 15 (톤 또는 미터)',
                      border: OutlineInputBorder(),
                    ),
                    keyboardType: TextInputType.number,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _vehicleNumberController,
                    decoration: const InputDecoration(
                      labelText: '차량번호',
                      hintText: '예: 12가 3456',
                      border: OutlineInputBorder(),
                    ),
                    validator: (value) {
                      if (value == null || value.isEmpty) {
                        return '차량번호를 입력해주세요';
                      }
                      return null;
                    },
                  ),
                ],
              ),
              isActive: _currentStep >= 1,
            ),

            // Step 3: 장비 사진
            Step(
              title: const Text('장비 사진'),
              content: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text(
                    '장비 사진을 등록해주세요 (최대 5장)',
                    style: TextStyle(fontSize: 14, color: Colors.grey),
                  ),
                  const SizedBox(height: 16),
                  Wrap(
                    spacing: 8,
                    runSpacing: 8,
                    children: [
                      ..._equipmentImages.asMap().entries.map((entry) {
                        return Stack(
                          children: [
                            Container(
                              width: 100,
                              height: 100,
                              decoration: BoxDecoration(
                                borderRadius: BorderRadius.circular(8),
                                image: DecorationImage(
                                  image: FileImage(entry.value),
                                  fit: BoxFit.cover,
                                ),
                              ),
                            ),
                            Positioned(
                              top: 4,
                              right: 4,
                              child: GestureDetector(
                                onTap: () {
                                  setState(() {
                                    _equipmentImages.removeAt(entry.key);
                                  });
                                },
                                child: Container(
                                  padding: const EdgeInsets.all(4),
                                  decoration: const BoxDecoration(
                                    color: Colors.red,
                                    shape: BoxShape.circle,
                                  ),
                                  child: const Icon(
                                    Icons.close,
                                    size: 16,
                                    color: Colors.white,
                                  ),
                                ),
                              ),
                            ),
                          ],
                        );
                      }),
                      if (_equipmentImages.length < 5)
                        GestureDetector(
                          onTap: () => _showImagePickerOptions((file) {
                            setState(() => _equipmentImages.add(file));
                          }),
                          child: Container(
                            width: 100,
                            height: 100,
                            decoration: BoxDecoration(
                              border: Border.all(color: Colors.grey),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Icon(
                              Icons.add_a_photo,
                              size: 32,
                              color: Colors.grey,
                            ),
                          ),
                        ),
                    ],
                  ),
                  if (_errorMessage != null) ...[
                    const SizedBox(height: 16),
                    Text(
                      _errorMessage!,
                      style: const TextStyle(color: Colors.red),
                    ),
                  ],
                ],
              ),
              isActive: _currentStep >= 2,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildImageUploader({
    required String title,
    required File? image,
    required VoidCallback onTap,
  }) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          title,
          style: const TextStyle(fontSize: 14, fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 8),
        GestureDetector(
          onTap: onTap,
          child: Container(
            height: 150,
            width: double.infinity,
            decoration: BoxDecoration(
              border: Border.all(color: Colors.grey),
              borderRadius: BorderRadius.circular(8),
            ),
            child: image != null
                ? ClipRRect(
                    borderRadius: BorderRadius.circular(8),
                    child: Image.file(image, fit: BoxFit.cover),
                  )
                : const Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.upload_file, size: 40, color: Colors.grey),
                      SizedBox(height: 8),
                      Text('사진 업로드', style: TextStyle(color: Colors.grey)),
                    ],
                  ),
          ),
        ),
      ],
    );
  }
}
