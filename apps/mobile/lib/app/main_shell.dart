import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:phosphor_flutter/phosphor_flutter.dart';
import '../shared/theme/colors.dart';
import '../shared/theme/typography.dart';

/// 5-tab bottom navigation shell (DD-029).
/// Tabs: Home, Search, Create+, Studio, You.
/// Active tab = coral icon. Labels always visible.
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
      bottomNavigationBar: Container(
        decoration: const BoxDecoration(
          color: AppColors.white,
          border: Border(top: BorderSide(color: AppColors.border, width: 0.5)),
        ),
        padding: EdgeInsets.only(bottom: bottomPadding),
        child: SizedBox(
          height: 56,
          child: Row(
            children: [
              _TabItem(
                icon: PhosphorIcons.house(PhosphorIconsStyle.regular),
                activeIcon: PhosphorIcons.house(PhosphorIconsStyle.fill),
                label: 'Home',
                isActive: currentIndex == 0,
                onTap: () => _handleTap(0),
              ),
              _TabItem(
                icon: PhosphorIcons.magnifyingGlass(PhosphorIconsStyle.regular),
                activeIcon: PhosphorIcons.magnifyingGlass(PhosphorIconsStyle.fill),
                label: 'Search',
                isActive: currentIndex == 1,
                onTap: () => _handleTap(1),
              ),
              _CreateTab(
                onTap: () => _handleTap(2),
              ),
              _TabItem(
                icon: PhosphorIcons.squaresFour(PhosphorIconsStyle.regular),
                activeIcon: PhosphorIcons.squaresFour(PhosphorIconsStyle.fill),
                label: 'Studio',
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
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              isActive ? activeIcon : icon,
              size: 24,
              color: isActive ? AppColors.coral : AppColors.softInk,
            ),
            const SizedBox(height: 2),
            Text(
              label,
              style: AppTypography.caption.copyWith(
                fontSize: 10,
                color: isActive ? AppColors.coral : AppColors.softInk,
                fontWeight: isActive ? FontWeight.w600 : FontWeight.w400,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _CreateTab extends StatelessWidget {
  final VoidCallback onTap;
  const _CreateTab({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: GestureDetector(
        behavior: HitTestBehavior.opaque,
        onTap: onTap,
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 40,
              height: 32,
              decoration: BoxDecoration(
                color: AppColors.coral,
                borderRadius: BorderRadius.circular(10),
              ),
              child: const Icon(
                Icons.add_rounded,
                size: 22,
                color: AppColors.white,
              ),
            ),
            const SizedBox(height: 2),
            Text(
              'Create',
              style: AppTypography.caption.copyWith(
                fontSize: 10,
                color: AppColors.coral,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
