'use client'

import { initializeApp, getApp, getApps } from 'firebase/app'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage'

interface UploadOpts {
  /** Folder path in the bucket — e.g. 'kyc/{userId}', 'covers/{userId}'. */
  path: string
  file: File | Blob
  contentType?: string
  /** Progress callback (0..1). */
  onProgress?: (progress: number) => void
}

function getStorageInstance() {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
  if (!apiKey || !authDomain || !projectId || !appId || !storageBucket) {
    return null
  }
  const app = getApps().length > 0 ? getApp() : initializeApp({ apiKey, authDomain, projectId, appId, storageBucket })
  return getStorage(app)
}

export function isStorageConfigured(): boolean {
  return getStorageInstance() !== null
}

/**
 * Upload to Firebase Storage and return the public download URL.
 * The bucket-side rules should restrict writes to authenticated users only;
 * the API independently re-validates by URL when it receives a submit.
 */
export async function uploadToStorage(opts: UploadOpts): Promise<string> {
  const storage = getStorageInstance()
  if (!storage) throw new Error('Firebase Storage not configured')
  const ts = Date.now().toString(36)
  const rand = Math.random().toString(36).slice(2, 8)
  const ext = guessExt(opts.file, opts.contentType)
  const fullPath = `${opts.path}/${ts}-${rand}${ext}`
  const r = ref(storage, fullPath)
  const snapshot = await uploadBytes(r, opts.file, {
    ...(opts.contentType !== undefined ? { contentType: opts.contentType } : {}),
  })
  return getDownloadURL(snapshot.ref)
}

function guessExt(file: File | Blob, contentType?: string): string {
  if (contentType?.includes('jpeg') || contentType?.includes('jpg')) return '.jpg'
  if (contentType?.includes('png')) return '.png'
  if (contentType?.includes('webp')) return '.webp'
  if (contentType?.includes('mp4')) return '.mp4'
  if (file instanceof File && file.name.includes('.')) {
    return `.${file.name.split('.').pop() ?? 'bin'}`
  }
  return ''
}

export async function dataUrlToBlob(dataUrl: string): Promise<Blob> {
  const res = await fetch(dataUrl)
  return res.blob()
}
