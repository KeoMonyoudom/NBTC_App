import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../../dashboard/models/hero_slider_item.dart';
import '../data/admin_repository.dart';

class HeroSliderManagementPage extends StatefulWidget {
  const HeroSliderManagementPage({super.key});

  @override
  State<HeroSliderManagementPage> createState() => _HeroSliderManagementPageState();
}

class _HeroSliderManagementPageState extends State<HeroSliderManagementPage> {
  late final AdminRepository _repository;
  late Future<List<HeroSliderItem>> _slidersFuture;
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    final apiClient = context.read<ApiClient>();
    final tokenStorage = context.read<TokenStorage>();
    _repository = AdminRepository(apiClient, tokenStorage);
    _slidersFuture = _repository.fetchHeroSliders();
  }

  Future<void> _refresh() async {
    setState(() => _slidersFuture = _repository.fetchHeroSliders());
  }

  Future<void> _deleteSlider(HeroSliderItem slider) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete hero slide'),
        content: Text('Delete ${slider.title}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() => _processing = true);
    try {
      await _repository.deleteHeroSlider(slider.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Slide deleted')));
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

  Future<void> _openForm({HeroSliderItem? slider}) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: HeroSliderForm(
          repository: _repository,
          slider: slider,
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
        title: const Text('Hero Slider Management'),
        actions: [IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh))],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openForm(),
        icon: const Icon(Icons.add_photo_alternate_outlined),
        label: const Text('Add Slide'),
      ),
      body: Stack(
        children: [
          FutureBuilder<List<HeroSliderItem>>(
            future: _slidersFuture,
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
                      Text('Failed to load hero sliders\n${snapshot.error}'),
                      const SizedBox(height: 12),
                      FilledButton(onPressed: _refresh, child: const Text('Retry')),
                    ],
                  ),
                );
              }
              final sliders = snapshot.data ?? const [];
              if (sliders.isEmpty) {
                return const Center(child: Text('No hero sliders yet.'));
              }
              return ListView.builder(
                padding: const EdgeInsets.only(bottom: 100),
                itemCount: sliders.length,
                itemBuilder: (context, index) {
                  final slider = sliders[index];
                  return Card(
                    color: Theme.of(context).cardColor,
                    margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                    child: ListTile(
                      title: Text(slider.title, style: const TextStyle(color: Colors.white)),
                      subtitle: Text(slider.subtitle ?? '',
                          style: const TextStyle(color: Colors.white70)),
                      trailing: PopupMenuButton<String>(
                        onSelected: (value) {
                          if (value == 'edit') {
                            _openForm(slider: slider);
                          } else if (value == 'delete') {
                            _deleteSlider(slider);
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

class HeroSliderForm extends StatefulWidget {
  const HeroSliderForm({
    super.key,
    required this.repository,
    required this.onSaved,
    this.slider,
  });

  final AdminRepository repository;
  final Future<void> Function() onSaved;
  final HeroSliderItem? slider;

  @override
  State<HeroSliderForm> createState() => _HeroSliderFormState();
}

class _HeroSliderFormState extends State<HeroSliderForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _subtitleController;
  late TextEditingController _linkController;
  late TextEditingController _sortController;
  PlatformFile? _file;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final slider = widget.slider;
    _titleController = TextEditingController(text: slider?.title ?? '');
    _subtitleController = TextEditingController(text: slider?.subtitle ?? '');
    _linkController = TextEditingController(text: slider?.link ?? '');
    _sortController = TextEditingController(text: slider?.sort?.toString() ?? '1');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _subtitleController.dispose();
    _linkController.dispose();
    _sortController.dispose();
    super.dispose();
  }

  Future<void> _pickFile() async {
    final result = await FilePicker.platform.pickFiles(type: FileType.image, withData: true);
    if (result != null && result.files.isNotEmpty) {
      setState(() => _file = result.files.first);
    }
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final fields = <String, String>{
      'title': _titleController.text.trim(),
      'subtitle': _subtitleController.text.trim(),
      'link': _linkController.text.trim(),
      'sort': _sortController.text.trim(),
    };
    try {
      if (widget.slider == null) {
        await widget.repository.createHeroSlider(fields: fields, file: _file);
      } else {
        await widget.repository.updateHeroSlider(
          id: widget.slider!.id,
          fields: fields,
          file: _file,
        );
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.slider == null ? 'Slide created' : 'Slide updated')),
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
        child: SingleChildScrollView(
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(widget.slider == null ? 'Create Hero Slide' : 'Edit Hero Slide', style: Theme.of(context).textTheme.titleLarge),
              const SizedBox(height: 12),
              TextFormField(
                controller: _titleController,
                decoration: const InputDecoration(labelText: 'Title'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _subtitleController,
                decoration: const InputDecoration(labelText: 'Subtitle'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _linkController,
                decoration: const InputDecoration(labelText: 'Link URL'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _sortController,
                decoration: const InputDecoration(labelText: 'Sort order'),
                keyboardType: TextInputType.number,
              ),
              const SizedBox(height: 12),
              Wrap(
                spacing: 8,
                runSpacing: 8,
                children: [
                  ElevatedButton.icon(
                    onPressed: _pickFile,
                    icon: const Icon(Icons.image_outlined),
                    label: const Text('Select image'),
                  ),
                  if (_file != null) Text(_file!.name),
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
