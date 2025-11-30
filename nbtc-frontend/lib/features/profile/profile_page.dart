import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:provider/provider.dart';

import '../../core/network/api_client.dart';
import '../../core/storage/token_storage.dart';

class ProfilePage extends StatefulWidget {
  const ProfilePage({super.key});

  @override
  State<ProfilePage> createState() => _ProfilePageState();
}

class _ProfilePageState extends State<ProfilePage> {
  late final ApiClient _apiClient;
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();

  Map<String, dynamic>? _profile;
  bool _loading = true;
  bool _saving = false;
  String? _error;
  String? _photoUrl;

  @override
  void initState() {
    super.initState();
    _apiClient = context.read<ApiClient>();
    _loadProfile();
  }

  @override
  void dispose() {
    _fullNameController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _loadProfile() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final response = await _apiClient.get('/auth/me');
      final data = response['data'] as Map<String, dynamic>?;
      if (data != null) {
        _profile = data;
        _populateControllers(data);
        _photoUrl = _resolvePhotoUrl(
          data['photoUrl']?.toString() ??
              (data['userInfoId'] is Map<String, dynamic>
                  ? data['userInfoId']['photoUrl']?.toString()
                  : null),
        );
      }
    } catch (err) {
      _error = err.toString();
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  void _populateControllers(Map<String, dynamic> data) {
    final userInfo = data['userInfoId'] as Map<String, dynamic>?;
    _fullNameController.text = data['fullName']?.toString() ?? '';
    _firstNameController.text = userInfo?['firstName']?.toString() ?? '';
    _lastNameController.text = userInfo?['lastName']?.toString() ?? '';
    _emailController.text = userInfo?['email']?.toString() ?? '';
    _phoneController.text = userInfo?['phoneNumber']?.toString() ?? '';
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    try {
      await _apiClient.patch('/user/me/profile', body: {
        'fullName': _fullNameController.text.trim(),
        'userInfo': {
          'firstName': _firstNameController.text.trim(),
          'lastName': _lastNameController.text.trim(),
          'email': _emailController.text.trim(),
          'phoneNumber': _phoneController.text.trim(),
        },
      });
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(const SnackBar(content: Text('Profile updated')));
      }
      await _loadProfile();
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Failed: $err')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  Future<void> _changePhoto() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.image, withData: true);
    if (result == null || result.files.isEmpty) return;
    final file = result.files.first;
    if (file.bytes == null) return;
    await _uploadPhoto(file);
  }

  String? _resolvePhotoUrl(String? value) {
    if (value == null || value.isEmpty) return null;
    if (value.startsWith('http')) return value;
    var base = _apiClient.baseUrl;
    if (base.endsWith('/api')) {
      base = base.substring(0, base.length - 4);
    } else if (base.endsWith('/api/')) {
      base = base.substring(0, base.length - 5);
    }
    if (value.startsWith('/')) {
      return '$base$value';
    }
    return '$base/$value';
  }

  Future<void> _uploadPhoto(PlatformFile file) async {
    setState(() => _saving = true);
    try {
      final uri = _apiClient.resolve('/user/me/profile/photo');
      final request = http.MultipartRequest('PATCH', uri);
      final token = await context.read<TokenStorage>().readToken();
      if (token != null) {
        request.headers['Authorization'] = 'Bearer $token';
      }
      request.files.add(
        http.MultipartFile.fromBytes(
          'photo',
          file.bytes!,
          filename: file.name,
        ),
      );
      final response = await request.send();
      if (response.statusCode >= 200 && response.statusCode < 300) {
        setState(() {
          _photoUrl = _resolvePhotoUrl(
            '/api/user/me/profile/photo?ts=${DateTime.now().millisecondsSinceEpoch}',
          );
        });
        if (mounted) {
          ScaffoldMessenger.of(context)
              .showSnackBar(const SnackBar(content: Text('Photo updated')));
        }
      } else {
        final body = await response.stream.bytesToString();
        if (mounted) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(content: Text('Failed to update photo: ${response.statusCode} $body')),
          );
        }
      }
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context)
            .showSnackBar(SnackBar(content: Text('Failed: $err')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  String _initials(String name) {
    final abbreviation = name
        .trim()
        .split(RegExp(r"\s+"))
        .where((word) => word.isNotEmpty)
        .map((word) => word[0].toUpperCase())
        .take(2)
        .join();
    return abbreviation.isEmpty ? 'N' : abbreviation;
  }

  @override
  Widget build(BuildContext context) {
    final profile = _profile;
    final initials = _initials(profile?['fullName']?.toString() ?? 'N');
    return Scaffold(
      appBar: AppBar(
        title: const Text('My Profile'),
        actions: [IconButton(onPressed: _loadProfile, icon: const Icon(Icons.refresh))],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        const Icon(Icons.error_outline, size: 40),
                        const SizedBox(height: 12),
                        Text('Failed to load profile\n$_error'),
                        const SizedBox(height: 12),
                        FilledButton(onPressed: _loadProfile, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : SingleChildScrollView(
                  padding: const EdgeInsets.all(24),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Center(
                        child: Column(
                          children: [
                            CircleAvatar(
                              radius: 48,
                              backgroundColor: Theme.of(context)
                                  .colorScheme
                                  .primary
                                  .withOpacity(0.15),
                              backgroundImage:
                                  _photoUrl != null ? NetworkImage(_photoUrl!) : null,
                              child: _photoUrl == null
                                  ? Text(
                                      initials,
                                      style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                                            color: Theme.of(context).colorScheme.primary,
                                          ),
                                    )
                                  : null,
                            ),
                            TextButton.icon(
                              onPressed: _saving ? null : _changePhoto,
                              icon: const Icon(Icons.camera_alt_outlined),
                              label: const Text('Change photo'),
                            ),
                          ],
                        ),
                      ),
                      const SizedBox(height: 16),
                      Card(
                        color: Theme.of(context).cardColor,
                        child: ListTile(
                          title: Text(profile?['username']?.toString() ?? '',
                              style: const TextStyle(color: Colors.white)),
                          subtitle: const Text('Username',
                              style: TextStyle(color: Colors.white70)),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Card(
                        color: Theme.of(context).cardColor,
                        child: ListTile(
                          title: Text(
                              profile?['roleId'] is List
                              ? (profile!['roleId'] as List)
                                  .map((role) => role is Map<String, dynamic> ? role['name'] : role)
                                  .whereType<String>()
                                  .join(', ')
                              : '',
                              style: const TextStyle(color: Colors.white)),
                          subtitle: const Text('Roles',
                              style: TextStyle(color: Colors.white70)),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Card(
                        color: Theme.of(context).cardColor,
                        child: ListTile(
                          title: Text(
                              profile?['branchId'] is Map<String, dynamic>
                              ? (profile!['branchId']['name']?.toString() ?? '')
                              : '',
                              style: const TextStyle(color: Colors.white)),
                          subtitle: const Text('Branch',
                              style: TextStyle(color: Colors.white70)),
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text('Update Contact Details',
                          style: Theme.of(context).textTheme.titleLarge),
                      const SizedBox(height: 12),
                      Form(
                        key: _formKey,
                        child: Column(
                          children: [
                            TextFormField(
                              controller: _fullNameController,
                              decoration: const InputDecoration(labelText: 'Full name'),
                              validator: (value) =>
                                  value == null || value.trim().isEmpty ? 'Required' : null,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _firstNameController,
                              decoration: const InputDecoration(labelText: 'First name'),
                              validator: (value) =>
                                  value == null || value.trim().isEmpty ? 'Required' : null,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _lastNameController,
                              decoration: const InputDecoration(labelText: 'Last name'),
                              validator: (value) =>
                                  value == null || value.trim().isEmpty ? 'Required' : null,
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _emailController,
                              decoration: const InputDecoration(labelText: 'Email'),
                            ),
                            const SizedBox(height: 12),
                            TextFormField(
                              controller: _phoneController,
                              decoration: const InputDecoration(labelText: 'Phone number'),
                              keyboardType: TextInputType.phone,
                            ),
                            const SizedBox(height: 20),
                            SizedBox(
                              width: double.infinity,
                              child: FilledButton(
                                onPressed: _saving ? null : _saveProfile,
                                child:
                                    Text(_saving ? 'Saving...' : 'Save changes'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
    );
  }
}
