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
              <h2 className="ch-display" style={{ fontSize: 22, color: 'var(--ink)', marginBottom: 6 }}>
                Share
              </h2>
              <p
                style={{
                  fontSize: 12,
                  color: 'var(--ink-muted)',
                  margin: 0,
                  marginBottom: 18,
                  fontFamily: 'var(--font-mono, var(--font-sans))',
                  letterSpacing: '0.04em',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {fullUrl}
              </p>
              {/* v3 W-S 4-icon row: WhatsApp / X / Facebook / Copy. */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
                <ShareTile
                  label="WhatsApp"
                  glyph="whatsapp"
                  href={`https://wa.me/?text=${enctitle}%20${encoded}`}
                />
                <ShareTile
                  label="X"
                  glyph="x"
                  href={`https://twitter.com/intent/tweet?text=${enctitle}&url=${encoded}`}
                />
                <ShareTile
                  label="Facebook"
                  glyph="facebook"
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encoded}`}
                />
                <ShareTile
                  label={copied ? 'Copied ✓' : 'Copy'}
                  glyph="link"
                  onClick={copy}
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                }}
                className="ch-btn ch-btn-ghost"
                style={{ width: '100%', marginTop: 18 }}
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

type Glyph = 'whatsapp' | 'x' | 'facebook' | 'link'

interface ShareTileProps {
  label: string
  glyph: Glyph
  href?: string
  onClick?: () => void
}

function ShareTile({ label, glyph, href, onClick }: ShareTileProps) {
  const inner = (
    <>
      <span
        aria-hidden
        style={{
          width: 36,
          height: 36,
          borderRadius: 999,
          background: 'var(--surface)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--ink)',
          marginBottom: 6,
        }}
      >
        <GlyphSvg glyph={glyph} />
      </span>
      <span style={{ display: 'block', fontSize: 11, fontWeight: 600 }}>{label}</span>
    </>
  )
  const baseStyle = {
    padding: 12,
    background: 'var(--surface-alt)',
    borderRadius: 'var(--radius-md)',
    textAlign: 'center' as const,
    textDecoration: 'none',
    color: 'var(--ink)',
    fontFamily: 'inherit',
    border: 'none',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} style={baseStyle} aria-label={label}>
        {inner}
      </button>
    )
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" style={baseStyle} aria-label={label}>
      {inner}
    </a>
  )
}

function GlyphSvg({ glyph }: { glyph: Glyph }) {
  switch (glyph) {
    case 'whatsapp':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.967-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51l-.57-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.065 2.876 1.213 3.074c.149.198 2.095 3.2 5.076 4.487.709.306 1.262.489 1.694.626.712.226 1.36.194 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.5c-1.81 0-3.575-.487-5.118-1.412L3 21l.985-3.825A9.43 9.43 0 0 1 2.5 12C2.5 6.753 6.753 2.5 12 2.5c2.55 0 4.94.99 6.74 2.79 1.8 1.8 2.79 4.19 2.79 6.74 0 5.247-4.253 9.5-9.48 9.5z" />
        </svg>
      )
    case 'x':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      )
    case 'facebook':
      return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      )
    case 'link':
      return (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
          <path d="M10 13a5 5 0 0 0 7.07 0l3-3a5 5 0 0 0-7.07-7.07l-1.41 1.41" />
          <path d="M14 11a5 5 0 0 0-7.07 0l-3 3a5 5 0 0 0 7.07 7.07l1.41-1.41" />
        </svg>
      )
  }
}
