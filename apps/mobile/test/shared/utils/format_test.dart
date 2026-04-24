import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/shared/utils/format.dart';

void main() {
  group('formatDurationCompact', () {
    test('returns empty string for zero or negative', () {
      expect(formatDurationCompact(0), '');
      expect(formatDurationCompact(-10), '');
    });

    test('minutes < 60', () {
      expect(formatDurationCompact(45), '45m');
      expect(formatDurationCompact(1), '1m');
    });

    test('hours (60m..24h)', () {
      expect(formatDurationCompact(60), '1h');
      expect(formatDurationCompact(90), '1h'); // truncates, glance signal
      expect(formatDurationCompact(23 * 60), '23h');
    });

    test('days (>= 24h)', () {
      expect(formatDurationCompact(24 * 60), '1d');
      expect(formatDurationCompact(7 * 24 * 60), '7d');
      expect(formatDurationCompact(7 * 24 * 60 + 60), '7d');
    });
  });

  group('shortAuthorName', () {
    test('uses first token of displayName', () {
      expect(
        shortAuthorName(displayName: 'Priya Sharma'),
        'Priya',
      );
    });

    test('single-token displayName returned as-is', () {
      expect(shortAuthorName(displayName: 'Priya'), 'Priya');
    });

    test('falls back to @username when displayName empty', () {
      expect(
        shortAuthorName(displayName: '', username: 'priyas'),
        '@priyas',
      );
    });

    test('preserves existing @ prefix on username', () {
      expect(
        shortAuthorName(username: '@priyas'),
        '@priyas',
      );
    });

    test('returns "Creator" when both empty', () {
      expect(shortAuthorName(), 'Creator');
      expect(shortAuthorName(displayName: '', username: ''), 'Creator');
    });

    test('trims whitespace before picking first token', () {
      expect(
        shortAuthorName(displayName: '   Priya   Sharma'),
        'Priya',
      );
    });
  });
}
