'use client'

interface Props {
  draftId: string
  /** Bumped on every successful autosave so the iframe reloads with fresh content. */
  refreshToken: number | string
  /** Optional height; defaults to 600px. */
  height?: number
}

/**
 * Sandboxed iframe of `/preview/[draftId]` (E5.5 T7).
 *
 * The iframe is sandboxed to `allow-same-origin allow-scripts` so it can run
 * client-side framer-motion animations but **cannot** initiate top-level
 * navigations or open popups from within. Cookies are still sent so the
 * owner check works.
 */
export function PreviewIframe({ draftId, refreshToken, height = 600 }: Props) {
  return (
    <iframe
      title="Live preview"
      sandbox="allow-same-origin allow-scripts"
      src={`/preview/${encodeURIComponent(draftId)}?v=${String(refreshToken)}`}
      style={{
        width: '100%',
        height,
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--radius-md)',
        background: 'var(--surface)',
      }}
    />
  )
}
