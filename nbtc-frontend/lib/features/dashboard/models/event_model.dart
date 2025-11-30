import 'package:intl/intl.dart';

class EventContact {
  const EventContact({
    required this.name,
    required this.phone,
    this.email,
  });

  final String name;
  final String phone;
  final String? email;

  factory EventContact.fromJson(Map<String, dynamic>? json) {
    if (json == null) {
      return const EventContact(name: 'Unknown', phone: 'N/A');
    }
    return EventContact(
      name: json['name']?.toString() ?? 'Unknown',
      phone: json['phone']?.toString() ?? 'N/A',
      email: json['email']?.toString(),
    );
  }
}

class EventModel {
  const EventModel({
    required this.id,
    required this.title,
    required this.dateFrom,
    required this.dateTo,
    required this.timeFrom,
    required this.timeTo,
    this.description,
    this.map,
    this.imageUrl,
    this.isCanceled = false,
    required this.contact,
  });

  final String id;
  final String title;
  final DateTime dateFrom;
  final DateTime dateTo;
  final String timeFrom;
  final String timeTo;
  final String? description;
  final String? map;
  final String? imageUrl;
  final bool isCanceled;
  final EventContact contact;

  factory EventModel.fromJson(Map<String, dynamic> json) {
    return EventModel(
      id: json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      dateFrom: DateTime.tryParse(json['dateFrom']?.toString() ?? '') ?? DateTime.now(),
      dateTo: DateTime.tryParse(json['dateTo']?.toString() ?? '') ?? DateTime.now(),
      timeFrom: json['timeFrom']?.toString() ?? '',
      timeTo: json['timeTo']?.toString() ?? '',
      description: json['description']?.toString(),
      map: json['map']?.toString(),
      imageUrl: json['urlImage']?.toString(),
      isCanceled: json['isCanceled'] == true,
      contact: EventContact.fromJson(json['contactPerson'] as Map<String, dynamic>?),
    );
  }

  String get fullDateRange {
    final formatter = DateFormat('dd MMM');
    final start = formatter.format(dateFrom.toLocal());
    final end = formatter.format(dateTo.toLocal());
    return dateFrom.isAtSameMomentAs(dateTo) ? start : '$start - $end';
  }
}

class EventCollection {
  const EventCollection({
    required this.events,
    required this.total,
  });

  final List<EventModel> events;
  final int total;

  factory EventCollection.fromPaginated(Map<String, dynamic> json) {
    final docs = (json['docs'] as List<dynamic>? ?? [])
        .map((doc) => EventModel.fromJson(doc as Map<String, dynamic>))
        .toList();
    final total = json['totalDocs'] is num ? (json['totalDocs'] as num).toInt() : docs.length;
    return EventCollection(events: docs, total: total);
  }
}
