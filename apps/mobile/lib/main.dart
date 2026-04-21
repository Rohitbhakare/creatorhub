import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'app/app.dart';
import 'firebase_options.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  // Use Firebase Auth Emulator in debug — bypasses APNs/reCAPTCHA on simulators
  if (kDebugMode) {
    await FirebaseAuth.instance.useAuthEmulator('192.168.1.3', 9099);
  }

  runApp(const ProviderScope(child: CreatorHubApp()));
}
