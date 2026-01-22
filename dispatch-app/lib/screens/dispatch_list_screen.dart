import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/dispatch_provider.dart';
import '../providers/auth_provider.dart';
import '../models/dispatch.dart';
import 'dispatch_detail_screen.dart';

class DispatchListScreen extends StatefulWidget {
  const DispatchListScreen({super.key});

  @override
  State<DispatchListScreen> createState() => _DispatchListScreenState();
}

class _DispatchListScreenState extends State<DispatchListScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DispatchProvider>().loadAvailableDispatches();
    });
  }

  Future<void> _refresh() async {
    await context.read<DispatchProvider>().loadAvailableDispatches();
  }

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    if (user != null && user.isPending) {
      return const Center(
        child: Padding(
          padding: EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(Icons.hourglass_empty, size: 64, color: Colors.orange),
              SizedBox(height: 16),
              Text(
                '승인 대기 중',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
              ),
              SizedBox(height: 8),
              Text(
                '기사 등록 및 서류 제출 후\n관리자 승인을 기다려주세요.',
                textAlign: TextAlign.center,
                style: TextStyle(color: Colors.grey),
              ),
            ],
          ),
        ),
      );
    }

    return Consumer<DispatchProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && provider.availableDispatches.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.availableDispatches.isEmpty) {
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              children: const [
                SizedBox(height: 100),
                Center(
                  child: Column(
                    children: [
                      Icon(Icons.inbox, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text(
                        '현재 배차 요청이 없습니다',
                        style: TextStyle(color: Colors.grey),
                      ),
                    ],
                  ),
                ),
              ],
            ),
          );
        }

        return RefreshIndicator(
          onRefresh: _refresh,
          child: ListView.builder(
            padding: const EdgeInsets.all(16),
            itemCount: provider.availableDispatches.length,
            itemBuilder: (context, index) {
              final dispatch = provider.availableDispatches[index];
              return _DispatchCard(dispatch: dispatch);
            },
          ),
        );
      },
    );
  }
}

class _DispatchCard extends StatelessWidget {
  final Dispatch dispatch;

  const _DispatchCard({required this.dispatch});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MM/dd (E)', 'ko_KR');
    final priceFormat = NumberFormat('#,###');

    return Card(
      margin: const EdgeInsets.only(bottom: 12),
      child: InkWell(
        onTap: () {
          context.read<DispatchProvider>().setCurrentDispatch(dispatch);
          Navigator.of(context).push(
            MaterialPageRoute(
              builder: (_) => DispatchDetailScreen(dispatch: dispatch),
            ),
          );
        },
        borderRadius: BorderRadius.circular(12),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // 장비 타입 & 날짜
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: Theme.of(context).primaryColor.withOpacity(0.1),
                      borderRadius: BorderRadius.circular(4),
                    ),
                    child: Text(
                      dispatch.equipmentTypeName,
                      style: TextStyle(
                        color: Theme.of(context).primaryColor,
                        fontWeight: FontWeight.bold,
                        fontSize: 12,
                      ),
                    ),
                  ),
                  Text(
                    dateFormat.format(dispatch.workDate),
                    style: const TextStyle(
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),

              // 주소
              Row(
                children: [
                  const Icon(Icons.location_on, size: 16, color: Colors.grey),
                  const SizedBox(width: 4),
                  Expanded(
                    child: Text(
                      dispatch.siteAddress,
                      style: const TextStyle(fontSize: 14),
                      maxLines: 1,
                      overflow: TextOverflow.ellipsis,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),

              // 시간 & 요금
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.access_time, size: 16, color: Colors.grey),
                      const SizedBox(width: 4),
                      Text(
                        dispatch.workTime.substring(0, 5),
                        style: const TextStyle(fontSize: 14),
                      ),
                      if (dispatch.estimatedHours != null) ...[
                        const SizedBox(width: 8),
                        Text(
                          '(약 ${dispatch.estimatedHours}시간)',
                          style: const TextStyle(fontSize: 12, color: Colors.grey),
                        ),
                      ],
                    ],
                  ),
                  if (dispatch.price != null)
                    Text(
                      '${priceFormat.format(dispatch.price)}원',
                      style: const TextStyle(
                        fontWeight: FontWeight.bold,
                        fontSize: 16,
                        color: Colors.green,
                      ),
                    )
                  else if (dispatch.priceNegotiable == true)
                    const Text(
                      '협의',
                      style: TextStyle(
                        fontWeight: FontWeight.bold,
                        color: Colors.orange,
                      ),
                    ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
