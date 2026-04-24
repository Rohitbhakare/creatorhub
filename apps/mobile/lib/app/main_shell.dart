import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../shared/theme/colors.dart';
import '../shared/theme/typography.dart';

/// 5-tab bottom navigation shell.
///
/// Tabs: Home · Discover · Create · Saved · You.
/// Active tabs render a coral-tint pill behind the icon + coral label.
/// Bar sits on `surface` with a soft upward top-edge shadow.
class MainShell extends StatelessWidget {
  final int currentIndex;
  final Widget child;
  final void Function(int index) onTabTap;

  const MainShell({
    super.key,
    required this.currentIndex,
    required this.child,
    required this.onTabTap,
  });

  @override
  Widget build(BuildContext context) {
    final bottomPadding = MediaQuery.paddingOf(context).bottom;

    return Scaffold(
      body: child,
      bottomNavigationBar: DecoratedBox(
        decoration: const BoxDecoration(
          color: AppColors.surface,
          boxShadow: AppColors.bottomNavTopShadow,
        ),
        child: Padding(
          padding: EdgeInsets.only(bottom: bottomPadding),
          child: SizedBox(
            height: 68,
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                _TabItem(
                  icon: PhosphorIcons.house(PhosphorIconsStyle.regular),
                  activeIcon: PhosphorIcons.house(PhosphorIconsStyle.fill),
                  label: 'Home',
                  isActive: currentIndex == 0,
                  onTap: () => _handleTap(0),
                ),
                _TabItem(
                  icon:
                      PhosphorIcons.magnifyingGlass(PhosphorIconsStyle.regular),
                  activeIcon:
                      PhosphorIcons.magnifyingGlass(PhosphorIconsStyle.fill),
                  label: 'Discover',
                  isActive: currentIndex == 1,
                  onTap: () => _handleTap(1),
                ),
                _TabItem(
                  icon: PhosphorIcons.plusCircle(PhosphorIconsStyle.regular),
                  activeIcon: PhosphorIcons.plusCircle(PhosphorIconsStyle.fill),
                  label: 'Create',
                  isActive: currentIndex == 2,
                  onTap: () => _handleTap(2),
                ),
                _TabItem(
                  icon:
                      PhosphorIcons.bookmarkSimple(PhosphorIconsStyle.regular),
                  activeIcon:
                      PhosphorIcons.bookmarkSimple(PhosphorIconsStyle.fill),
                  label: 'Saved',
                  isActive: currentIndex == 3,
                  onTap: () => _handleTap(3),
                ),
                _TabItem(
                  icon: PhosphorIcons.user(PhosphorIconsStyle.regular),
                  activeIcon: PhosphorIcons.user(PhosphorIconsStyle.fill),
                  label: 'You',
                  isActive: currentIndex == 4,
                  onTap: () => _handleTap(4),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _handleTap(int index) {
    HapticFeedback.selectionClick();
    onTabTap(index);
  }
}

class _TabItem extends StatelessWidget {
  final IconData icon;
  final IconData activeIcon;
  final String label;
  final bool isActive;
  final VoidCallback onTap;

  const _TabItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
    required this.isActive,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final color = isActive ? AppColors.coral : AppColors.inkMuted;

    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 44,
              height: 26,
              alignment: Alignment.center,
              decoration: BoxDecoration(
                color: isActive ? AppColors.primaryTint : Colors.transparent,
                borderRadius: BorderRadius.circular(999),
              ),
              child: Icon(
                isActive ? activeIcon : icon,
                size: 20,
                color: color,
              ),
            ),
            const SizedBox(height: 4),
            Text(
              label,
              style: AppTypography.caption.copyWith(
                fontSize: 10,
                color: color,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w500,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
