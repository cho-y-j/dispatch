import 'package:flutter_test/flutter_test.dart';
import 'package:dispatch_app/main.dart';

void main() {
  testWidgets('App launches successfully', (WidgetTester tester) async {
    await tester.pumpWidget(const DispatchApp());

    // 로딩 중 텍스트가 표시되는지 확인
    expect(find.text('로딩 중...'), findsOneWidget);
  });
}
