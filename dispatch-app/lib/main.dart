import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:intl/date_symbol_data_local.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'providers/auth_provider.dart';
import 'providers/dispatch_provider.dart';
import 'providers/websocket_provider.dart';
import 'providers/fcm_provider.dart';
import 'services/fcm_service.dart';
import 'screens/role_selection_screen.dart';
import 'screens/login_screen.dart';
import 'screens/home_screen.dart';
import 'screens/company/company_login_screen.dart';
import 'screens/company/company_home_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initializeDateFormatting('ko_KR', null);

  // FCM 초기화 (Firebase 설정이 없으면 무시)
  try {
    await FcmService().initialize();
  } catch (e) {
    debugPrint('FCM 초기화 스킵 (Firebase 설정 없음): $e');
  }

  runApp(const DispatchApp());
}

class DispatchApp extends StatelessWidget {
  const DispatchApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => DispatchProvider()),
        ChangeNotifierProvider(create: (_) => WebSocketProvider()),
        ChangeNotifierProvider(create: (_) => FcmProvider()),
      ],
      child: MaterialApp(
        title: '배차 앱',
        debugShowCheckedModeBanner: false,
        theme: ThemeData(
          colorScheme: ColorScheme.fromSeed(
            seedColor: Colors.blue,
            brightness: Brightness.light,
          ),
          useMaterial3: true,
          appBarTheme: const AppBarTheme(
            centerTitle: true,
            elevation: 0,
          ),
          cardTheme: CardTheme(
            elevation: 2,
            shape: RoundedRectangleBorder(
              borderRadius: BorderRadius.circular(12),
            ),
          ),
          elevatedButtonTheme: ElevatedButtonThemeData(
            style: ElevatedButton.styleFrom(
              shape: RoundedRectangleBorder(
                borderRadius: BorderRadius.circular(8),
              ),
            ),
          ),
        ),
        home: const AuthWrapper(),
      ),
    );
  }
}

class AuthWrapper extends StatefulWidget {
  const AuthWrapper({super.key});

  @override
  State<AuthWrapper> createState() => _AuthWrapperState();
}

class _AuthWrapperState extends State<AuthWrapper> {
  bool _isInitializing = true;
  String? _selectedRole;

  @override
  void initState() {
    super.initState();
    _initialize();
  }

  Future<void> _initialize() async {
    // 저장된 역할 확인
    final prefs = await SharedPreferences.getInstance();
    _selectedRole = prefs.getString('selectedRole');

    // 인증 상태 확인
    await context.read<AuthProvider>().checkAuthStatus();

    if (mounted) {
      setState(() {
        _isInitializing = false;
      });
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isInitializing) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(),
              SizedBox(height: 16),
              Text('로딩 중...'),
            ],
          ),
        ),
      );
    }

    return Consumer<AuthProvider>(
      builder: (context, authProvider, child) {
        if (authProvider.isLoading) {
          return const Scaffold(
            body: Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(),
                  SizedBox(height: 16),
                  Text('로딩 중...'),
                ],
              ),
            ),
          );
        }

        // 로그인된 경우
        if (authProvider.isAuthenticated) {
          final user = authProvider.user!;

          // WebSocket 연결
          final token = authProvider.token;
          if (token != null) {
            context.read<WebSocketProvider>().connect(token);
          }
          // FCM 토큰 등록
          context.read<FcmProvider>().registerToken();

          // 역할에 따라 홈 화면 분기
          if (user.isCompany) {
            return const CompanyHomeScreen();
          } else {
            return const HomeScreen();
          }
        }

        // 로그인되지 않은 경우
        context.read<WebSocketProvider>().disconnect();

        // 역할이 선택되지 않은 경우 역할 선택 화면
        if (_selectedRole == null) {
          return const RoleSelectionScreen();
        }

        // 역할에 따라 로그인 화면 분기
        if (_selectedRole == 'COMPANY') {
          return const CompanyLoginScreen();
        } else {
          return const LoginScreen();
        }
      },
    );
  }
}
