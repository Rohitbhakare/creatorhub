// KYC crypto helpers — used to satisfy the `kyc_submissions` schema
// requirements without storing PAN / Aadhaar / bank numbers in the
// clear (migration 009, DD-050 / DD-051 / DD-054).
//
// - `hashIdentifier`   SHA-256 one-way hash for pan_number_hash,
//                      aadhaar_number_hash. Never reversible.
// - `encryptBankAccount` / `decryptBankAccount`
//                      AES-256-GCM reversible encryption for bank
//                      account numbers (Razorpay payout requires the
//                      plaintext at payout time).
//
// Key comes from env.KYC_ENCRYPTION_KEY (64 hex chars). In dev the key
// may be absent — we fall back to a zero key so local inserts succeed.
// Production startup is expected to fail fast if the key is missing;
// enforcement lives in the deploy checklist, not in env.ts, because
// the API boots fine without it for mobile/admin flows that never
// touch bank numbers.

import { createHash, randomBytes, createCipheriv, createDecipheriv } from 'node:crypto'
import { env } from '../env.js'

const ALGORITHM = 'aes-256-gcm'
const IV_BYTES = 12
const TAG_BYTES = 16

function getKey(): Buffer {
  const hex = env.KYC_ENCRYPTION_KEY ?? '0'.repeat(64)
  return Buffer.from(hex, 'hex')
}

export function hashIdentifier(value: string): string {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

/**
 * Encrypt a bank account number. Returns `iv:ciphertext:tag` (all hex)
 * for storage as a single text column.
 */
export function encryptBankAccount(plaintext: string): string {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${ciphertext.toString('hex')}:${tag.toString('hex')}`
}

export function decryptBankAccount(encrypted: string): string {
  const parts = encrypted.split(':')
  if (parts.length !== 3) {
    throw new Error('Invalid encrypted bank account format')
  }
  const [ivHex, ctHex, tagHex] = parts as [string, string, string]
  const iv = Buffer.from(ivHex, 'hex')
  const ciphertext = Buffer.from(ctHex, 'hex')
  const tag = Buffer.from(tagHex, 'hex')
  const decipher = createDecipheriv(ALGORITHM, getKey(), iv)
  decipher.setAuthTag(tag)
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()])
  return plaintext.toString('utf8')
}
