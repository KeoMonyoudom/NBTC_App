import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/network/api_client.dart';
import '../../../core/storage/token_storage.dart';
import '../../dashboard/models/event_model.dart';
import '../data/admin_repository.dart';

class EventManagementPage extends StatefulWidget {
  const EventManagementPage({super.key});

  @override
  State<EventManagementPage> createState() => _EventManagementPageState();
}

class _EventManagementPageState extends State<EventManagementPage> {
  late final AdminRepository _repository;
  late Future<List<EventModel>> _eventsFuture;
  String _search = '';
  bool _processing = false;

  @override
  void initState() {
    super.initState();
    final apiClient = context.read<ApiClient>();
    final tokenStorage = context.read<TokenStorage>();
    _repository = AdminRepository(apiClient, tokenStorage);
    _eventsFuture = _repository.fetchEvents();
  }

  Future<void> _refresh() async {
    setState(() => _eventsFuture = _repository.fetchEvents());
  }

  Future<void> _deleteEvent(EventModel event) async {
    final confirm = await showDialog<bool>(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete event'),
        content: Text('Delete ${event.title}?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(context, false), child: const Text('Cancel')),
          FilledButton(onPressed: () => Navigator.pop(context, true), child: const Text('Delete')),
        ],
      ),
    );
    if (confirm != true) return;
    setState(() => _processing = true);
    try {
      await _repository.deleteEvent(event.id);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Event deleted')));
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

  Future<void> _openEventForm({EventModel? event}) async {
    await showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      builder: (_) => Padding(
        padding: EdgeInsets.only(bottom: MediaQuery.of(context).viewInsets.bottom),
        child: EventForm(
          repository: _repository,
          event: event,
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
        title: const Text('Events Management'),
        actions: [IconButton(onPressed: _refresh, icon: const Icon(Icons.refresh))],
      ),
      floatingActionButton: FloatingActionButton.extended(
        onPressed: () => _openEventForm(),
        icon: const Icon(Icons.event_available),
        label: const Text('Add Event'),
      ),
      body: Stack(
        children: [
          Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: TextField(
                  decoration: const InputDecoration(
                    labelText: 'Search events',
                    prefixIcon: Icon(Icons.search),
                  ),
                  onChanged: (value) => setState(() => _search = value.toLowerCase()),
                ),
              ),
              Expanded(
                child: FutureBuilder<List<EventModel>>(
                  future: _eventsFuture,
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
                            Text('Failed to load events\n${snapshot.error}'),
                            const SizedBox(height: 12),
                            FilledButton(onPressed: _refresh, child: const Text('Retry')),
                          ],
                        ),
                      );
                    }
                    final events = snapshot.data ?? const [];
                    final filtered = events.where((event) {
                      if (_search.isEmpty) return true;
                      return event.title.toLowerCase().contains(_search);
                    }).toList();
                    if (filtered.isEmpty) {
                      return const Center(child: Text('No events found.'));
                    }
                    return ListView.builder(
                      padding: const EdgeInsets.only(bottom: 100),
                      itemCount: filtered.length,
                      itemBuilder: (context, index) {
                        final event = filtered[index];
                        return Card(
                          color: Theme.of(context).cardColor,
                          margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          child: ListTile(
                            title:
                                Text(event.title, style: const TextStyle(color: Colors.white)),
                            subtitle: DefaultTextStyle.merge(
                              style: const TextStyle(color: Colors.white70),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text('${event.fullDateRange} | ${event.timeFrom}-${event.timeTo}'),
                                  if (event.description != null) Text(event.description!),
                                ],
                              ),
                            ),
                            trailing: PopupMenuButton<String>(
                              onSelected: (value) {
                                if (value == 'edit') {
                                  _openEventForm(event: event);
                                } else if (value == 'delete') {
                                  _deleteEvent(event);
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

class EventForm extends StatefulWidget {
  const EventForm({
    super.key,
    required this.repository,
    this.event,
    required this.onSaved,
  });

  final AdminRepository repository;
  final EventModel? event;
  final Future<void> Function() onSaved;

  @override
  State<EventForm> createState() => _EventFormState();
}

class _EventFormState extends State<EventForm> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _titleController;
  late TextEditingController _descriptionController;
  late TextEditingController _mapController;
  late TextEditingController _urlImageController;
  late TextEditingController _dateFromController;
  late TextEditingController _dateToController;
  late TextEditingController _timeFromController;
  late TextEditingController _timeToController;
  late TextEditingController _contactNameController;
  late TextEditingController _contactPhoneController;
  late TextEditingController _contactEmailController;
  bool _saving = false;

  @override
  void initState() {
    super.initState();
    final event = widget.event;
    _titleController = TextEditingController(text: event?.title ?? '');
    _descriptionController = TextEditingController(text: event?.description ?? '');
    _mapController = TextEditingController(text: event?.map ?? '');
    _urlImageController = TextEditingController(text: event?.imageUrl ?? '');
    _dateFromController = TextEditingController(text: event?.dateFrom.toIso8601String().split('T').first ?? '');
    _dateToController = TextEditingController(text: event?.dateTo.toIso8601String().split('T').first ?? '');
    _timeFromController = TextEditingController(text: event?.timeFrom ?? '');
    _timeToController = TextEditingController(text: event?.timeTo ?? '');
    _contactNameController = TextEditingController(text: event?.contact.name ?? '');
    _contactPhoneController = TextEditingController(text: event?.contact.phone ?? '');
    _contactEmailController = TextEditingController(text: event?.contact.email ?? '');
  }

  @override
  void dispose() {
    _titleController.dispose();
    _descriptionController.dispose();
    _mapController.dispose();
    _urlImageController.dispose();
    _dateFromController.dispose();
    _dateToController.dispose();
    _timeFromController.dispose();
    _timeToController.dispose();
    _contactNameController.dispose();
    _contactPhoneController.dispose();
    _contactEmailController.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _saving = true);
    final payload = <String, dynamic>{
      'title': _titleController.text.trim(),
      'description': _descriptionController.text.trim(),
      'map': _mapController.text.trim(),
      'urlImage': _urlImageController.text.trim(),
      'dateFrom': _dateFromController.text.trim(),
      'dateTo': _dateToController.text.trim(),
      'timeFrom': _timeFromController.text.trim(),
      'timeTo': _timeToController.text.trim(),
      'contactPerson': <String, String>{
        'name': _contactNameController.text.trim(),
        'phone': _contactPhoneController.text.trim(),
        'email': _contactEmailController.text.trim(),
      }
    };
    payload.removeWhere((key, value) => value is String && value.trim().isEmpty);
    final contact = payload['contactPerson'] as Map<String, String>;
    contact.removeWhere((key, value) => value.trim().isEmpty);
    try {
      if (widget.event == null) {
        await widget.repository.createEvent(payload);
      } else {
        await widget.repository.updateEvent(widget.event!.id, payload);
      }
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text(widget.event == null ? 'Event created' : 'Event updated')),
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
              Text(widget.event == null ? 'Create Event' : 'Edit Event', style: Theme.of(context).textTheme.titleLarge),
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
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _dateFromController,
                      decoration: const InputDecoration(labelText: 'Date from (YYYY-MM-DD)'),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _dateToController,
                      decoration: const InputDecoration(labelText: 'Date to (YYYY-MM-DD)'),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                children: [
                  Expanded(
                    child: TextFormField(
                      controller: _timeFromController,
                      decoration: const InputDecoration(labelText: 'Time from (HH:mm)'),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Expanded(
                    child: TextFormField(
                      controller: _timeToController,
                      decoration: const InputDecoration(labelText: 'Time to (HH:mm)'),
                      validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _mapController,
                decoration: const InputDecoration(labelText: 'Map URL / Address'),
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _urlImageController,
                decoration: const InputDecoration(labelText: 'Image URL (optional)'),
              ),
              const SizedBox(height: 12),
              Text('Contact Person', style: Theme.of(context).textTheme.titleMedium),
              TextFormField(
                controller: _contactNameController,
                decoration: const InputDecoration(labelText: 'Name'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _contactPhoneController,
                decoration: const InputDecoration(labelText: 'Phone'),
                validator: (v) => v == null || v.trim().isEmpty ? 'Required' : null,
              ),
              const SizedBox(height: 12),
              TextFormField(
                controller: _contactEmailController,
                decoration: const InputDecoration(labelText: 'Email'),
              ),
              const SizedBox(height: 16),
              SizedBox(
                width: double.infinity,
                child: FilledButton(
                  onPressed: _saving ? null : _submit,
                  child: Text(widget.event == null ? 'Create event' : 'Update event'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
