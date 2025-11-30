import 'package:cached_network_image/cached_network_image.dart';
import 'package:carousel_slider/carousel_slider.dart';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../../../core/constants/environment.dart';
import '../../../core/utils/date_formatter.dart';
import '../../../core/widgets/app_loader.dart';
import '../../../core/widgets/empty_state.dart';
import '../../../core/widgets/error_view.dart';
import '../../auth/controllers/auth_notifier.dart';
import '../../dashboard/controllers/dashboard_notifier.dart';
import '../models/branch_model.dart';
import '../models/content_model.dart';
import '../models/event_model.dart';
import '../models/hero_slider_item.dart';
import '../../admin/pages/branch_management_page.dart';
import '../../admin/pages/user_management_page.dart';
import '../../admin/pages/event_management_page.dart';
import '../../admin/pages/content_management_page.dart';
import '../../admin/pages/hero_slider_management_page.dart';
import '../../profile/profile_page.dart';

class DashboardPage extends StatefulWidget {
  const DashboardPage({super.key});

  @override
  State<DashboardPage> createState() => _DashboardPageState();
}

class _DashboardPageState extends State<DashboardPage> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      context.read<DashboardNotifier>().loadDashboard();
    });
  }

  Future<void> _handleRefresh() async {
    await context.read<DashboardNotifier>().refresh();
    await context.read<AuthNotifier>().refreshProfile();
  }

  void _openProfile() {
    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => const ProfilePage()),
    );
  }

  _AdminModule? _moduleFor(AdminModuleType type) {
    for (final module in _adminModules) {
      if (module.type == type) return module;
    }
    return null;
  }

  void _openReadPage(String title, Widget child) {
    Navigator.of(context).push(
      MaterialPageRoute(
        builder: (_) => Scaffold(
          appBar: AppBar(title: Text(title)),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: child,
          ),
        ),
      ),
    );
  }

  void _openReadEvents() {
    final events = context.read<DashboardNotifier>().events?.events ?? const [];
    _openReadPage('Events', _EventsSection(events: events));
  }

  void _openReadContent() {
    final contents = context.read<DashboardNotifier>().contents;
    _openReadPage('Content Library', _ContentSection(contents: contents));
  }

  void _openReadBranches() {
    final branches = context.read<DashboardNotifier>().branches;
    _openReadPage('Branches', _BranchSection(branches: branches));
  }

  void _openReadSlides() {
    final sliders = context.read<DashboardNotifier>().heroSliders;
    _openReadPage(
      'Hero Slides',
      Column(
        children: [
          _HeroSliderSection(sliders: sliders),
        ],
      ),
    );
  }

  void _openModule(_AdminModule module) {
    Widget page;
    switch (module.type) {
      case AdminModuleType.users:
        page = const UserManagementPage();
        break;
      case AdminModuleType.events:
        page = const EventManagementPage();
        break;
      case AdminModuleType.content:
        page = const ContentManagementPage();
        break;
      case AdminModuleType.heroSlides:
        page = const HeroSliderManagementPage();
        break;
      case AdminModuleType.branches:
        page = const BranchManagementPage();
        break;
      default:
        return;
    }

    Navigator.of(context).push(
      MaterialPageRoute(builder: (_) => page),
    );
  }

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthNotifier>();
    final userRoles = auth.user?.roles.map((role) => role.toLowerCase()).toList() ?? const [];
    final isAdmin = userRoles.contains('admin') || userRoles.contains('systemadmin');
    return Scaffold(
      appBar: AppBar(
        title: Text('Hello ${auth.user?.fullName ?? 'NBTC'}'),
        actions: [
          IconButton(
            tooltip: 'Reload',
            onPressed: () => context.read<DashboardNotifier>().refresh(),
            icon: const Icon(Icons.refresh),
          ),
          IconButton(
            tooltip: 'Logout',
            onPressed: () {
              context.read<DashboardNotifier>().reset();
              context.read<AuthNotifier>().logout();
            },
            icon: const Icon(Icons.logout),
          ),
        ],
      ),
      body: Consumer<DashboardNotifier>(
        builder: (context, dashboard, _) {
          if (dashboard.isLoading && dashboard.heroSliders.isEmpty) {
            return const AppLoader(message: 'Loading dashboard...');
          }
          if (dashboard.errorMessage != null && dashboard.heroSliders.isEmpty) {
            return ErrorView(
              message: dashboard.errorMessage!,
              onRetry: () => dashboard.loadDashboard(forceRefresh: true),
            );
          }
          return RefreshIndicator(
            onRefresh: _handleRefresh,
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  if (isAdmin) ...[
                    _AdminQuickActions(
                      onModuleSelected: _openModule,
                    ),
                    const SizedBox(height: 16),
                  ],
                  _HeroSliderSection(sliders: dashboard.heroSliders),
                  const SizedBox(height: 16),
                  _StatsRow(
                    events: dashboard.events?.events.length ?? 0,
                    branches: dashboard.branches.length,
                    articles: dashboard.contents.length,
                  ),
                  const SizedBox(height: 16),
                  _EventsSection(events: dashboard.events?.events ?? const []),
                  const SizedBox(height: 16),
                  _ContentSection(contents: dashboard.contents),
                  const SizedBox(height: 16),
                  _BranchSection(branches: dashboard.branches),
                ],
              ),
            ),
          );
        },
      ),
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: 0,
        type: BottomNavigationBarType.fixed,
        items: [
          const BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: 'Dashboard'),
          const BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
          const BottomNavigationBarItem(icon: Icon(Icons.event), label: 'Events'),
          const BottomNavigationBarItem(icon: Icon(Icons.menu_book), label: 'Contents'),
          const BottomNavigationBarItem(icon: Icon(Icons.business), label: 'Branches'),
          const BottomNavigationBarItem(icon: Icon(Icons.slideshow), label: 'Slides'),
          if (isAdmin)
            const BottomNavigationBarItem(icon: Icon(Icons.groups), label: 'Users'),
        ],
        onTap: (index) {
          if (index == 0) return;
          switch (index) {
            case 1:
              _openProfile();
              break;
            case 2:
              isAdmin ? _openModule(_moduleFor(AdminModuleType.events)!) : _openReadEvents();
              break;
            case 3:
              isAdmin ? _openModule(_moduleFor(AdminModuleType.content)!) : _openReadContent();
              break;
            case 4:
              isAdmin ? _openModule(_moduleFor(AdminModuleType.branches)!) : _openReadBranches();
              break;
            case 5:
              isAdmin ? _openModule(_moduleFor(AdminModuleType.heroSlides)!) : _openReadSlides();
              break;
            case 6:
              if (isAdmin) {
                _openModule(_moduleFor(AdminModuleType.users)!);
              }
              break;
          }
        },
      ),
    );
  }
}

class _HeroSliderSection extends StatelessWidget {
  const _HeroSliderSection({required this.sliders});

  final List<HeroSliderItem> sliders;

  @override
  Widget build(BuildContext context) {
    if (sliders.isEmpty) {
      return const EmptyState(message: 'No hero slider items yet');
    }
    return CarouselSlider(
      options: CarouselOptions(
        height: 200,
        autoPlay: true,
        viewportFraction: 0.92,
        enlargeCenterPage: true,
      ),
      items: sliders
          .map((slider) => Builder(
                builder: (context) {
                  final url = slider.imageUrl(Environment.apiBaseUrl);
                  return ClipRRect(
                    borderRadius: BorderRadius.circular(16),
                    child: Stack(
                      fit: StackFit.expand,
                      children: [
                        if (url != null)
                          CachedNetworkImage(
                            imageUrl: url,
                            fit: BoxFit.cover,
                            placeholder: (context, _) => const ColoredBox(
                              color: Color(0xFFEFEFEF),
                              child: Center(child: CircularProgressIndicator()),
                            ),
                            errorWidget: (context, _, __) => const ColoredBox(
                              color: Color(0xFFE0E0E0),
                              child: Icon(Icons.broken_image),
                            ),
                          )
                        else
                          Container(color: Colors.grey.shade200),
                        Positioned(
                          left: 16,
                          right: 16,
                          bottom: 16,
                          child: DecoratedBox(
                            decoration: BoxDecoration(
                              color: Colors.black.withOpacity(0.45),
                              borderRadius: BorderRadius.circular(12),
                            ),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    slider.title,
                                    style: Theme.of(context)
                                        .textTheme
                                        .titleMedium
                                        ?.copyWith(color: Colors.white),
                                  ),
                                  if (slider.subtitle != null)
                                    Text(
                                      slider.subtitle!,
                                      style: Theme.of(context)
                                          .textTheme
                                          .bodyMedium
                                          ?.copyWith(color: Colors.white70),
                                    ),
                                ],
                              ),
                            ),
                          ),
                        ),
                      ],
                    ),
                  );
                },
              ))
          .toList(),
    );
  }
}

class _StatsRow extends StatelessWidget {
  const _StatsRow({
    required this.events,
    required this.branches,
    required this.articles,
  });

  final int events;
  final int branches;
  final int articles;

  @override
  Widget build(BuildContext context) {
    final stats = [
      _StatMetric(label: 'Events', value: events, icon: Icons.event),
      _StatMetric(label: 'Branches', value: branches, icon: Icons.apartment),
      _StatMetric(label: 'Articles', value: articles, icon: Icons.menu_book),
    ];
    return Row(
      children: stats
          .map(
            (stat) => Expanded(
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 4),
                child: Card(
                  color: Theme.of(context).cardColor,
                  child: DefaultTextStyle.merge(
                    style: const TextStyle(color: Colors.white),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(vertical: 18),
                      child: Column(
                        children: [
                          Icon(stat.icon, color: Colors.white),
                          const SizedBox(height: 8),
                          Text(
                            stat.value.toString(),
                            style: Theme.of(context)
                                .textTheme
                                .headlineSmall
                                ?.copyWith(color: Colors.white),
                          ),
                          Text(stat.label),
                        ],
                      ),
                    ),
                  ),
                ),
              ),
            ),
          )
          .toList(),
    );
  }
}

class _StatMetric {
  const _StatMetric({
    required this.label,
    required this.value,
    required this.icon,
  });

  final String label;
  final int value;
  final IconData icon;
}

class _EventsSection extends StatelessWidget {
  const _EventsSection({required this.events});

  final List<EventModel> events;

  @override
  Widget build(BuildContext context) {
    if (events.isEmpty) {
      return const EmptyState(message: 'No upcoming events');
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Upcoming Events', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        ...events.map(
          (event) => Card(
            color: Theme.of(context).cardColor,
            margin: const EdgeInsets.symmetric(vertical: 8),
            child: DefaultTextStyle.merge(
              style: const TextStyle(color: Colors.white),
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Expanded(
                          child: Text(
                            event.title,
                            style: Theme.of(context)
                                .textTheme
                                .titleMedium
                                ?.copyWith(color: Colors.white),
                          ),
                        ),
                        if (event.isCanceled)
                          Chip(
                            label: const Text('Canceled'),
                            backgroundColor: Colors.red.shade100,
                          ),
                      ],
                    ),
                    const SizedBox(height: 8),
                    Row(
                      children: [
                        const Icon(Icons.calendar_today,
                            size: 16, color: Colors.white70),
                        const SizedBox(width: 6),
                        Text(event.fullDateRange),
                        const SizedBox(width: 12),
                        const Icon(Icons.access_time,
                            size: 16, color: Colors.white70),
                        const SizedBox(width: 6),
                        Text(
                          '${DateFormatter.formatTime(event.timeFrom)} - ${DateFormatter.formatTime(event.timeTo)}',
                        ),
                      ],
                    ),
                    if (event.description != null) ...[
                      const SizedBox(height: 8),
                      Text(event.description!),
                    ],
                    const SizedBox(height: 12),
                    Row(
                      children: [
                        const Icon(Icons.person_outline,
                            size: 16, color: Colors.white70),
                        const SizedBox(width: 6),
                        Expanded(child: Text(event.contact.name)),
                        const SizedBox(width: 12),
                        const Icon(Icons.phone,
                            size: 16, color: Colors.white70),
                        const SizedBox(width: 6),
                        Expanded(child: Text(event.contact.phone)),
                      ],
                    ),
                    if (event.contact.email != null) ...[
                      const SizedBox(height: 4),
                      Row(
                        children: [
                          const Icon(Icons.email_outlined,
                              size: 16, color: Colors.white70),
                          const SizedBox(width: 6),
                          Expanded(child: Text(event.contact.email!)),
                        ],
                      ),
                    ],
                  ],
                ),
              ),
            ),
          ),
        ),
      ],
    );
  }
}
class _ContentSection extends StatelessWidget {
  const _ContentSection({required this.contents});

  final List<ContentModel> contents;

  @override
  Widget build(BuildContext context) {
    if (contents.isEmpty) {
      return const EmptyState(message: 'No content available');
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Knowledge Base', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        ...contents.map(
          (content) => Card(
            color: Theme.of(context).cardColor,
            margin: const EdgeInsets.symmetric(vertical: 8),
            child: ExpansionTile(
              collapsedIconColor: Colors.white,
              iconColor: Colors.white,
              collapsedTextColor: Colors.white,
              textColor: Colors.white,
              title: Text(content.title,
                  style: Theme.of(context)
                      .textTheme
                      .titleMedium
                      ?.copyWith(color: Colors.white)),
              subtitle: content.description != null
                  ? Text(content.description!,
                      style: const TextStyle(color: Colors.white70))
                  : null,
              children: content.details
                  .map(
                    (detail) => Padding(
                      padding:
                          const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                      child: DefaultTextStyle.merge(
                        style: const TextStyle(color: Colors.white),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              detail.statement,
                              style: Theme.of(context)
                                  .textTheme
                                  .titleMedium
                                  ?.copyWith(color: Colors.white),
                            ),
                            const SizedBox(height: 8),
                            ...detail.listItems.map(
                              (item) => Row(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  const Text('- '),
                                  Expanded(child: Text(item)),
                                ],
                              ),
                            ),
                            if (detail.images.isNotEmpty) ...[
                              const SizedBox(height: 12),
                              SizedBox(
                                height: 120,
                                child: ListView.separated(
                                  scrollDirection: Axis.horizontal,
                                  itemCount: detail.images.length,
                                  separatorBuilder: (_, __) => const SizedBox(width: 12),
                                  itemBuilder: (context, index) {
                                    final image = detail.images[index];
                                    final url = image.buildImageUrl(Environment.apiBaseUrl);
                                    if (url == null) {
                                      return const SizedBox.shrink();
                                    }
                                    return ClipRRect(
                                      borderRadius: BorderRadius.circular(12),
                                      child: CachedNetworkImage(
                                        imageUrl: url,
                                        width: 160,
                                        height: 120,
                                        fit: BoxFit.cover,
                                        placeholder: (context, _) => const ColoredBox(
                                          color: Color(0xFFECECEC),
                                          child: Center(child: CircularProgressIndicator()),
                                        ),
                                        errorWidget: (context, _, __) => const ColoredBox(
                                          color: Color(0xFFE0E0E0),
                                          child: Icon(Icons.broken_image),
                                        ),
                                      ),
                                    );
                                  },
                                ),
                              ),
                            ],
                          ],
                        ),
                      ),
                    ),
                  )
                  .toList(),
            ),
          ),
        ),
      ],
    );
  }
}
class _BranchSection extends StatelessWidget {
  const _BranchSection({required this.branches});

  final List<BranchModel> branches;

  @override
  Widget build(BuildContext context) {
    if (branches.isEmpty) {
      return const EmptyState(message: 'No active branches registered');
    }
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Branches', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 8),
        ...branches.map(
          (branch) => Card(
            color: Theme.of(context).cardColor,
            margin: const EdgeInsets.symmetric(vertical: 8),
            child: ListTile(
              title: Text(branch.name, style: const TextStyle(color: Colors.white)),
              subtitle: DefaultTextStyle.merge(
                style: const TextStyle(color: Colors.white70),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    if (branch.city != null) Text(branch.city!),
                    if (branch.address != null) Text(branch.address!),
                    if (branch.phone != null) Text('Phone: ${branch.phone}'),
                    if (branch.managerName != null)
                      Text('Manager: ${branch.managerName}'),
                  ],
                ),
              ),
              leading: const Icon(Icons.local_hospital_outlined, color: Colors.white),
            ),
          ),
        ),
      ],
    );
  }
}
class _AdminQuickActions extends StatelessWidget {
  const _AdminQuickActions({required this.onModuleSelected});

  final void Function(_AdminModule module) onModuleSelected;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            Icon(Icons.admin_panel_settings, color: Theme.of(context).colorScheme.primary),
            const SizedBox(width: 8),
            Text(
              'Admin Controls',
              style: Theme.of(context).textTheme.titleLarge,
            ),
          ],
        ),
        const SizedBox(height: 8),
        Text(
          'Quickly jump into the modules you manage. Tap a tile to review API endpoints and responsibilities.',
          style: Theme.of(context).textTheme.bodyMedium,
        ),
        const SizedBox(height: 12),
        Wrap(
          spacing: 12,
          runSpacing: 12,
          children: _adminModules
              .map(
                (module) => SizedBox(
                  width: 220,
                  child: Card(
                    color: Theme.of(context).cardColor,
                    elevation: 1,
                    child: InkWell(
                      borderRadius: BorderRadius.circular(12),
                      onTap: () => onModuleSelected(module),
                      child: DefaultTextStyle.merge(
                        style: const TextStyle(color: Colors.white),
                        child: Padding(
                          padding: const EdgeInsets.all(16),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Icon(module.icon, color: Colors.white),
                              const SizedBox(height: 12),
                              Text(module.name,
                                  style: Theme.of(context)
                                      .textTheme
                                      .titleMedium
                                      ?.copyWith(color: Colors.white)),
                              const SizedBox(height: 6),
                              Text(module.description,
                                  style: Theme.of(context)
                                      .textTheme
                                      .bodySmall
                                      ?.copyWith(color: Colors.white70)),
                              const SizedBox(height: 12),
                              Text(
                                '${module.endpoints.length} endpoints',
                                style: Theme.of(context)
                                    .textTheme
                                    .labelSmall
                                    ?.copyWith(color: Colors.white70),
                              ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              )
              .toList(),
        ),
      ],
    );
  }
}

enum AdminModuleType {
  dashboard,
  users,
  events,
  content,
  heroSlides,
  branches,
}

class _AdminModule {
  const _AdminModule({
    required this.type,
    required this.name,
    required this.description,
    required this.icon,
    required this.endpoints,
  });

  final AdminModuleType type;
  final String name;
  final String description;
  final IconData icon;
  final List<String> endpoints;
}

const List<_AdminModule> _adminModules = [
  _AdminModule(
    type: AdminModuleType.dashboard,
    name: 'Dashboard',
    description: 'Review KPIs and monitor live activity across sliders, users, and events.',
    icon: Icons.dashboard_customize_outlined,
    endpoints: [
      'GET /api/hero-slider',
      'GET /api/event',
      'GET /api/content',
      'GET /api/branch',
    ],
  ),
  _AdminModule(
    type: AdminModuleType.users,
    name: 'User Management',
    description: 'Create accounts, assign roles, and reset passwords for staff or volunteers.',
    icon: Icons.groups_outlined,
    endpoints: [
      'GET /api/user',
      'POST /api/user',
      'PATCH /api/user/{id}',
      'DELETE /api/user/{id}',
    ],
  ),
  _AdminModule(
    type: AdminModuleType.events,
    name: 'Events',
    description: 'Schedule blood drives, edit details, or cancel upcoming events.',
    icon: Icons.event_note_outlined,
    endpoints: [
      'GET /api/event',
      'POST /api/event',
      'PATCH /api/event/{id}',
      'DELETE /api/event/{id}',
    ],
  ),
  _AdminModule(
    type: AdminModuleType.content,
    name: 'Content',
    description: 'Publish education articles, upload images, and highlight donation tips.',
    icon: Icons.menu_book_outlined,
    endpoints: [
      'GET /api/content',
      'POST /api/content',
      'PATCH /api/content/{id}',
    ],
  ),
  _AdminModule(
    type: AdminModuleType.heroSlides,
    name: 'Hero Slides',
    description: 'Manage homepage banners with compelling stories and campaign CTAs.',
    icon: Icons.slideshow_outlined,
    endpoints: [
      'GET /api/hero-slider',
      'POST /api/hero-slider',
      'PATCH /api/hero-slider/{id}',
    ],
  ),
  _AdminModule(
    type: AdminModuleType.branches,
    name: 'Branches',
    description: 'Keep branch contact details in sync for donors and staff.',
    icon: Icons.apartment,
    endpoints: [
      'GET /api/branch',
      'POST /api/branch',
      'PATCH /api/branch/{id}',
    ],
  ),
];
