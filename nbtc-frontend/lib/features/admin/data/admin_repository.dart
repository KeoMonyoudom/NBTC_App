import 'dart:convert';

import 'package:file_picker/file_picker.dart';
import 'package:http/http.dart' as http;

import '../../../core/exceptions/api_exception.dart';
import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../models/admin_user.dart';
import '../models/role_model.dart';
import '../../dashboard/models/branch_model.dart';
import '../../dashboard/models/content_model.dart';
import '../../dashboard/models/event_model.dart';
import '../../dashboard/models/hero_slider_item.dart';

class AdminRepository {
  AdminRepository(this._apiClient, this._tokenStorage);

  final ApiClient _apiClient;
  final TokenStorage _tokenStorage;

  Future<List<BranchModel>> fetchBranches() async {
    final response = await _apiClient.get('/branch');
    final list = response['data'] as List<dynamic>? ?? [];
    return list.map((item) => BranchModel.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<void> createBranch(Map<String, dynamic> payload) async {
    await _apiClient.post('/branch', body: payload);
  }

  Future<void> updateBranch(String id, Map<String, dynamic> payload) async {
    await _apiClient.patch('/branch/$id', body: payload);
  }

  Future<void> deleteBranch(String id) async {
    await _apiClient.delete('/branch/$id');
  }

  Future<List<AdminUser>> fetchUsers() async {
    final response = await _apiClient.get(
      '/user',
      queryParameters: {
        'limit': 200,
        'page': 1,
      },
    );
    final data = response['data'] as Map<String, dynamic>?;
    final users = (data?['users'] as List<dynamic>? ?? [])
        .map((item) => AdminUser.fromJson(item as Map<String, dynamic>))
        .toList();
    return users;
  }

  Future<void> createUser(Map<String, dynamic> payload) async {
    await _apiClient.post('/user/register-with-info', body: payload, queryParameters: {'allowRoles': true});
  }

  Future<void> updateUser(String id, Map<String, dynamic> payload) async {
    await _apiClient.put('/user/$id', body: payload);
  }

  Future<void> deleteUser(String id) async {
    await _apiClient.delete('/user/$id');
  }

  Future<List<RoleModel>> fetchRoles() async {
    final response = await _apiClient.get('/role');
    final data = response['data'];
    final list = data is Map<String, dynamic> ? data['docs'] as List<dynamic>? : data as List<dynamic>?;
    return (list ?? [])
        .map((role) => RoleModel.fromJson(role as Map<String, dynamic>))
        .toList();
  }

  Future<List<EventModel>> fetchEvents({int limit = 50}) async {
    final response = await _apiClient.get(
      '/event',
      queryParameters: {'limit': limit, 'page': 1},
    );
    final data = response['data'] as Map<String, dynamic>? ?? {};
    return (data['docs'] as List<dynamic>? ?? [])
        .map((item) => EventModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<void> createEvent(Map<String, dynamic> payload) async {
    await _apiClient.post('/event', body: payload);
  }

  Future<void> updateEvent(String id, Map<String, dynamic> payload) async {
    await _apiClient.put('/event/$id', body: payload);
  }

  Future<void> deleteEvent(String id) async {
    await _apiClient.delete('/event/$id');
  }

  Future<List<ContentModel>> fetchContents() async {
    final response = await _apiClient.get('/content');
    final list = response['data'] as List<dynamic>? ?? [];
    return list.map((item) => ContentModel.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<void> deleteContent(String id) async {
    await _apiClient.delete('/content/$id');
  }

  Future<void> updateContent(String id, Map<String, String> fields, {List<PlatformFile>? files}) async {
    final multipartFiles = <http.MultipartFile>[];
    if (files != null) {
      for (final file in files) {
        if (file.bytes == null) continue;
        multipartFiles.add(
          http.MultipartFile.fromBytes(
            'files',
            file.bytes!,
            filename: file.name,
          ),
        );
      }
    }
    await _sendMultipart('/content/$id', method: 'PATCH', fields: fields, files: multipartFiles);
  }

  Future<void> createContent({
    required Map<String, String> fields,
    List<PlatformFile>? files,
  }) async {
    final multipartFiles = <http.MultipartFile>[];
    if (files != null) {
      for (final file in files) {
        if (file.bytes == null) continue;
        multipartFiles.add(
          http.MultipartFile.fromBytes(
            'files',
            file.bytes!,
            filename: file.name,
          ),
        );
      }
    }
    await _sendMultipart('/content', method: 'POST', fields: fields, files: multipartFiles);
  }

  Future<List<HeroSliderItem>> fetchHeroSliders() async {
    final response = await _apiClient.get('/hero-slider');
    final list = response['data'] as List<dynamic>? ?? [];
    return list.map((item) => HeroSliderItem.fromJson(item as Map<String, dynamic>)).toList();
  }

  Future<void> deleteHeroSlider(String id) async {
    await _apiClient.delete('/hero-slider/$id');
  }

  Future<void> createHeroSlider({
    required Map<String, String> fields,
    PlatformFile? file,
  }) async {
    final files = <http.MultipartFile>[];
    if (file != null && file.bytes != null) {
      files.add(http.MultipartFile.fromBytes('file', file.bytes!, filename: file.name));
    }
    await _sendMultipart('/hero-slider', method: 'POST', fields: fields, files: files);
  }

  Future<void> updateHeroSlider({
    required String id,
    required Map<String, String> fields,
    PlatformFile? file,
  }) async {
    final files = <http.MultipartFile>[];
    if (file != null && file.bytes != null) {
      files.add(http.MultipartFile.fromBytes('file', file.bytes!, filename: file.name));
    }
    await _sendMultipart('/hero-slider/$id', method: 'PATCH', fields: fields, files: files);
  }

  Future<Map<String, dynamic>> _sendMultipart(
    String path, {
    required String method,
    Map<String, String>? fields,
    List<http.MultipartFile>? files,
  }) async {
    final uri = _apiClient.resolve(path);
    final request = http.MultipartRequest(method, uri);
    final token = await _tokenStorage.readToken();
    if (token != null) {
      request.headers['Authorization'] = 'Bearer $token';
    }
    if (fields != null) {
      request.fields.addAll(fields);
    }
    if (files != null) {
      request.files.addAll(files);
    }
    final response = await request.send();
    final body = await response.stream.bytesToString();
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (body.isEmpty) return <String, dynamic>{};
      return jsonDecode(body) as Map<String, dynamic>;
    }
    String message = 'Upload failed';
    try {
      final decoded = jsonDecode(body) as Map<String, dynamic>;
      message = decoded['message']?.toString() ?? message;
    } catch (_) {}
    throw ApiException(message: message, statusCode: response.statusCode);
  }
}
