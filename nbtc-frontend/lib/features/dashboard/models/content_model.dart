class ContentImage {
  const ContentImage({
    required this.id,
    this.originalName,
    this.url,
  });

  final String id;
  final String? originalName;
  final String? url;

  factory ContentImage.fromJson(Map<String, dynamic> json) {
    return ContentImage(
      id: json['_id']?.toString() ?? '',
      originalName: json['originalname']?.toString(),
      url: json['url']?.toString(),
    );
  }

  String? buildImageUrl(String baseUrl) {
    if (url == null || url!.isEmpty) return null;
    if (url!.startsWith('http')) return url;
    final normalizedBase = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    final normalizedPath = url!.startsWith('/') ? url! : '/$url';
    return '$normalizedBase$normalizedPath';
  }
}

class ContentDetail {
  const ContentDetail({
    required this.id,
    required this.statement,
    this.listItems = const <String>[],
    this.images = const <ContentImage>[],
  });

  final String id;
  final String statement;
  final List<String> listItems;
  final List<ContentImage> images;

  factory ContentDetail.fromJson(Map<String, dynamic> json) {
    final list = (json['list'] as List<dynamic>? ?? [])
        .map((item) => item.toString())
        .toList();
    final images = (json['images'] as List<dynamic>? ?? [])
        .map((item) => ContentImage.fromJson(item as Map<String, dynamic>))
        .toList();
    return ContentDetail(
      id: json['_id']?.toString() ?? '',
      statement: json['statement']?.toString() ?? '',
      listItems: list,
      images: images,
    );
  }
}

class ContentModel {
  const ContentModel({
    required this.id,
    required this.title,
    this.description,
    required this.details,
  });

  final String id;
  final String title;
  final String? description;
  final List<ContentDetail> details;

  factory ContentModel.fromJson(Map<String, dynamic> json) {
    final details = (json['details'] as List<dynamic>? ?? [])
        .map((detail) => ContentDetail.fromJson(detail as Map<String, dynamic>))
        .toList();
    return ContentModel(
      id: json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      description: json['description']?.toString(),
      details: details,
    );
  }
}
