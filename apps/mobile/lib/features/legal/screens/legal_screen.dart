import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';

import '../../../shared/theme/colors.dart';
import '../../../shared/theme/typography.dart';

/// LegalScreen — displays static policy text (Terms, Privacy Policy, etc.)
///
/// Accepts a [type] parameter that maps to one of the known legal content types.
/// Content is embedded inline (no network call) for MVP.
class LegalScreen extends StatelessWidget {
  final String type;

  const LegalScreen({super.key, required this.type});

  @override
  Widget build(BuildContext context) {
    final config = _legalContent[type] ?? _fallbackContent(type);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.surface,
        surfaceTintColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(
            PhosphorIcons.arrowLeft(PhosphorIconsStyle.regular),
            color: AppColors.ink,
            size: 22,
          ),
          onPressed: () {
            HapticFeedback.selectionClick();
            Navigator.of(context).pop();
          },
        ),
        title: Text(
          config.title,
          style: AppTypography.h4,
        ),
        centerTitle: false,
      ),
      body: SafeArea(
        child: SingleChildScrollView(
          padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 24),
          child: _LegalContent(sections: config.sections),
        ),
      ),
    );
  }
}

// ─── Legal content model ───────────────────────────────────────

class _LegalSection {
  final String? heading;
  final String body;
  const _LegalSection({this.heading, required this.body});
}

class _LegalConfig {
  final String title;
  final List<_LegalSection> sections;
  const _LegalConfig({required this.title, required this.sections});
}

// ─── Static content ───────────────────────────────────────────

_LegalConfig _fallbackContent(String type) {
  return _LegalConfig(
    title: _titleFromType(type),
    sections: const [
      _LegalSection(body: 'Content coming soon. Please check our website for the latest version.'),
    ],
  );
}

String _titleFromType(String type) {
  switch (type) {
    case 'terms':
      return 'Terms of Service';
    case 'privacy':
      return 'Privacy Policy';
    case 'guidelines':
      return 'Community Guidelines';
    default:
      return 'Legal';
  }
}

const Map<String, _LegalConfig> _legalContent = {
  'terms': _LegalConfig(
    title: 'Terms of Service',
    sections: [
      _LegalSection(
        body: 'Last updated: April 2026 · Version 1.0',
      ),
      _LegalSection(
        heading: '1. Acceptance of Terms',
        body:
            'By accessing or using CreatorHub ("the App"), you agree to be bound by these Terms of Service. If you do not agree, please do not use the App.',
      ),
      _LegalSection(
        heading: '2. Use of the Platform',
        body:
            'CreatorHub is a travel social platform and experience marketplace for India. You may use it to share travel content, book experiences, and connect with creators. You must be at least 18 years old to use the App.',
      ),
      _LegalSection(
        heading: '3. Content Ownership',
        body:
            'You retain ownership of content you post. By posting, you grant CreatorHub a non-exclusive licence to display and promote your content within the platform.',
      ),
      _LegalSection(
        heading: '4. Prohibited Conduct',
        body:
            'You may not use the App for any unlawful purpose, post false or misleading information, harass other users, or attempt to circumvent our booking or payment systems.',
      ),
      _LegalSection(
        heading: '5. Payments & Fees',
        body:
            'CreatorHub charges a 17% platform fee on paid bookings. GST (18%) is collected from buyers as applicable. Payments are processed via Razorpay. Creator payouts occur 48 hours after experience completion.',
      ),
      _LegalSection(
        heading: '6. Account Deletion',
        body:
            'You may request account deletion at any time. A 30-day grace period applies before data is permanently erased. You can cancel the deletion within this period. This right is provided under India\'s Digital Personal Data Protection Act, 2023.',
      ),
      _LegalSection(
        heading: '7. Limitation of Liability',
        body:
            'CreatorHub acts as a marketplace and is not responsible for the quality or safety of creator-offered experiences. Creators are solely responsible for their content and services.',
      ),
      _LegalSection(
        heading: '8. Governing Law',
        body:
            'These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bengaluru, Karnataka.',
      ),
      _LegalSection(
        heading: '9. Contact',
        body: 'Questions? Reach us at legal@creatorhub.in',
      ),
    ],
  ),
  'privacy': _LegalConfig(
    title: 'Privacy Policy',
    sections: [
      _LegalSection(
        body: 'Last updated: April 2026 · Version 1.0',
      ),
      _LegalSection(
        heading: '1. What We Collect',
        body:
            'We collect your phone number (for authentication), profile information you provide, content you create, booking details, device identifiers, and usage analytics.',
      ),
      _LegalSection(
        heading: '2. How We Use Your Data',
        body:
            'We use your data to provide and improve our services, process payments, send relevant notifications, ensure platform safety, and comply with Indian law (including DPDPA 2023).',
      ),
      _LegalSection(
        heading: '3. Data Storage',
        body:
            'Your data is stored on Supabase (PostgreSQL) hosted in India. Media files are stored on Firebase Storage. We use industry-standard encryption in transit (TLS) and at rest.',
      ),
      _LegalSection(
        heading: '4. Your Rights (DPDPA 2023)',
        body:
            'Under the Digital Personal Data Protection Act 2023, you have the right to:\n• Access your personal data (tap "Download your data" in Settings)\n• Correct inaccurate data\n• Request erasure ("Delete Account" in Settings, 30-day grace period)\n• Withdraw consent at any time',
      ),
      _LegalSection(
        heading: '5. Third Parties',
        body:
            'We share data with: Razorpay (payments), Firebase (auth/storage/notifications), Google Maps (location), MSG91 (SMS), SendGrid (email). We do not sell your data.',
      ),
      _LegalSection(
        heading: '6. Retention',
        body:
            'We retain your data for as long as your account is active. After deletion, data is purged within 30 days, except where retention is required by law (e.g., financial records for 7 years per Indian law).',
      ),
      _LegalSection(
        heading: '7. Contact',
        body:
            'Data Protection Officer: dpo@creatorhub.in\nAddress: CreatorHub Technologies Pvt. Ltd., Bengaluru, Karnataka, India',
      ),
    ],
  ),
  'guidelines': _LegalConfig(
    title: 'Community Guidelines',
    sections: [
      _LegalSection(
        body: 'Last updated: April 2026',
      ),
      _LegalSection(
        heading: 'Be Authentic',
        body:
            'Share real experiences. Do not post fabricated reviews, misleading prices, or fake availability. Creators must deliver what they promise in their listings.',
      ),
      _LegalSection(
        heading: 'Be Respectful',
        body:
            'Treat fellow travellers and creators with respect. Harassment, hate speech, and discrimination are strictly prohibited and will result in immediate account removal.',
      ),
      _LegalSection(
        heading: 'Keep it Safe',
        body:
            'Do not promote dangerous activities without appropriate safety warnings. Adventure experience creators must list all relevant risks and required skill levels.',
      ),
      _LegalSection(
        heading: 'No Spam',
        body:
            'Do not post duplicate content, buy followers, or use the platform for commercial solicitation outside of legitimate experience listings.',
      ),
      _LegalSection(
        heading: 'Respect Privacy',
        body:
            'Do not post photos or videos of identifiable individuals without their consent. Do not share personal contact details of other users.',
      ),
      _LegalSection(
        heading: 'Reporting',
        body:
            'Use the report button on any content that violates these guidelines. Our trust & safety team reviews all reports within 48 hours.',
      ),
    ],
  ),
};

// ─── Content Widget ────────────────────────────────────────────

class _LegalContent extends StatelessWidget {
  final List<_LegalSection> sections;
  const _LegalContent({required this.sections});

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: sections.map((section) => _SectionBlock(section: section)).toList(),
    );
  }
}

class _SectionBlock extends StatelessWidget {
  final _LegalSection section;
  const _SectionBlock({required this.section});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 20),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          if (section.heading != null) ...[
            Text(
              section.heading!,
              style: AppTypography.h4,
            ),
            const SizedBox(height: 8),
          ],
          Text(
            section.body,
            style: AppTypography.body.copyWith(
              color: section.heading == null ? AppColors.inkSoft : AppColors.ink,
              height: 1.6,
            ),
          ),
        ],
      ),
    );
  }
}
