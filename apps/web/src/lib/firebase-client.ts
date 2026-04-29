'use client'

import { initializeApp, getApp, getApps, type FirebaseApp } from 'firebase/app'
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  getAuth,
  signInWithPhoneNumber,
  signInWithPopup,
  sendPasswordResetEmail,
  type Auth,
  type ConfirmationResult,
} from 'firebase/auth'

interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  appId: string
}

function readConfig(): FirebaseConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  if (!apiKey || !authDomain || !projectId || !appId) return null
  return { apiKey, authDomain, projectId, appId }
}

let cachedApp: FirebaseApp | null = null
let cachedAuth: Auth | null = null

export function isFirebaseConfigured(): boolean {
  return readConfig() !== null
}

function getFirebaseAuth(): Auth | null {
  if (typeof window === 'undefined') return null
  if (cachedAuth) return cachedAuth
  const cfg = readConfig()
  if (!cfg) return null
  cachedApp = getApps().length > 0 ? getApp() : initializeApp(cfg)
  cachedAuth = getAuth(cachedApp)
  return cachedAuth
}

let recaptcha: RecaptchaVerifier | null = null

/** Lazily mount an invisible reCAPTCHA. Reuses one verifier per page. */
function getRecaptcha(auth: Auth): RecaptchaVerifier {
  if (recaptcha) return recaptcha
  let container = document.getElementById('ch-recaptcha')
  if (!container) {
    container = document.createElement('div')
    container.id = 'ch-recaptcha'
    container.style.display = 'none'
    document.body.appendChild(container)
  }
  recaptcha = new RecaptchaVerifier(auth, 'ch-recaptcha', { size: 'invisible' })
  return recaptcha
}

export interface SendOtpResult {
  confirmation: ConfirmationResult
}

export async function sendPhoneOtp(phoneE164: string): Promise<SendOtpResult> {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error('Firebase not configured')
  const verifier = getRecaptcha(auth)
  const confirmation = await signInWithPhoneNumber(auth, phoneE164, verifier)
  return { confirmation }
}

export async function verifyPhoneOtp(
  confirmation: ConfirmationResult,
  code: string,
): Promise<string> {
  const cred = await confirmation.confirm(code)
  return cred.user.getIdToken()
}

export async function signInWithGoogle(): Promise<string> {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error('Firebase not configured')
  const provider = new GoogleAuthProvider()
  provider.addScope('email')
  provider.addScope('profile')
  const cred = await signInWithPopup(auth, provider)
  return cred.user.getIdToken()
}

export async function sendPasswordReset(email: string): Promise<void> {
  const auth = getFirebaseAuth()
  if (!auth) throw new Error('Firebase not configured')
  await sendPasswordResetEmail(auth, email)
}
