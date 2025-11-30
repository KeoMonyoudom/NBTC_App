import '../../../core/network/api_client.dart';
import '../models/branch_model.dart';
import '../models/content_model.dart';
import '../models/event_model.dart';
import '../models/hero_slider_item.dart';

class DashboardRepository {
  DashboardRepository(this._apiClient);

  final ApiClient _apiClient;

  Future<List<HeroSliderItem>> fetchHeroSliders() async {
    final response = await _apiClient.get('/hero-slider');
    final list = response['data'] as List<dynamic>? ?? [];
    return list
        .map((item) => HeroSliderItem.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<EventCollection> fetchEvents({int limit = 5}) async {
    final response = await _apiClient.get(
      '/event',
      queryParameters: {'limit': limit, 'page': 1},
    );
    final data = response['data'] as Map<String, dynamic>? ?? <String, dynamic>{};
    return EventCollection.fromPaginated(data);
  }

  Future<List<BranchModel>> fetchBranches() async {
    final response = await _apiClient.get('/branch');
    final list = response['data'] as List<dynamic>? ?? [];
    return list
        .map((item) => BranchModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }

  Future<List<ContentModel>> fetchContents() async {
    final response = await _apiClient.get('/content');
    final list = response['data'] as List<dynamic>? ?? [];
    return list
        .map((item) => ContentModel.fromJson(item as Map<String, dynamic>))
        .toList();
  }
}
