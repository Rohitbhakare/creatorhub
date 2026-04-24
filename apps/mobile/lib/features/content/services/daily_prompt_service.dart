import 'dart:convert';

import 'package:flutter/services.dart' show rootBundle;
import 'package:flutter_riverpod/flutter_riverpod.dart';

class DailyPrompt {
  final String text;
  final int index;
  const DailyPrompt({required this.text, required this.index});
}

class DailyPromptService {
  static const _assetPath =
      'lib/features/content/data/daily_prompts.json';

  List<String>? _cached;

  Future<List<String>> _loadPool() async {
    if (_cached != null) return _cached!;
    final raw = await rootBundle.loadString(_assetPath);
    final decoded = jsonDecode(raw) as Map<String, dynamic>;
    final list = (decoded['prompts'] as List<dynamic>).cast<String>();
    _cached = list;
    return list;
  }

  Future<DailyPrompt> promptForDate(DateTime date) async {
    final pool = await _loadPool();
    final daysSinceEpoch =
        DateTime.utc(date.year, date.month, date.day).millisecondsSinceEpoch ~/
            Duration.millisecondsPerDay;
    final index = daysSinceEpoch.abs() % pool.length;
    return DailyPrompt(text: pool[index], index: index);
  }
}

final dailyPromptServiceProvider = Provider<DailyPromptService>((ref) {
  return DailyPromptService();
});

final dailyPromptProvider = FutureProvider<DailyPrompt>((ref) async {
  final service = ref.watch(dailyPromptServiceProvider);
  return service.promptForDate(DateTime.now());
});
