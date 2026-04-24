import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../auth/providers/auth_provider.dart';
import '../models/discover_models.dart';

// ── Recent searches (persisted locally, DPDPA-compliant) ────────────────────

const _kRecentSearchesKey = 'discover.recent_searches';
const _kMaxRecent = 5;

final recentSearchesProvider =
    NotifierProvider<RecentSearchesNotifier, List<String>>(
  RecentSearchesNotifier.new,
);

class RecentSearchesNotifier extends Notifier<List<String>> {
  @override
  List<String> build() {
    Future.microtask(_load);
    return [];
  }

  Future<void> _load() async {
    final prefs = await SharedPreferences.getInstance();
    final saved = prefs.getStringList(_kRecentSearchesKey) ?? [];
    state = saved;
  }

  Future<void> add(String query) async {
    final q = query.trim();
    if (q.isEmpty) return;
    final updated = [q, ...state.where((s) => s != q)].take(_kMaxRecent).toList();
    state = updated;
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_kRecentSearchesKey, updated);
  }

  Future<void> remove(String query) async {
    state = state.where((s) => s != query).toList();
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_kRecentSearchesKey, state);
  }

  Future<void> clear() async {
    state = [];
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_kRecentSearchesKey);
  }
}

// ── Live search query state ───────────────────────────────────────────────────

final searchQueryProvider =
    NotifierProvider<SearchQueryNotifier, String>(
  SearchQueryNotifier.new,
);

class SearchQueryNotifier extends Notifier<String> {
  @override
  String build() => '';

  void set(String q) => state = q;
  void clear() => state = '';
}

// ── Live search suggestions (debounced, grouped by type) ─────────────────────

final searchSuggestionsProvider =
    FutureProvider.autoDispose<SearchSuggestionsResult?>((ref) async {
  final query = ref.watch(searchQueryProvider);
  if (query.trim().length < 2) return null;

  // 300ms debounce — cancelled if query changes before it resolves
  await Future.delayed(const Duration(milliseconds: 300));
  final current = ref.read(searchQueryProvider);
  if (current != query) return null;

  final dio = ref.read(authServiceProvider).dio;
  final response = await dio.get(
    '/api/v1/discover/search',
    queryParameters: {'q': query.trim(), 'limit': 5},
  );
  final data = (response.data as Map<String, dynamic>)['data'] as Map<String, dynamic>;
  final result = SearchSuggestionsResult.fromJson(data);

  // Log for authenticated users only (DISC-FR-036)
  final auth = ref.read(authProvider);
  if (auth.isAuthenticated) {
    _logAsync(ref, query.trim(), result);
  }

  return result;
});

void _logAsync(Ref ref, String query, SearchSuggestionsResult result) {
  final total = result.content.length + result.cities.length + result.creators.length;
  ref.read(authServiceProvider).dio.post(
    '/api/v1/discover/search/log',
    data: {'query': query, 'result_count': total},
  ).ignore();
}
