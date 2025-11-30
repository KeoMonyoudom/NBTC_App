import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/widgets/app_loader.dart';
import '../../../core/widgets/error_view.dart';
import '../../dashboard/widgets/dashboard_page.dart';
import '../controllers/auth_notifier.dart';
import 'login_page.dart';

class AuthGate extends StatefulWidget {
  const AuthGate({super.key});

  @override
  State<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends State<AuthGate> {
  bool _introDismissed = false;
  AuthStatus? _lastStatus;

  @override
  Widget build(BuildContext context) {
    return Consumer<AuthNotifier>(
      builder: (context, auth, _) {
        if (_lastStatus != auth.status) {
          if (auth.status == AuthStatus.unauthenticated) {
            _introDismissed = false;
          }
          _lastStatus = auth.status;
        }
        switch (auth.status) {
          case AuthStatus.loading:
          case AuthStatus.unknown:
            if (!_introDismissed) {
              return _StartupScreen(
                onGetStarted: () => setState(() => _introDismissed = true),
              );
            }
            return const Scaffold(body: AppLoader(message: 'Signing you in...'));
          case AuthStatus.error:
            return Scaffold(
              body: ErrorView(
                message: auth.errorMessage ?? 'Unable to connect to the server',
                onRetry: () => context.read<AuthNotifier>().refreshProfile(),
              ),
            );
          case AuthStatus.authenticated:
            return const DashboardPage();
          case AuthStatus.unauthenticated:
            if (!_introDismissed) {
              return _StartupScreen(
                onGetStarted: () => setState(() => _introDismissed = true),
              );
            }
            return const LoginPage();
        }
      },
    );
  }
}

class _StartupScreen extends StatelessWidget {
  const _StartupScreen({required this.onGetStarted});

  final VoidCallback onGetStarted;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFFB71C1C),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.all(24),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              const SizedBox(height: 40),
              Column(
                children: [
                  Text(
                    'Save Lives',
                    style: Theme.of(context).textTheme.displaySmall?.copyWith(
                          color: Colors.white,
                          fontWeight: FontWeight.bold,
                        ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: 12),
                  Text(
                    'Donate Blood, Share love',
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: Colors.white70,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  style: FilledButton.styleFrom(
                    backgroundColor: Colors.white,
                    foregroundColor: const Color(0xFFB71C1C),
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(30),
                    ),
                    textStyle: const TextStyle(fontSize: 18, fontWeight: FontWeight.w600),
                  ),
                  onPressed: onGetStarted,
                  child: const Text('Get Started'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
