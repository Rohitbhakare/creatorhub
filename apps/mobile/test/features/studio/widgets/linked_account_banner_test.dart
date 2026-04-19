import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:creatorhub/features/studio/providers/linked_account_provider.dart';
import 'package:creatorhub/features/studio/widgets/linked_account_banner.dart';

Widget _wrap(Widget child) {
  return MaterialApp(home: Scaffold(body: child));
}

void main() {
  group('LinkedAccountBanner', () {
    testWidgets('shows activated state with masked account', (tester) async {
      const account = LinkedAccount(
        status: LinkedAccountStatus.activated,
        holderName: 'Asha Nair',
        bankAccountMasked: 'XXXXXX4321',
        bankIfsc: 'HDFC0001234',
      );
      await tester.pumpWidget(_wrap(const LinkedAccountBanner(account: account)));
      await tester.pump();

      expect(find.text('Payouts to XXXXXX4321'), findsOneWidget);
      expect(find.text('IFSC HDFC0001234'), findsOneWidget);
    });

    testWidgets('shows attention state when missing', (tester) async {
      const account = LinkedAccount();
      await tester.pumpWidget(_wrap(const LinkedAccountBanner(account: account)));
      await tester.pump();

      expect(find.text('Set up your bank account'), findsOneWidget);
    });

    testWidgets('shows needs-action state when rejected', (tester) async {
      const account = LinkedAccount(status: LinkedAccountStatus.rejected);
      await tester.pumpWidget(_wrap(const LinkedAccountBanner(account: account)));
      await tester.pump();

      expect(find.text('Your bank account needs attention'), findsOneWidget);
    });

    testWidgets('shows pending state while under review', (tester) async {
      const account = LinkedAccount(status: LinkedAccountStatus.underReview);
      await tester.pumpWidget(_wrap(const LinkedAccountBanner(account: account)));
      await tester.pump();

      expect(find.text('Bank setup in progress'), findsOneWidget);
    });

    testWidgets('calls onTapLearnMore when attention banner is tapped',
        (tester) async {
      var tapped = false;
      const account = LinkedAccount();
      await tester.pumpWidget(_wrap(LinkedAccountBanner(
        account: account,
        onTapLearnMore: () => tapped = true,
      )));
      await tester.pump();

      await tester.tap(find.text('Set up your bank account'));
      await tester.pump();
      expect(tapped, isTrue);
    });
  });
}
