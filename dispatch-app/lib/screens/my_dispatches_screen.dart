import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/intl.dart';
import '../providers/dispatch_provider.dart';
import '../models/dispatch.dart';
import 'dispatch_detail_screen.dart';

class MyDispatchesScreen extends StatefulWidget {
  const MyDispatchesScreen({super.key});

  @override
  State<MyDispatchesScreen> createState() => _MyDispatchesScreenState();
}

class _MyDispatchesScreenState extends State<MyDispatchesScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DispatchProvider>().loadMyDispatches();
    });
  }

  Future<void> _refresh() async {
    await context.read<DispatchProvider>().loadMyDispatches();
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<DispatchProvider>(
      builder: (context, provider, child) {
        if (provider.isLoading && provider.myDispatches.isEmpty) {
          return const Center(child: CircularProgressIndicator());
        }

        if (provider.myDispatches.isEmpty) {
          return RefreshIndicator(
            onRefresh: _refresh,
            child: ListView(
              children: const [
                SizedBox(height: 100),
                Center(
                  child: Column(
                    children: [
                      Icon(Icons.history, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text(
                        '배차 이력이 없습니다',
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
            itemCount: provider.myDispatches.length,
            itemBuilder: (context, index) {
              final dispatch = provider.myDispatches[index];
              return _DispatchHistoryCard(dispatch: dispatch);
            },
          ),
        );
      },
    );
  }
}

class _DispatchHistoryCard extends StatelessWidget {
  final Dispatch dispatch;

  const _DispatchHistoryCard({required this.dispatch});

  @override
  Widget build(BuildContext context) {
    final dateFormat = DateFormat('MM/dd HH:mm');

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
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text(
                    dispatch.equipmentTypeName,
                    style: const TextStyle(fontWeight: FontWeight.bold),
                  ),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: _getStatusColor(dispatch),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      dispatch.match != null ? dispatch.matchStatusText : dispatch.statusText,
                      style: const TextStyle(color: Colors.white, fontSize: 11),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 8),
              Text(
                dispatch.siteAddress,
                style: const TextStyle(fontSize: 13, color: Colors.grey),
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 4),
              Text(
                dateFormat.format(dispatch.createdAt),
                style: const TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getStatusColor(Dispatch dispatch) {
    if (dispatch.match?.status == MatchStatus.SIGNED) return Colors.green;
    if (dispatch.match?.status == MatchStatus.CANCELLED) return Colors.red;
    if (dispatch.status == DispatchStatus.IN_PROGRESS) return Colors.orange;
    return Colors.blue;
  }
}
