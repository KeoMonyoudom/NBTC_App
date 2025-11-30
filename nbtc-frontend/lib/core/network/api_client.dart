import 'dart:convert';

import 'package:http/http.dart' as http;

import '../constants/environment.dart';
import '../exceptions/api_exception.dart';
import '../storage/token_storage.dart';

class ApiClient {
  ApiClient({
    http.Client? httpClient,
    TokenStorage? tokenStorage,
    String? baseUrl,
  })  : _httpClient = httpClient ?? http.Client(),
        _tokenStorage = tokenStorage ?? TokenStorage(),
        baseUrl = baseUrl ?? Environment.apiBaseUrl;

  final http.Client _httpClient;
  final TokenStorage _tokenStorage;
  final String baseUrl;

  Future<Map<String, dynamic>> post(
    String path, {
    Map<String, dynamic>? body,
    bool withAuth = true,
    Map<String, String>? headers,
    Map<String, dynamic>? queryParameters,
  }) async {
    final uri = _createUri(path, queryParameters);
    final mergedHeaders = await _buildHeaders(withAuth: withAuth, extra: headers);
    final response = await _httpClient.post(
      uri,
      headers: mergedHeaders,
      body: body == null ? null : jsonEncode(body),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> get(
    String path, {
    Map<String, dynamic>? queryParameters,
    bool withAuth = true,
    Map<String, String>? headers,
  }) async {
    final uri = _createUri(path, queryParameters);
    final mergedHeaders = await _buildHeaders(withAuth: withAuth, extra: headers);
    final response = await _httpClient.get(uri, headers: mergedHeaders);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> delete(
    String path, {
    bool withAuth = true,
    Map<String, String>? headers,
    Map<String, dynamic>? queryParameters,
  }) async {
    final uri = _createUri(path, queryParameters);
    final mergedHeaders = await _buildHeaders(withAuth: withAuth, extra: headers);
    final response = await _httpClient.delete(uri, headers: mergedHeaders);
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> patch(
    String path, {
    Map<String, dynamic>? body,
    bool withAuth = true,
    Map<String, String>? headers,
  }) async {
    final uri = _createUri(path);
    final mergedHeaders = await _buildHeaders(withAuth: withAuth, extra: headers);
    final response = await _httpClient.patch(
      uri,
      headers: mergedHeaders,
      body: body == null ? null : jsonEncode(body),
    );
    return _handleResponse(response);
  }

  Future<Map<String, dynamic>> put(
    String path, {
    Map<String, dynamic>? body,
    bool withAuth = true,
    Map<String, String>? headers,
  }) async {
    final uri = _createUri(path);
    final mergedHeaders = await _buildHeaders(withAuth: withAuth, extra: headers);
    final response = await _httpClient.put(
      uri,
      headers: mergedHeaders,
      body: body == null ? null : jsonEncode(body),
    );
    return _handleResponse(response);
  }

  Uri _createUri(String path, [Map<String, dynamic>? queryParameters]) {
    final sanitizedPath = path.startsWith('/') ? path : '/$path';
    final uri = Uri.parse('$baseUrl$sanitizedPath');
    if (queryParameters == null || queryParameters.isEmpty) {
      return uri;
    }
    final serialized = <String, String>{};
    queryParameters.forEach((key, value) {
      if (value != null) {
        serialized[key] = value.toString();
      }
    });
    return uri.replace(queryParameters: serialized);
  }

  Uri resolve(String path, [Map<String, dynamic>? queryParameters]) =>
      _createUri(path, queryParameters);

  Future<Map<String, String>> _buildHeaders({
    required bool withAuth,
    Map<String, String>? extra,
  }) async {
    final headers = <String, String>{
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    if (withAuth) {
      final token = await _tokenStorage.readToken();
      if (token != null) {
        headers['Authorization'] = 'Bearer $token';
      }
    }
    if (extra != null) {
      headers.addAll(extra);
    }
    return headers;
  }

  Map<String, dynamic> _handleResponse(http.Response response) {
    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) {
        return <String, dynamic>{};
      }
      final dynamic decoded = jsonDecode(utf8.decode(response.bodyBytes));
      if (decoded is Map<String, dynamic>) {
        return decoded;
      }
      return <String, dynamic>{'data': decoded};
    }

    dynamic details;
    String message = 'Unexpected error';
    try {
      final body = jsonDecode(response.body) as Map<String, dynamic>;
      details = body;
      if (body['message'] is String) {
        message = body['message'] as String;
      } else if (body['error'] is String) {
        message = body['error'] as String;
      }
    } catch (_) {
      message = response.reasonPhrase ?? message;
    }

    throw ApiException(
      message: message,
      statusCode: response.statusCode,
      details: details,
    );
  }
}
