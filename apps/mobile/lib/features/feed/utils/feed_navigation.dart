import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../models/feed_models.dart';

/// Route a FeedContentItem to its detail screen based on `type`.
/// Detail routes are already registered in app/router.dart.
void openFeedItem(BuildContext context, FeedContentItem item) {
  switch (item.type) {
    case 'post':
      context.push('/posts/${item.id}');
      break;
    case 'self_paced_itinerary':
    case 'itinerary':
      context.push('/itineraries/${item.id}');
      break;
    case 'scheduled_experience':
      context.push('/experiences/${item.id}');
      break;
    case 'event':
      context.push('/events/${item.id}');
      break;
    default:
      context.push('/posts/${item.id}');
  }
}
