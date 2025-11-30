import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/network/api_client.dart';
import 'core/storage/token_storage.dart';
import 'features/auth/controllers/auth_notifier.dart';
import 'features/auth/data/auth_repository.dart';
import 'features/auth/widgets/auth_gate.dart';
import 'features/dashboard/controllers/dashboard_notifier.dart';
import 'features/dashboard/data/dashboard_repository.dart';
import 'theme/app_theme.dart';

class NBTCApp extends StatelessWidget {
  const NBTCApp({super.key});

  @override
  Widget build(BuildContext context) {
    final tokenStorage = TokenStorage();
    final apiClient = ApiClient(tokenStorage: tokenStorage);

    return MultiProvider(
      providers: [
        Provider<TokenStorage>.value(value: tokenStorage),
        Provider<ApiClient>.value(value: apiClient),
        ChangeNotifierProvider<AuthNotifier>(
          create: (_) => AuthNotifier(
            repository: AuthRepository(apiClient: apiClient, storage: tokenStorage),
            storage: tokenStorage,
          ),
        ),
        ChangeNotifierProvider<DashboardNotifier>(
          create: (_) => DashboardNotifier(DashboardRepository(apiClient)),
        ),
      ],
      child: MaterialApp(
        title: 'NBTC Portal',
        debugShowCheckedModeBanner: false,
        theme: AppTheme.light(),
        home: const AuthGate(),
      ),
    );
  }
}
