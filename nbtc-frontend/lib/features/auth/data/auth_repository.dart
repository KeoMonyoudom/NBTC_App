import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../models/user_profile.dart';

class AuthRepository {
  AuthRepository({required ApiClient apiClient, required TokenStorage storage})
      : _apiClient = apiClient,
        _storage = storage;

  final ApiClient _apiClient;
  final TokenStorage _storage;

  Future<UserProfile> login({required String username, required String password}) async {
    final response = await _apiClient.post(
      '/auth/login',
      withAuth: false,
      body: {
        'username': username,
        'password': password,
      },
    );

    final data = (response['data'] ?? <String, dynamic>{}) as Map<String, dynamic>;
    final token = data['token']?.toString();
    if (token == null) {
      throw Exception('Missing token from login response');
    }
    await _storage.saveToken(token);

    // Ensure we have the freshest profile
    return fetchProfile();
  }

  Future<UserProfile> fetchProfile() async {
    final response = await _apiClient.get('/auth/me');
    final data = (response['data'] ?? <String, dynamic>{}) as Map<String, dynamic>;
    final profile = UserProfile.fromProfileJson(data);
    await _storage.cacheUser(profile.toJson());
    return profile;
  }

  Future<UserProfile?> readCachedProfile() async {
    final cached = await _storage.readCachedUser();
    if (cached == null) return null;
    return UserProfile(
      username: cached['username']?.toString() ?? '',
      fullName: cached['fullName']?.toString() ?? '',
      roles: (cached['roles'] as List?)?.map((e) => e.toString()).toList() ?? const [],
      branchId: cached['branchId']?.toString(),
      branchName: cached['branchName']?.toString(),
    );
  }

  Future<void> logout() async {
    await _storage.clearAll();
  }
}
