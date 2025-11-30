import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../../dashboard/models/content_model.dart';
import '../data/admin_repository.dart';

class ContentManagementPage extends StatefulWidget {
  const ContentManagementPage({super.key});

  @override
  State<ContentManagementPage> createState() => _ContentManagementPageState();
}

class _ContentManagementPageState extends State<ContentManagementPage> {
  late final AdminRepository _repository;
  late Future<List<ContentModel>> _contentsFuture;
  String _search = '';
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    final apiClient = context.read<ApiClient>();
    final tokenStorage = context.read<TokenStorage>();
    _repository = AdminRepository(apiClient, tokenStorage);
    _contentsFuture = _repository.fetchContents();
  }

  Future<void> _refresh() async {
    setState(() => _contentsFuture = _repository.fetchContents());
  }

  Future<void> _deleteContent(ContentModel content) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete content'),
        content: Text('Delete ${content.title}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() => _processing = true);
    try {
      await _repository.deleteContent(content.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Content deleted')));
      }
      await _refresh();
    } catch (err) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Failed: $err')));
      }
    } finally {
      if (mounted) setState(() => _processing = false);
    }
  }

  Future<void> _openForm({ContentModel? content}) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: ContentForm(
          repository: _repository,
          content: content,
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
        title: const Text('Content Management'),
        actions: [IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh))],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openForm(),
        icon: const Icon(Icons.post_add),
        label: const Text('Add Article'),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  decoration: const InputDecoration(
                    labelText: 'Search content',
                    prefixIcon: Icon(Icons.search),
                  ),
                  onChanged: (value) => setState(() => _search = value.toLowerCase()),
                ),
              ),
              Expanded(
                child: FutureBuilder<List<ContentModel>>(
                  future: _contentsFuture,
                  builder: (context, snapshot) {
                    if (snapshot.connectionState == ConnectionState.waiting) {
                      return const Center(child: CircularProgressIndicator());
                    }
                    if (snapshot.hasError) {
                      return Center(
                        child: Column(
                          mainAxisSize: MainAxisSize.min,
                          children: [
                            const Icon(Icons.error_outline),
                            const SizedBox(height: 12),
                            Text('Failed to load content\n${snapshot.error}'),
                            const SizedBox(height: 12),
                            FilledButton(onPressed: _refresh, child: const Text('Retry')),
                          ],
                        ),
                      );
                    }
                    final contents = snapshot.data ?? const [];
                    final filtered = contents.where((content) {
                      if (_search.isEmpty) return true;
                      return content.title.toLowerCase().contains(_search);
                    }).toList();
                    if (filtered.isEmpty) {
                      return const Center(child: Text('No content available.'));
                    }
                    return ListView.builder(
                      padding: const EdgeInsets.only(bottom: 100),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final content = filtered[index];
                        return Card(
                          color: Theme.of(context).cardColor,
                          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: ListTile(
                            title: Text(content.title, style: const TextStyle(color: Colors.white)),
                            subtitle: Text(content.description ?? '',
                                style: const TextStyle(color: Colors.white70)),
                            trailing: PopupMenuButton<String>(
                              onSelected: (value) {
                                if (value == 'edit') {
                                  _openForm(content: content);
                                } else if (value == 'delete') {
                                  _deleteContent(content);
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
          if (_processing)
            Container(
              color: Colors.black26,
              child: const Center(child: CircularProgressIndicator()),
            ),
        ],
      ),
    );
  }
}

class ContentForm extends StatefulWidget {
  const ContentForm({
    super.key,
    required this.repository,
    required this.onSaved,
    this.content,
  });

  final AdminRepository repository;
  final Future<void> Function() onSaved;
  final ContentModel? content;

  @override
  State<ContentForm> createState() => _ContentFormState();
}

class _ContentFormState extends State<ContentForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _statementController;
  late TextEditingController _listController;
  bool _saving = false;
  List<PlatformFile> _files = const [];

  @override
  void initState() {
    super.initState();
    final content = widget.content;
    _titleController = TextEditingController(text: content?.title ?? '');
    _descriptionController = TextEditingController(text: content?.description ?? '');
    final hasDetails = content != null && content.details.isNotEmpty;
    final detail = hasDetails ? content.details.first : null;
    _statementController = TextEditingController(text: detail?.statement ?? '');
    _listController = TextEditingController(text: detail?.listItems.join(', ') ?? '');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _statementController.dispose();
    _listController.dispose();
    super.dispose();
  }

  Future<void> _pickFiles() async {
    final result = await FilePicker.platform.pickFiles(allowMultiple: true, type: FileType.image, withData: true);
    if (result != null) {
      setState(() => _files = result.files);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final fields = <String, String>{
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'statement': _statementController.text.trim(),
      'list': _listController.text.trim(),
    };
    try {
            if (widget.content == null) {
        await widget.repository.createContent(fields: fields, files: _files);
      } else {
        await widget.repository.updateContent(widget.content!.id, fields, files: _files.isEmpty ? null : _files);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Content created')));
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
              Text(widget.content == null ? 'Create Content' : 'Edit Content', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Title'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _descriptionController,
                decoration: const InputDecoration(labelText: 'Description'),
                maxLines: 2,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _statementController,
                decoration: const InputDecoration(labelText: 'Statement'),
                maxLines: 3,
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _listController,
                decoration: const InputDecoration(labelText: 'List items (comma separated)'),
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ElevatedButton.icon(
                    onPressed: _pickFiles,
                    icon: const Icon(Icons.image),
                    label: const Text('Attach images'),
                  ),
                  if (_files.isNotEmpty) Text('${_files.length} file(s) selected'),
                ],
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _saving ? null : _submit,
                  child: const Text('Save'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
