class HeroSliderItem {
  const HeroSliderItem({
    required this.id,
    required this.title,
    this.subtitle,
    this.link,
    this.sort,
    this.imagePath,
  });

  final String id;
  final String title;
  final String? subtitle;
  final String? link;
  final int? sort;
  final String? imagePath;

  factory HeroSliderItem.fromJson(Map<String, dynamic> json) {
    return HeroSliderItem(
      id: json['_id']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      subtitle: json['subtitle']?.toString(),
      link: json['link']?.toString(),
      sort: json['sort'] is num ? (json['sort'] as num).toInt() : null,
      imagePath: json['imageUrl']?.toString() ?? json['image']?['url']?.toString(),
    );
  }

  String? imageUrl(String baseUrl) {
    final path = imagePath;
    if (path == null || path.isEmpty) return null;
    if (path.startsWith('http')) return path;
    final normalizedBase = baseUrl.endsWith('/') ? baseUrl.substring(0, baseUrl.length - 1) : baseUrl;
    final normalizedPath = path.startsWith('/') ? path : '/$path';
    return '$normalizedBase$normalizedPath';
  }
}
