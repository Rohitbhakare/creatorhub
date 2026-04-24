import 'package:flutter/material.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../providers/wizard_provider.dart';

class CreateTileSpec {
  final ContentType contentType;
  final String title;
  final String descriptor;
  final Color iconFill;
  final Color iconForeground;
  final IconData icon;
  final bool comingSoon;

  const CreateTileSpec({
    required this.contentType,
    required this.title,
    required this.descriptor,
    required this.iconFill,
    required this.iconForeground,
    required this.icon,
    this.comingSoon = false,
  });
}

const List<CreateTileSpec> kCreateTiles = [
  CreateTileSpec(
    contentType: ContentType.post,
    title: 'Post',
    descriptor: 'Share a story, photo, or moment',
    iconFill: Color(0xFFFAECE7),
    iconForeground: Color(0xFF993C1D),
    icon: PhosphorIconsRegular.pencilSimple,
  ),
  CreateTileSpec(
    contentType: ContentType.selfPacedItinerary,
    title: 'Itinerary',
    descriptor: 'Plan a route others can follow',
    iconFill: Color(0xFFE6F1FB),
    iconForeground: Color(0xFF0C447C),
    icon: PhosphorIconsRegular.mapTrifold,
  ),
  CreateTileSpec(
    contentType: ContentType.event,
    title: 'Event',
    descriptor: 'Host a meet-up or gathering',
    iconFill: Color(0xFFEAF3DE),
    iconForeground: Color(0xFF27500A),
    icon: PhosphorIconsRegular.calendarBlank,
  ),
  CreateTileSpec(
    contentType: ContentType.scheduledExperience,
    title: 'Experience',
    descriptor: 'Lead a paid tour. Arriving soon.',
    iconFill: Color(0xFFF3F3F3),
    iconForeground: AppColors.inkSoft,
    icon: PhosphorIconsRegular.compass,
    comingSoon: true,
  ),
];
