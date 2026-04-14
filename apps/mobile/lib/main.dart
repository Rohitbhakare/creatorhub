import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'app/app.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  try {
    await Firebase.initializeApp();
  } catch (e) {
    // GoogleService-Info.plist / google-services.json not yet added.
    // App will boot for UI verification — auth features will not work.
    debugPrint('[Firebase] init skipped: $e');
  }
  runApp(const ProviderScope(child: CreatorHubApp()));
}
