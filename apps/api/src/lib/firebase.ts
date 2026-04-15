import { initializeApp, cert, getApps } from 'firebase-admin/app'
import { getAuth } from 'firebase-admin/auth'
import { getMessaging } from 'firebase-admin/messaging'
import { env } from '../env.js'

// Initialize once — guard against hot-reload re-initialization
if (getApps().length === 0) {
  const emulatorHost = process.env.FIREBASE_AUTH_EMULATOR_HOST
  if (emulatorHost) {
    console.log(`🔐 Firebase Auth Emulator enabled: ${emulatorHost}`)
  }

  initializeApp({
    credential: cert({
      projectId: env.FIREBASE_PROJECT_ID,
      privateKey: env.FIREBASE_PRIVATE_KEY,
      clientEmail: env.FIREBASE_CLIENT_EMAIL,
    }),
  })
}

export const firebaseAuth = getAuth()
export const firebaseMessaging = getMessaging()
