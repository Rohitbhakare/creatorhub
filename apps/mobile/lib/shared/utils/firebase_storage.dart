import 'dart:io';
import 'dart:typed_data';

import 'package:firebase_storage/firebase_storage.dart';

/// Upload a file to Firebase Storage and return the download URL.
///
/// [file] — the local file to upload
/// [path] — the full storage path, e.g. 'kyc/selfies/user123.jpg'
///
/// Throws [FirebaseException] on storage errors.
Future<String> uploadFile(File file, String path) async {
  final ref = FirebaseStorage.instance.ref().child(path);
  final uploadTask = ref.putFile(file);
  final snapshot = await uploadTask;
  final downloadUrl = await snapshot.ref.getDownloadURL();
  return downloadUrl;
}

/// Upload bytes to Firebase Storage and return the download URL.
///
/// [bytes] — the raw bytes to upload
/// [path] — the full storage path, e.g. 'kyc/pan/user123.jpg'
/// [contentType] — MIME type, e.g. 'image/jpeg'
///
/// Throws [FirebaseException] on storage errors.
Future<String> uploadBytes(
  List<int> bytes,
  String path, {
  String contentType = 'image/jpeg',
}) async {
  final ref = FirebaseStorage.instance.ref().child(path);
  final metadata = SettableMetadata(contentType: contentType);
  final uploadTask = ref.putData(Uint8List.fromList(bytes), metadata);
  final snapshot = await uploadTask;
  final downloadUrl = await snapshot.ref.getDownloadURL();
  return downloadUrl;
}
