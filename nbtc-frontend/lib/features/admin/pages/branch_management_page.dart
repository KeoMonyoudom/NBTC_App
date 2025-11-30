import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../../dashboard/models/branch_model.dart';
import '../data/admin_repository.dart';

class BranchManagementPage extends StatefulWidget {
  const BranchManagementPage({super.key});

  @override
  State<BranchManagementPage> createState() => _BranchManagementPageState();
}

class _BranchManagementPageState extends State<BranchManagementPage> {
  late final AdminRepository _repository;
  late Future<List<BranchModel>> _branchesFuture;
  String _searchQuery = '';
  bool _isProcessing = false;

  @override
  void initState() {
    super.initState();
    final apiClient = context.read<ApiClient>();
    final tokenStorage = context.read<TokenStorage>();
    _repository = AdminRepository(apiClient, tokenStorage);
    _branchesFuture = _repository.fetchBranches();
  }

  Future<void> _refresh() async {
    setState(() {
      _branchesFuture = _repository.fetchBranches();
    });
  }

  Future<void> _deleteBranch(String name, String id) async {
    if (id.isEmpty) return;
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete branch'),
        content: Text('Are you sure you want to delete "$name"?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );

    if (confirm != true) return;

    setState(() => _isProcessing = true);
    try {
      await _repository.deleteBranch(id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Branch deleted.')));
      }
      await _refresh();
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $err')));
      }
    } finally {
      if (mounted) {
        setState(() => _isProcessing = false);
      }
    }
  }

  Future<void> _openBranchForm({BranchModel? branch}) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
        ),
        child: BranchForm(
          repository: _repository,
          branch: branch,
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
        title: const Text('Branches Management'),
        actions: [
          IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh)),
        ],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openBranchForm(),
        icon: const Icon(Icons.add_business),
        label: const Text('Add Branch'),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  decoration: const InputDecoration(
                    labelText: 'Search branches',
                    prefixIcon: Icon(Icons.search),
                  ),
                  onChanged: (value) => setState(() => _searchQuery = value.toLowerCase()),
                ),
              ),
              Expanded(
                child: FutureBuilder<List<BranchModel>>(
                  future: _branchesFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return Center(
                        child: Padding(
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            mainAxisSize: MainAxisSize.min,
                            children: [
                              const Icon(Icons.error_outline, size: 40),
                              const SizedBox(height: 12),
                              Text('Failed to load branches:\n${snapshot.error}'),
                              const SizedBox(height: 12),
                              FilledButton(onPressed: _refresh, child: const Text('Retry')),
                            ],
                          ),
                        ),
                      );
                    }

                    final branches = snapshot.data ?? const [];
                    final filtered = branches.where((branch) {
                      if (_searchQuery.isEmpty) return true;
                      final haystack = '${branch.name} ${branch.city ?? ''} ${branch.address ?? ''}'.toLowerCase();
                      return haystack.contains(_searchQuery);
                    }).toList();

                    if (filtered.isEmpty) {
                      return const Center(child: Text('No branches found.'));
                    }

                    return ListView.separated(
                      padding: const EdgeInsets.only(bottom: 100),
                      itemBuilder: (context, index) {
                        final branch = filtered[index];
                        return Card(
                          color: Theme.of(context).cardColor,
                          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: ListTile(
                            title:
                                Text(branch.name, style: const TextStyle(color: Colors.white)),
                            subtitle: DefaultTextStyle.merge(
                              style: const TextStyle(color: Colors.white70),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (branch.city != null && branch.city!.isNotEmpty)
                                    Text(branch.city!),
                                  if (branch.address != null && branch.address!.isNotEmpty)
                                    Text(branch.address!),
                                  if (branch.phone != null && branch.phone!.isNotEmpty)
                                    Text('Phone: ${branch.phone}'),
                                ],
                              ),
                            ),
                            trailing: PopupMenuButton<String>(
                              onSelected: (value) {
                                if (value == 'edit') {
                                  _openBranchForm(branch: branch);
                                } else if (value == 'delete') {
                                  _deleteBranch(branch.name, branch.id ?? '');
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
                      separatorBuilder: (_, __) => const SizedBox(height: 4),
                      itemCount: filtered.length,
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

class BranchForm extends StatefulWidget {
  const BranchForm({
    super.key,
    required this.repository,
    this.branch,
    required this.onSaved,
  });

  final AdminRepository repository;
  final BranchModel? branch;
  final Future<void> Function() onSaved;

  @override
  State<BranchForm> createState() => _BranchFormState();
}

class _BranchFormState extends State<BranchForm> {
  final _formKey = GlobalKey<FormState>();
  late final TextEditingController _nameController;
  late final TextEditingController _cityController;
  late final TextEditingController _addressController;
  late final TextEditingController _phoneController;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    _nameController = TextEditingController(text: widget.branch?.name ?? '');
    _cityController = TextEditingController(text: widget.branch?.city ?? '');
    _addressController = TextEditingController(text: widget.branch?.address ?? '');
    _phoneController = TextEditingController(text: widget.branch?.phone ?? '');
  }

  @override
  void dispose() {
    _nameController.dispose();
    _cityController.dispose();
    _addressController.dispose();
    _phoneController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = {
      'name': _nameController.text.trim(),
      'city': _cityController.text.trim(),
      'address': _addressController.text.trim(),
      'phone': _phoneController.text.trim(),
    }..removeWhere((key, value) => value == null || (value is String && value.isEmpty));

    try {
      if (widget.branch == null) {
        await widget.repository.createBranch(payload);
      } else {
        await widget.repository.updateBranch(widget.branch!.id ?? '', payload);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.branch == null ? 'Branch created' : 'Branch updated')),
        );
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
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text(
              widget.branch == null ? 'Add Branch' : 'Edit Branch',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Name'),
              validator: (value) => value == null || value.trim().isEmpty ? 'Name is required' : null,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _cityController,
              decoration: const InputDecoration(labelText: 'City'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _addressController,
              decoration: const InputDecoration(labelText: 'Address'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _phoneController,
              decoration: const InputDecoration(labelText: 'Phone'),
              keyboardType: TextInputType.phone,
            ),
            const SizedBox(height: 20),
            SizedBox(
              width: double.infinity,
              child: FilledButton(
                onPressed: _saving ? null : _submit,
                child: Text(widget.branch == null ? 'Create Branch' : 'Update Branch'),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
