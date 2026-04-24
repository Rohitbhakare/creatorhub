import { describe, it, expect } from 'vitest'
import {
  hashIdentifier,
  encryptBankAccount,
  decryptBankAccount,
} from './kyc-crypto.js'

describe('hashIdentifier', () => {
  it('returns a 64-char hex SHA-256 digest', () => {
    const h = hashIdentifier('ABCDE1234F')
    expect(h).toMatch(/^[0-9a-f]{64}$/)
  })

  it('is deterministic for the same input', () => {
    expect(hashIdentifier('ABCDE1234F')).toBe(hashIdentifier('ABCDE1234F'))
  })

  it('differs for different inputs', () => {
    expect(hashIdentifier('ABCDE1234F')).not.toBe(hashIdentifier('ABCDE1234G'))
  })

  it('never leaks the plaintext', () => {
    const pan = 'ABCDE1234F'
    const h = hashIdentifier(pan)
    expect(h.includes(pan)).toBe(false)
  })
})

describe('encryptBankAccount / decryptBankAccount', () => {
  it('round-trips a bank account number', () => {
    const account = '1234567890'
    const encrypted = encryptBankAccount(account)
    expect(decryptBankAccount(encrypted)).toBe(account)
  })

  it('produces iv:ciphertext:tag hex format', () => {
    const encrypted = encryptBankAccount('9876543210')
    expect(encrypted).toMatch(/^[0-9a-f]+:[0-9a-f]+:[0-9a-f]+$/)
  })

  it('produces a different ciphertext for the same plaintext (random IV)', () => {
    const e1 = encryptBankAccount('1234567890')
    const e2 = encryptBankAccount('1234567890')
    expect(e1).not.toBe(e2)
  })

  it('never leaks the plaintext into the ciphertext', () => {
    const account = '9876543210'
    const encrypted = encryptBankAccount(account)
    expect(encrypted.includes(account)).toBe(false)
  })

  it('throws on malformed input', () => {
    expect(() => decryptBankAccount('not-valid-format')).toThrow()
  })

  it('throws on tampered ciphertext (GCM tag check)', () => {
    const encrypted = encryptBankAccount('1234567890')
    const [iv, ct, tag] = encrypted.split(':')
    // Flip a bit in the ciphertext
    const tampered = `${iv!}:${ct!.slice(0, -2)}ff:${tag!}`
    expect(() => decryptBankAccount(tampered)).toThrow()
  })
})
