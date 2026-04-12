import 'package:intl/intl.dart' show NumberFormat, DateFormat;

/// Format price from paisa (integer) to display string.
/// Returns "FREE" for 0, "₹X,XXX" for positive amounts.
String formatPrice(int paisa) {
  if (paisa <= 0) return 'FREE';
  final rupees = paisa / 100;
  final formatter = NumberFormat('#,##,###', 'en_IN');
  if (rupees == rupees.truncateToDouble()) {
    return '₹${formatter.format(rupees.toInt())}';
  }
  return '₹${formatter.format(rupees)}';
}

/// Format duration in human-readable form.
/// "4 days", "2 hours", "30 min" — never raw minutes.
String formatDuration(int totalMinutes) {
  if (totalMinutes <= 0) return '0 min';

  final days = totalMinutes ~/ 1440;
  final hours = (totalMinutes % 1440) ~/ 60;
  final minutes = totalMinutes % 60;

  if (days > 0 && hours == 0 && minutes == 0) {
    return '$days ${days == 1 ? 'day' : 'days'}';
  }
  if (days > 0) {
    return '$days ${days == 1 ? 'day' : 'days'} ${hours}h';
  }
  if (hours > 0 && minutes == 0) {
    return '$hours ${hours == 1 ? 'hour' : 'hours'}';
  }
  if (hours > 0) {
    return '${hours}h ${minutes}min';
  }
  return '$minutes min';
}

/// Format date for display.
/// Today: "Today", Yesterday: "Yesterday", This year: "12 Mar", Older: "12 Mar 2025".
String formatDate(DateTime date) {
  final now = DateTime.now();
  final today = DateTime(now.year, now.month, now.day);
  final dateOnly = DateTime(date.year, date.month, date.day);
  final diff = today.difference(dateOnly).inDays;

  if (diff == 0) return 'Today';
  if (diff == 1) return 'Yesterday';
  if (date.year == now.year) {
    return DateFormat('d MMM').format(date);
  }
  return DateFormat('d MMM y').format(date);
}

/// Format relative time: "2m ago", "3h ago", "5d ago".
String formatTimeAgo(DateTime dateTime) {
  final diff = DateTime.now().difference(dateTime);

  if (diff.inSeconds < 60) return 'Just now';
  if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
  if (diff.inHours < 24) return '${diff.inHours}h ago';
  if (diff.inDays < 7) return '${diff.inDays}d ago';
  if (diff.inDays < 30) return '${diff.inDays ~/ 7}w ago';
  return formatDate(dateTime);
}
