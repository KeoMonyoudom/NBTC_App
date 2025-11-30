import 'package:flutter/material.dart';

import '../data/dashboard_repository.dart';
import '../models/branch_model.dart';
import '../models/content_model.dart';
import '../models/event_model.dart';
import '../models/hero_slider_item.dart';

class DashboardNotifier extends ChangeNotifier {
  DashboardNotifier(this._repository);

  final DashboardRepository _repository;

  bool isLoading = false;
  bool _hasLoaded = false;
  String? errorMessage;

  List<HeroSliderItem> heroSliders = const [];
  EventCollection? events;
  List<BranchModel> branches = const [];
  List<ContentModel> contents = const [];

  Future<void> loadDashboard({bool forceRefresh = false}) async {
    if (isLoading) return;
    if (_hasLoaded && !forceRefresh) return;
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      final results = await Future.wait([
        _repository.fetchHeroSliders(),
        _repository.fetchEvents(limit: 10),
        _repository.fetchBranches(),
        _repository.fetchContents(),
      ]);
      heroSliders = results[0] as List<HeroSliderItem>;
      events = results[1] as EventCollection;
      branches = results[2] as List<BranchModel>;
      contents = results[3] as List<ContentModel>;
      _hasLoaded = true;
    } catch (err) {
      errorMessage = err.toString();
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> refresh() => loadDashboard(forceRefresh: true);

  void reset() {
    _hasLoaded = false;
    heroSliders = const [];
    events = null;
    branches = const [];
    contents = const [];
    errorMessage = null;
    notifyListeners();
  }
}
