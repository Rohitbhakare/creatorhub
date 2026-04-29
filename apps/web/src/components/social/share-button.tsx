'use client'

import { useState } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface ShareButtonProps {
  url: string
  title: string
  text?: string
}

export function ShareButton({ url, title, text }: ShareButtonProps) {
  const reduced = useReducedMotion()
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)

  async function nativeShare() {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({
          title,
          url,
          ...(text !== undefined ? { text } : {}),
        })
        return
      } catch {
        /* user cancelled */
      }
    }
    setOpen(true)
  }

  function copy() {
    void navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => {
        setCopied(false)
      }, 1500)
    })
  }

  const fullUrl = typeof window !== 'undefined' ? new URL(url, window.location.origin).toString() : url
  const encoded = encodeURIComponent(fullUrl)
  const enctitle = encodeURIComponent(title)

  return (
    <>
      <button
        type="button"
        onClick={() => {
          void nativeShare()
        }}
        className="ch-btn ch-btn-ghost"
        aria-label="Share"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <circle cx="18" cy="5" r="3" />
          <circle cx="6" cy="12" r="3" />
          <circle cx="18" cy="19" r="3" />
          <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
          <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
        </svg>
        Share
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label="Share"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduced ? 0.1 : 0.18 }}
            onClick={() => {
              setOpen(false)
            }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 90,
              background: 'rgba(14, 15, 18, 0.55)',
              display: 'grid',
              placeItems: 'center',
              padding: 16,
            }}
          >
            <motion.div
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
              transition={{ duration: reduced ? 0.1 : 0.22 }}
              onClick={(e) => {
                e.stopPropagation()
              }}
              className="ch-card"
              style={{ width: '100%', maxWidth: 460, padding: 28 }}
            >
              <h2 className="ch-display" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 16 }}>
                Share this trip
              </h2>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  background: 'var(--surface-alt)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 16,
                }}
              >
                <span
                  style={{
                    flex: 1,
                    fontFamily: 'var(--font-mono)',
                    fontSize: 12,
                    color: 'var(--ink-soft)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {fullUrl}
                </span>
                <button
                  type="button"
                  onClick={copy}
                  className="ch-btn ch-btn-primary"
                  style={{ padding: '6px 12px', fontSize: 12 }}
                >
                  {copied ? 'Copied ✓' : 'Copy'}
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                <ShareTile
                  label="WhatsApp"
                  href={`https://wa.me/?text=${enctitle}%20${encoded}`}
                />
                <ShareTile
                  label="X"
                  href={`https://twitter.com/intent/tweet?text=${enctitle}&url=${encoded}`}
                />
                <ShareTile
                  label="Telegram"
                  href={`https://t.me/share/url?url=${encoded}&text=${enctitle}`}
                />
                <ShareTile label="Email" href={`mailto:?subject=${enctitle}&body=${encoded}`} />
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                }}
                className="ch-btn ch-btn-ghost"
                style={{ width: '100%', marginTop: 16 }}
              >
                Close
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

function ShareTile({ label, href }: { label: string; href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      style={{
        padding: 14,
        background: 'var(--surface-alt)',
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
        textDecoration: 'none',
        color: 'var(--ink)',
        fontSize: 12,
        fontWeight: 600,
      }}
    >
      {label}
    </a>
  )
}
