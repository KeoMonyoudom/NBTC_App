import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../data/admin_repository.dart';
import '../models/admin_user.dart';
import '../models/role_model.dart';
import '../../dashboard/models/branch_model.dart';

bool _isValidPhone(String value) {
  final digitsOnly = value.replaceAll(RegExp(r'\D'), '');
  if (digitsOnly.length < 3 || digitsOnly.length > 15) {
    return false;
  }
  return RegExp(r'^[\d+\s()-]+$').hasMatch(value);
}

class UserManagementPage extends StatefulWidget {
  const UserManagementPage({super.key});

  @override
  State<UserManagementPage> createState() => _UserManagementPageState();
}

class _UserManagementPageState extends State<UserManagementPage> {
  late final AdminRepository _repository;
  late Future<List<AdminUser>> _usersFuture;
  String _search = '';
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    final apiClient = context.read<ApiClient>();
    final tokenStorage = context.read<TokenStorage>();
    _repository = AdminRepository(apiClient, tokenStorage);
    _usersFuture = _repository.fetchUsers();
  }

  Future<void> _refresh() async {
    setState(() {
      _usersFuture = _repository.fetchUsers();
    });
  }

  Future<void> _deleteUser(AdminUser user) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete user'),
        content: Text('Are you sure you want to delete ${user.username}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() => _isProcessing = true);
    try {
      await _repository.deleteUser(user.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User deleted')));
      }
      await _refresh();
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $err')));
      }
    } finally {
      if (mounted) setState(() => _isProcessing = false);
    }
  }

  Future<void> _openCreateForm() async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: UserCreateForm(
          repository: _repository,
          onSaved: () async {
            Navigator.pop(context);
            await _refresh();
          },
        ),
      ),
    );
  }

  Future<void> _openEditForm(AdminUser user) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: UserEditForm(
          repository: _repository,
          user: user,
          onSaved: () async {
            Navigator.pop(context);
            await _refresh();
          },
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('User Management'),
        actions: [IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh))],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: _openCreateForm,
        icon: const Icon(Icons.person_add_alt_1),
        label: const Text('Add User'),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  decoration: const InputDecoration(
                    labelText: 'Search users',
                    prefixIcon: Icon(Icons.search),
                  ),
                  onChanged: (value) => setState(() => _search = value.toLowerCase()),
                ),
              ),
              Expanded(
                child: FutureBuilder<List<AdminUser>>(
                  future: _usersFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.error_outline, size: 40),
                            const SizedBox(height: 12),
                            Text('Failed to load users\n${snapshot.error}'),
                            const SizedBox(height: 12),
                            FilledButton(onPressed: _refresh, child: const Text('Retry')),
                          ],
                        ),
                      );
                    }
                    final users = snapshot.data ?? const [];
                    final filtered = users.where((user) {
                      if (_search.isEmpty) return true;
                      final haystack = '${user.username} ${user.fullName}'.toLowerCase();
                      return haystack.contains(_search);
                    }).toList();
                    if (filtered.isEmpty) {
                      return const Center(child: Text('No users found.'));
                    }
                    return ListView.builder(
                      padding: const EdgeInsets.only(bottom: 100),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final user = filtered[index];
                        return Card(
                          color: Theme.of(context).cardColor,
                          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: ListTile(
                            title: Text(user.fullName, style: const TextStyle(color: Colors.white)),
                            subtitle: DefaultTextStyle.merge(
                              style: const TextStyle(color: Colors.white70),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(user.username),
                                  if (user.branchName != null) Text('Branch: ${user.branchName}'),
                                  Text('Roles: ${user.roles.join(', ')}'),
                                  Text(user.isActive ? 'Active' : 'Inactive'),
                                ],
                              ),
                            ),
                            trailing: PopupMenuButton<String>(
                              onSelected: (value) {
                                if (value == 'edit') {
                                  _openEditForm(user);
                                } else if (value == 'delete') {
                                  _deleteUser(user);
                                }
                              },
                              itemBuilder: (context) => const [
                                PopupMenuItem(value: 'edit', child: Text('Edit')),
                                PopupMenuItem(value: 'delete', child: Text('Delete')),
                              ],
                            ),
                          ),
                        );
                      },
                    );
                  },
                ),
              ),
            ],
          ),
          if (_isProcessing)
            Container(
              color: Colors.black26,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}

class UserCreateForm extends StatefulWidget {
  const UserCreateForm({
    super.key,
    required this.repository,
    required this.onSaved,
  });

  final AdminRepository repository;
  final Future<void> Function() onSaved;

  @override
  State<UserCreateForm> createState() => _UserCreateFormState();
}

class _UserCreateFormState extends State<UserCreateForm> {
  final _formKey = GlobalKey<FormState>();
  final _usernameController = TextEditingController();
  final _passwordController = TextEditingController();
  final _firstNameController = TextEditingController();
  final _lastNameController = TextEditingController();
  final _emailController = TextEditingController();
  final _phoneController = TextEditingController();
  String? _selectedRole;
  String? _selectedBranch;
  bool _saving = false;
  late Future<List<RoleModel>> _rolesFuture;
  late Future<List<BranchModel>> _branchesFuture;

  @override
  void initState() {
    super.initState();
    _rolesFuture = widget.repository.fetchRoles();
    _branchesFuture = widget.repository.fetchBranches();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedRole == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select a role')));
      return;
    }
    setState(() => _saving = true);
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final userInfo = <String, dynamic>{
      'firstName': firstName,
      'lastName': lastName,
      'gender': 'Other',
      'dateOfBirth': '1990-01-01',
      'maritalStatus': 'Single',
      'occupation': 'Staff',
      'address': 'N/A',
      'phoneNumber': phone,
    };
    if (email.isNotEmpty) userInfo['email'] = email;
    final payload = {
      'username': _usernameController.text.trim(),
      'fullName': '$firstName $lastName',
      'password': _passwordController.text,
      'roleId': [_selectedRole],
      if (_selectedBranch != null && _selectedBranch!.isNotEmpty) 'branchId': _selectedBranch,
      'userInfo': userInfo,
    };
    try {
      await widget.repository.createUser(payload);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User created')));
      }
      await widget.onSaved();
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $err')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Create User', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 16),
              TextFormField(
                controller: _usernameController,
                decoration: const InputDecoration(labelText: 'Username'),
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Username is required';
                  }
                  final sanitized = value.trim();
                  final usernameRegex = RegExp(r'^[A-Za-z_]+$');
                  if (!usernameRegex.hasMatch(sanitized)) {
                    return 'Use only letters and underscores';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'Password'),
                obscureText: true,
                validator: (v) => v == null || v.isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _firstNameController,
                decoration: const InputDecoration(labelText: 'First name'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _lastNameController,
                decoration: const InputDecoration(labelText: 'Last name'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              FutureBuilder<List<RoleModel>>(
                future: _rolesFuture,
                builder: (context, snapshot) {
                  final roles = snapshot.data ?? const [];
                  return DropdownButtonFormField<String>(
                    isExpanded: true,
                    value: _selectedRole,
                    decoration: const InputDecoration(labelText: 'Role'),
                    items: roles
                        .map((role) => DropdownMenuItem(value: role.id, child: Text(role.name)))
                        .toList(),
                    onChanged: (value) => setState(() => _selectedRole = value),
                    validator: (value) => value == null ? 'Select a role' : null,
                  );
                },
              ),
              const SizedBox(height: 12),
              FutureBuilder<List<BranchModel>>(
                future: _branchesFuture,
                builder: (context, snapshot) {
                  final branches = snapshot.data ?? const [];
                  final value = branches.any((branch) => branch.id == _selectedBranch) ? _selectedBranch : null;
                  return DropdownButtonFormField<String?>(
                    isExpanded: true,
                    value: value,
                    decoration: const InputDecoration(labelText: 'Branch (optional)'),
                    items: [
                      const DropdownMenuItem<String?>(value: null, child: Text('Unassigned')),
                      ...branches.map(
                        (branch) => DropdownMenuItem(value: branch.id, child: Text(branch.name)),
                      ),
                    ],
                    onChanged: (value) => setState(() => _selectedBranch = value),
                  );
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(labelText: 'Phone'),
                keyboardType: TextInputType.phone,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Phone is required';
                  }
                  if (!_isValidPhone(value.trim())) {
                    return 'Enter a valid phone number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _saving ? null : _submit,
                  child: const Text('Create user'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class UserEditForm extends StatefulWidget {
  const UserEditForm({
    super.key,
    required this.repository,
    required this.user,
    required this.onSaved,
  });

  final AdminRepository repository;
  final AdminUser user;
  final Future<void> Function() onSaved;

  @override
  State<UserEditForm> createState() => _UserEditFormState();
}

class _UserEditFormState extends State<UserEditForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _usernameController;
  late TextEditingController _passwordController;
  late TextEditingController _firstNameController;
  late TextEditingController _lastNameController;
  late TextEditingController _emailController;
  late TextEditingController _phoneController;
  String? _selectedRole;
  String? _selectedBranch;
  bool _isActive = true;
  bool _saving = false;
  late Future<List<RoleModel>> _rolesFuture;
  late Future<List<BranchModel>> _branchesFuture;

  @override
  void initState() {
    super.initState();
    _isActive = widget.user.isActive;
    _selectedBranch = widget.user.branchId;
    _selectedRole = widget.user.roleIds.isNotEmpty ? widget.user.roleIds.first : null;
    final nameParts = widget.user.fullName.split(' ');
    final firstName = nameParts.isNotEmpty ? nameParts.first : '';
    final lastName = nameParts.length > 1 ? nameParts.sublist(1).join(' ') : '';
    _usernameController = TextEditingController(text: widget.user.username);
    _passwordController = TextEditingController();
    _firstNameController = TextEditingController(text: firstName);
    _lastNameController = TextEditingController(text: lastName);
    _emailController = TextEditingController(text: widget.user.email ?? '');
    _phoneController = TextEditingController(text: widget.user.phoneNumber ?? '');
    _rolesFuture = widget.repository.fetchRoles();
    _branchesFuture = widget.repository.fetchBranches();
  }

  @override
  void dispose() {
    _usernameController.dispose();
    _passwordController.dispose();
    _firstNameController.dispose();
    _lastNameController.dispose();
    _emailController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedRole == null) {
      ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Select a role')));
      return;
    }
    setState(() => _saving = true);
    final firstName = _firstNameController.text.trim();
    final lastName = _lastNameController.text.trim();
    final email = _emailController.text.trim();
    final phone = _phoneController.text.trim();
    final userInfo = <String, dynamic>{
      'firstName': firstName,
      'lastName': lastName,
      'gender': 'Other',
      'dateOfBirth': '1990-01-01',
      'maritalStatus': 'Single',
      'occupation': 'Staff',
      'address': 'N/A',
      'phoneNumber': phone,
    };
    if (email.isNotEmpty) userInfo['email'] = email;
    final payload = <String, dynamic>{
      'username': _usernameController.text.trim(),
      'fullName': '$firstName $lastName',
      'roleId': [_selectedRole],
      'isActive': _isActive,
      'userInfo': userInfo,
    };
    final branch = _selectedBranch;
    if (branch != null && branch.isNotEmpty) {
      payload['branchId'] = branch;
    }
    if (_passwordController.text.isNotEmpty) {
      payload['password'] = _passwordController.text;
    }
    try {
      await widget.repository.updateUser(widget.user.id, payload);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('User updated')));
      }
      await widget.onSaved();
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $err')));
      }
    } finally {
      if (mounted) setState(() => _saving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        left: 24,
        right: 24,
        top: 24,
        bottom: MediaQuery.of(context).viewInsets.bottom + 24,
      ),
      child: Form(
        key: _formKey,
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Edit ${widget.user.username}', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              TextFormField(
                controller: _usernameController,
                decoration: const InputDecoration(labelText: 'Username'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Username is required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _passwordController,
                decoration: const InputDecoration(labelText: 'New Password (optional)'),
                obscureText: true,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _firstNameController,
                decoration: const InputDecoration(labelText: 'First name'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _lastNameController,
                decoration: const InputDecoration(labelText: 'Last name'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              FutureBuilder<List<RoleModel>>(
                future: _rolesFuture,
                builder: (context, snapshot) {
                  final roles = snapshot.data ?? const [];
                  final value = roles.any((role) => role.id == _selectedRole) ? _selectedRole : null;
                  return DropdownButtonFormField<String>(
                    isExpanded: true,
                    value: value,
                    decoration: const InputDecoration(labelText: 'Role'),
                    items: roles
                        .map((role) => DropdownMenuItem(value: role.id, child: Text(role.name)))
                        .toList(),
                    onChanged: (role) => setState(() => _selectedRole = role),
                    validator: (value) => value == null ? 'Select a role' : null,
                  );
                },
              ),
              const SizedBox(height: 12),
              FutureBuilder<List<BranchModel>>(
                future: _branchesFuture,
                builder: (context, snapshot) {
                  final branches = snapshot.data ?? const [];
                  final value = branches.any((branch) => branch.id == _selectedBranch) ? _selectedBranch : null;
                  return DropdownButtonFormField<String?>(
                    isExpanded: true,
                    value: value,
                    decoration: const InputDecoration(labelText: 'Branch'),
                    items: [
                      const DropdownMenuItem(value: null, child: Text('Unassigned')),
                      ...branches.map((branch) => DropdownMenuItem(value: branch.id, child: Text(branch.name))),
                    ],
                    onChanged: (value) => setState(() => _selectedBranch = value),
                  );
                },
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _emailController,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _phoneController,
                decoration: const InputDecoration(labelText: 'Phone'),
                keyboardType: TextInputType.phone,
                validator: (value) {
                  if (value == null || value.trim().isEmpty) {
                    return 'Phone is required';
                  }
                  if (!_isValidPhone(value.trim())) {
                    return 'Enter a valid phone number';
                  }
                  return null;
                },
              ),
              const SizedBox(height: 12),
              SwitchListTile(
                contentPadding: EdgeInsets.zero,
                title: const Text('Active'),
                value: _isActive,
                onChanged: (value) => setState(() => _isActive = value),
              ),
              const SizedBox(height: 12),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _saving ? null : _submit,
                  child: const Text('Save changes'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
