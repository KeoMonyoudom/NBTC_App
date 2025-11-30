import 'package:flutter/material.dart';

import '../../../core/exceptions/api_exception.dart';
import '../../../core/storage/token_storage.dart';
import '../data/auth_repository.dart';
import '../models/user_profile.dart';

enum AuthStatus { unknown, loading, authenticated, unauthenticated, error }

class AuthNotifier extends ChangeNotifier {
  AuthNotifier({
    required AuthRepository repository,
    required TokenStorage storage,
  })  : _repository = repository,
        _storage = storage {
    _bootstrap();
  }

  final AuthRepository _repository;
  final TokenStorage _storage;

  AuthStatus status = AuthStatus.unknown;
  UserProfile? user;
  String? errorMessage;

  bool get isAuthenticated => status == AuthStatus.authenticated;

  Future<void> _bootstrap() async {
    status = AuthStatus.loading;
    notifyListeners();

    final token = await _storage.readToken();
    if (token == null) {
      status = AuthStatus.unauthenticated;
      notifyListeners();
      return;
    }

    final cached = await _repository.readCachedProfile();
    if (cached != null) {
      user = cached;
      status = AuthStatus.authenticated;
      notifyListeners();
    }

    try {
      final profile = await _repository.fetchProfile();
      user = profile;
      status = AuthStatus.authenticated;
    } on ApiException catch (err) {
      if (err.statusCode == 401) {
        await _storage.clearAll();
        status = AuthStatus.unauthenticated;
      } else {
        status = AuthStatus.error;
        errorMessage = err.message;
      }
    } catch (err) {
      status = AuthStatus.error;
      errorMessage = err.toString();
    }
    notifyListeners();
  }

  Future<void> login(String username, String password) async {
    status = AuthStatus.loading;
    errorMessage = null;
    notifyListeners();
    try {
      final profile = await _repository.login(username: username, password: password);
      user = profile;
      status = AuthStatus.authenticated;
    } on ApiException catch (err) {
      errorMessage = err.message;
      status = AuthStatus.unauthenticated;
    } catch (err) {
      errorMessage = err.toString();
      status = AuthStatus.unauthenticated;
    }
    notifyListeners();
  }

  Future<void> refreshProfile() async {
    if (!isAuthenticated) return;
    try {
      final profile = await _repository.fetchProfile();
      user = profile;
      notifyListeners();
    } catch (_) {
      // silently fail
    }
  }

  Future<void> logout() async {
    await _repository.logout();
    status = AuthStatus.unauthenticated;
    user = null;
    notifyListeners();
  }
}
