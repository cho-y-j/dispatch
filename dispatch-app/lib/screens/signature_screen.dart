import 'dart:convert';
import 'dart:typed_data';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:signature/signature.dart';
import '../providers/dispatch_provider.dart';
import '../models/dispatch.dart';

class SignatureScreen extends StatefulWidget {
  final Dispatch dispatch;

  const SignatureScreen({super.key, required this.dispatch});

  @override
  State<SignatureScreen> createState() => _SignatureScreenState();
}

class _SignatureScreenState extends State<SignatureScreen> {
  final SignatureController _driverSignatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
  );

  final SignatureController _clientSignatureController = SignatureController(
    penStrokeWidth: 3,
    penColor: Colors.black,
  );

  final _clientNameController = TextEditingController();
  bool _driverSigned = false;

  @override
  void dispose() {
    _driverSignatureController.dispose();
    _clientSignatureController.dispose();
    _clientNameController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('작업 확인서 서명'),
      ),
      body: Consumer<DispatchProvider>(
        builder: (context, provider, child) {
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                // 작업 요약
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const Text(
                          '작업 확인서',
                          style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold),
                        ),
                        const Divider(),
                        _buildSummaryRow('장비', widget.dispatch.equipmentTypeName),
                        _buildSummaryRow('현장', widget.dispatch.siteAddress),
                        _buildSummaryRow(
                          '작업일',
                          '${widget.dispatch.workDate.toString().substring(0, 10)} ${widget.dispatch.workTime.substring(0, 5)}',
                        ),
                        if (widget.dispatch.price != null)
                          _buildSummaryRow('요금', '${widget.dispatch.price!.toStringAsFixed(0)}원'),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: 24),

                // 기사 서명
                if (!_driverSigned) ...[
                  const Text(
                    '1. 기사 서명',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  Container(
                    height: 200,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Signature(
                      controller: _driverSignatureController,
                      backgroundColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton.icon(
                        onPressed: () => _driverSignatureController.clear(),
                        icon: const Icon(Icons.refresh),
                        label: const Text('다시 서명'),
                      ),
                      ElevatedButton(
                        onPressed: provider.isLoading ? null : _submitDriverSignature,
                        child: provider.isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2),
                              )
                            : const Text('서명 완료'),
                      ),
                    ],
                  ),
                ] else ...[
                  // 고객 서명
                  const Text(
                    '2. 고객(현장 담당자) 서명',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 8),
                  TextField(
                    controller: _clientNameController,
                    decoration: const InputDecoration(
                      labelText: '고객 성함',
                      border: OutlineInputBorder(),
                    ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    height: 200,
                    decoration: BoxDecoration(
                      border: Border.all(color: Colors.grey),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Signature(
                      controller: _clientSignatureController,
                      backgroundColor: Colors.white,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      TextButton.icon(
                        onPressed: () => _clientSignatureController.clear(),
                        icon: const Icon(Icons.refresh),
                        label: const Text('다시 서명'),
                      ),
                      ElevatedButton(
                        onPressed: provider.isLoading ? null : _submitClientSignature,
                        style: ElevatedButton.styleFrom(backgroundColor: Colors.green),
                        child: provider.isLoading
                            ? const SizedBox(
                                width: 20,
                                height: 20,
                                child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                              )
                            : const Text('최종 완료', style: TextStyle(color: Colors.white)),
                      ),
                    ],
                  ),
                ],
              ],
            ),
          );
        },
      ),
    );
  }

  Widget _buildSummaryRow(String label, String value) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label, style: const TextStyle(color: Colors.grey)),
          Text(value, style: const TextStyle(fontWeight: FontWeight.w500)),
        ],
      ),
    );
  }

  Future<void> _submitDriverSignature() async {
    if (_driverSignatureController.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('서명을 해주세요')),
      );
      return;
    }

    final Uint8List? signatureData = await _driverSignatureController.toPngBytes();
    if (signatureData == null) return;

    final base64Signature = base64Encode(signatureData);

    final provider = context.read<DispatchProvider>();
    final success = await provider.signByDriver(
      widget.dispatch.id,
      base64Signature,
    );

    if (success && mounted) {
      setState(() => _driverSigned = true);
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('기사 서명이 완료되었습니다. 고객 서명을 받아주세요.')),
      );
    }
  }

  Future<void> _submitClientSignature() async {
    if (_clientSignatureController.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('고객 서명을 받아주세요')),
      );
      return;
    }

    if (_clientNameController.text.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('고객 성함을 입력해주세요')),
      );
      return;
    }

    final Uint8List? signatureData = await _clientSignatureController.toPngBytes();
    if (signatureData == null) return;

    final base64Signature = base64Encode(signatureData);

    final provider = context.read<DispatchProvider>();
    final success = await provider.signByClient(
      widget.dispatch.id,
      base64Signature,
      _clientNameController.text.trim(),
    );

    if (success && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('작업이 최종 완료되었습니다!')),
      );
      Navigator.of(context).popUntil((route) => route.isFirst);
    }
  }
}
