'use client'

import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'
import Link from 'next/link'
import { useEffect, useState } from 'react'

interface GuestPromptBarProps {
  contentId: string
  creatorName: string
}

const DISMISS_KEY = 'ch_guest_prompt_dismissed'
const RESHOW_SCROLL_THRESHOLD = 0.5

/**
 * Sticky bottom prompt on content detail when there's no session.
 * Dismissible 1×; re-shows once the user has scrolled past 50% of the
 * page (per W1.3). Persists dismissal in sessionStorage.
 */
export function GuestPromptBar({ contentId, creatorName }: GuestPromptBarProps) {
  const reduced = useReducedMotion()
  const [visible, setVisible] = useState(true)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (sessionStorage.getItem(DISMISS_KEY) === '1') {
      setVisible(false)
      setDismissed(true)
    }
  }, [])

  useEffect(() => {
    if (!dismissed) return

    function onScroll() {
      const scrolled = window.scrollY / (document.body.scrollHeight - window.innerHeight)
      if (scrolled >= RESHOW_SCROLL_THRESHOLD) {
        setVisible(true)
      }
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
    }
  }, [dismissed])

  function dismiss() {
    sessionStorage.setItem(DISMISS_KEY, '1')
    setVisible(false)
    setDismissed(true)
  }

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={reduced ? { opacity: 0 } : { y: 80, opacity: 0 }}
          animate={reduced ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { y: 80, opacity: 0 }}
          transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          role="region"
          aria-label="Sign-in prompt"
          style={{
            position: 'fixed',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 40,
            background: 'var(--ink)',
            color: 'var(--surface)',
            boxShadow: '0 -8px 28px rgba(20,20,24,0.18)',
          }}
        >
          <div
            style={{
              maxWidth: 1240,
              margin: '0 auto',
              padding: '14px 32px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ flex: '1 1 240px', fontSize: 13.5, lineHeight: 1.5 }}>
              <strong style={{ fontWeight: 600 }}>Sign in</strong>
              <span style={{ opacity: 0.85 }}>
                {' '}
                to save chapters, follow {creatorName}, and book this trip.
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Link
                href={`/signin?next=/content/${contentId}`}
                className="ch-btn ch-btn-primary"
                style={{ padding: '10px 18px', fontSize: 13.5 }}
              >
                Sign in
              </Link>
              <Link
                href={`/signup?next=/content/${contentId}`}
                style={{
                  padding: '10px 16px',
                  fontSize: 13.5,
                  fontWeight: 600,
                  color: 'var(--surface)',
                  textDecoration: 'none',
                  border: '1.5px solid color-mix(in srgb, white 25%, transparent)',
                  borderRadius: 999,
                }}
              >
                Join free
              </Link>
              <button
                type="button"
                onClick={dismiss}
                aria-label="Dismiss"
                style={{
                  background: 'transparent',
                  border: 0,
                  color: 'var(--surface)',
                  opacity: 0.65,
                  fontSize: 18,
                  cursor: 'pointer',
                  padding: '0 6px',
                  marginLeft: 4,
                }}
              >
                ×
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
