import 'package:flutter_test/flutter_test.dart';
import 'package:nbtc_frontend/app.dart';

void main() {
  testWidgets('NBTCApp renders MaterialApp', (tester) async {
    await tester.pumpWidget(const NBTCApp());
    expect(find.byType(NBTCApp), findsOneWidget);
  });
}
