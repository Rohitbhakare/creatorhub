import 'package:flutter/material.dart';

void main() {
  runApp(const CreatorHubApp());
}

class CreatorHubApp extends StatelessWidget {
  const CreatorHubApp({super.key});

  @override
  Widget build(BuildContext context) {
    return const MaterialApp(
      title: 'CreatorHub',
      debugShowCheckedModeBanner: false,
      home: Scaffold(
        body: Center(
          child: Text('CreatorHub'),
        ),
      ),
    );
  }
}
