import 'package:flutter/material.dart';
import 'package:shimmer/shimmer.dart';
import '../theme/colors.dart';
import '../theme/layout.dart';

/// Skeleton shimmer loading component.
/// ALWAYS use instead of ActivityIndicator/CircularProgressIndicator/spinner.
/// Shimmer: left-to-right sweep, ~1.6s cycle, Linen base, Stone highlight.
class SkeletonLoader extends StatelessWidget {
  final Widget child;

  const SkeletonLoader({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    return Shimmer.fromColors(
      baseColor: AppColors.shimmerBase,
      highlightColor: AppColors.shimmerHighlight,
      period: const Duration(milliseconds: 1600),
      child: child,
    );
  }
}

/// Skeleton text line — single line placeholder.
class SkeletonLine extends StatelessWidget {
  final double width;
  final double height;

  const SkeletonLine({
    super.key,
    this.width = double.infinity,
    this.height = 14,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      width: width,
      height: height,
      decoration: BoxDecoration(
        color: AppColors.shimmerBase,
        borderRadius: BorderRadius.circular(4),
      ),
    );
  }
}

/// Skeleton text block — multiple lines (80%, 100%, 60% width).
class SkeletonTextBlock extends StatelessWidget {
  final int lines;
  final double lineHeight;
  final double spacing;

  const SkeletonTextBlock({
    super.key,
    this.lines = 3,
    this.lineHeight = 14,
    this.spacing = 8,
  });

  @override
  Widget build(BuildContext context) {
    final widthFactors = [0.8, 1.0, 0.6, 0.9, 0.5];

    return SkeletonLoader(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: List.generate(lines, (i) {
          final factor = widthFactors[i % widthFactors.length];
          return Padding(
            padding: EdgeInsets.only(bottom: i < lines - 1 ? spacing : 0),
            child: FractionallySizedBox(
              widthFactor: factor,
              child: SkeletonLine(height: lineHeight),
            ),
          );
        }),
      ),
    );
  }
}

/// Skeleton circle — avatar placeholder.
class SkeletonCircle extends StatelessWidget {
  final double size;

  const SkeletonCircle({super.key, this.size = 40});

  @override
  Widget build(BuildContext context) {
    return SkeletonLoader(
      child: Container(
        width: size,
        height: size,
        decoration: const BoxDecoration(
          color: AppColors.shimmerBase,
          shape: BoxShape.circle,
        ),
      ),
    );
  }
}

/// Skeleton rectangle — image placeholder.
class SkeletonRect extends StatelessWidget {
  final double? width;
  final double height;
  final double borderRadius;

  const SkeletonRect({
    super.key,
    this.width,
    this.height = 120,
    this.borderRadius = 8,
  });

  @override
  Widget build(BuildContext context) {
    return SkeletonLoader(
      child: Container(
        width: width ?? double.infinity,
        height: height,
        decoration: BoxDecoration(
          color: AppColors.shimmerBase,
          borderRadius: BorderRadius.circular(borderRadius),
        ),
      ),
    );
  }
}

/// Skeleton content card — full card placeholder matching ContentCard layout.
class SkeletonCard extends StatelessWidget {
  const SkeletonCard({super.key});

  @override
  Widget build(BuildContext context) {
    return const SkeletonLoader(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Image
          SkeletonRect(
            height: 180,
            borderRadius: Layout.cardRadius,
          ),
          SizedBox(height: 10),
          // Title
          FractionallySizedBox(
            widthFactor: 0.7,
            child: SkeletonLine(height: 16),
          ),
          SizedBox(height: 8),
          // Creator row
          Row(
            children: [
              SkeletonCircle(size: 24),
              SizedBox(width: 8),
              Expanded(
                child: SkeletonLine(
                  width: 100,
                  height: 12,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }
}

/// Skeleton list — multiple card skeletons (default 3).
class SkeletonList extends StatelessWidget {
  final int itemCount;
  final double spacing;

  const SkeletonList({
    super.key,
    this.itemCount = 3,
    this.spacing = 16,
  });

  @override
  Widget build(BuildContext context) {
    return Column(
      children: List.generate(itemCount, (i) {
        return Padding(
          padding: EdgeInsets.only(bottom: i < itemCount - 1 ? spacing : 0),
          child: const SkeletonCard(),
        );
      }),
    );
  }
}
