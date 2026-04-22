import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';

/// Device-local saves for guest mode (SOC-FR-004, IAM-FR-010).
/// 30-day TTL — entries past expiry are purged on next read/write.
/// Each entry: `{ id, saved_at (ISO), expires_at (ISO) }`
class LocalSaveStore {
  static const String _key = 'guest.saves';
  static const Duration _ttl = Duration(days: 30);

  Future<SharedPreferences> get _prefs => SharedPreferences.getInstance();

  /// Returns the full set of active (unexpired) saved content IDs.
  Future<Set<String>> list() async {
    final entries = await _loadAndPurge();
    return entries.map((e) => e.id).toSet();
  }

  Future<bool> isSaved(String contentId) async {
    final ids = await list();
    return ids.contains(contentId);
  }

  Future<void> save(String contentId) async {
    final entries = await _loadAndPurge();
    entries.removeWhere((e) => e.id == contentId);
    final now = DateTime.now();
    entries.add(LocalSaveEntry(
      id: contentId,
      savedAt: now,
      expiresAt: now.add(_ttl),
    ));
    await _persist(entries);
  }

  Future<void> remove(String contentId) async {
    final entries = await _loadAndPurge();
    entries.removeWhere((e) => e.id == contentId);
    await _persist(entries);
  }

  Future<void> clear() async {
    final prefs = await _prefs;
    await prefs.remove(_key);
  }

  /// Returns all saved entries (for sign-up transfer), expired ones removed.
  Future<List<LocalSaveEntry>> drain() async {
    final entries = await _loadAndPurge();
    return List.unmodifiable(entries);
  }

  Future<List<LocalSaveEntry>> _loadAndPurge() async {
    final prefs = await _prefs;
    final raw = prefs.getString(_key);
    if (raw == null || raw.isEmpty) return [];

    final now = DateTime.now();
    final decoded = (jsonDecode(raw) as List<dynamic>)
        .cast<Map<String, dynamic>>()
        .map(LocalSaveEntry.fromJson)
        .where((e) => e.expiresAt.isAfter(now))
        .toList();

    return decoded;
  }

  Future<void> _persist(List<LocalSaveEntry> entries) async {
    final prefs = await _prefs;
    final encoded = jsonEncode(entries.map((e) => e.toJson()).toList());
    await prefs.setString(_key, encoded);
  }
}

class LocalSaveEntry {
  final String id;
  final DateTime savedAt;
  final DateTime expiresAt;

  const LocalSaveEntry({
    required this.id,
    required this.savedAt,
    required this.expiresAt,
  });

  Map<String, dynamic> toJson() => {
        'id': id,
        'saved_at': savedAt.toIso8601String(),
        'expires_at': expiresAt.toIso8601String(),
      };

  factory LocalSaveEntry.fromJson(Map<String, dynamic> json) => LocalSaveEntry(
        id: json['id'] as String,
        savedAt: DateTime.parse(json['saved_at'] as String),
        expiresAt: DateTime.parse(json['expires_at'] as String),
      );
}
