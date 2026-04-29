export default function Loading() {
  return (
    <div
      style={{
        minHeight: '40vh',
        display: 'grid',
        placeItems: 'center',
        padding: '32px',
      }}
      aria-busy
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: 'var(--ink-muted)' }}>
        <span
          style={{
            width: 14,
            height: 14,
            borderRadius: 999,
            border: '2px solid var(--hairline-strong)',
            borderTopColor: 'var(--primary)',
            animation: 'ch-spin 0.8s linear infinite',
            display: 'inline-block',
          }}
          aria-hidden
        />
        <span style={{ fontSize: 13 }}>Loading…</span>
        <style>{`@keyframes ch-spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    </div>
  )
}
