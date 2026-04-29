/* CreatorHub — Web pack chrome + shared helpers
 * Used by all pack-w-*.jsx files. Single column, no side nav. */

const W_PHOTOS = {
  konkan: 'radial-gradient(ellipse at 25% 75%, rgba(0,30,60,0.32) 0%, transparent 45%), radial-gradient(ellipse at 70% 30%, rgba(255,180,90,0.35) 0%, transparent 55%), linear-gradient(180deg, #6e8aa0 0%, #b89a76 35%, #6e6452 65%, #2c2823 100%)',
  spiti: 'radial-gradient(ellipse at 50% 100%, rgba(80,40,20,0.55) 0%, transparent 60%), radial-gradient(ellipse at 30% 30%, rgba(255,200,140,0.45) 0%, transparent 50%), linear-gradient(180deg, #5b89c3 0%, #87a8c8 35%, #d8c4a6 60%, #b89a76 80%, #4a3a30 100%)',
  bhandar: 'radial-gradient(ellipse at 25% 75%, rgba(0,40,30,0.55) 0%, transparent 55%), radial-gradient(ellipse at 70% 25%, rgba(180,140,90,0.40) 0%, transparent 55%), linear-gradient(180deg, #4a6080 0%, #6e8a76 35%, #4a6048 60%, #2a3a30 100%)',
  velas: 'radial-gradient(ellipse at 50% 70%, rgba(80,60,40,0.55) 0%, transparent 60%), radial-gradient(ellipse at 50% 30%, rgba(255,200,140,0.45) 0%, transparent 60%), linear-gradient(180deg, #4a3024 0%, #8a6845 30%, #d8c4a6 60%, #b89a76 100%)',
  thane: 'radial-gradient(ellipse at 30% 50%, rgba(255,200,80,0.55) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(180,80,40,0.55) 0%, transparent 50%), linear-gradient(180deg, #6e4424 0%, #c8784a 30%, #d8a04a 60%, #8a5824 100%)',
  matheran: 'radial-gradient(ellipse at 30% 80%, rgba(40,60,40,0.55) 0%, transparent 55%), radial-gradient(ellipse at 70% 20%, rgba(220,200,160,0.45) 0%, transparent 50%), linear-gradient(180deg, #6a7a6a 0%, #8a9a82 30%, #4a6048 60%, #2a3828 100%)',
  bandra: 'radial-gradient(ellipse at 40% 80%, rgba(0,30,60,0.50) 0%, transparent 50%), radial-gradient(ellipse at 70% 25%, rgba(255,140,80,0.55) 0%, transparent 55%), linear-gradient(180deg, #6a4a60 0%, #b86850 35%, #d8a06a 60%, #6a4a4a 100%)',
  fishing: 'radial-gradient(ellipse at 50% 100%, rgba(0,30,60,0.55) 0%, transparent 55%), radial-gradient(ellipse at 30% 25%, rgba(220,140,80,0.45) 0%, transparent 55%), linear-gradient(180deg, #6e8aa0 0%, #4a6f55 40%, #2c4a3a 70%, #1a2820 100%)',
  ladakh: 'radial-gradient(ellipse at 50% 30%, rgba(180,210,255,0.40) 0%, transparent 55%), radial-gradient(ellipse at 25% 80%, rgba(180,90,50,0.50) 0%, transparent 55%), linear-gradient(180deg, #6a8db0 0%, #c8a890 40%, #8a6a52 70%, #3a2820 100%)',
  goa: 'radial-gradient(ellipse at 70% 70%, rgba(255,180,120,0.55) 0%, transparent 55%), radial-gradient(ellipse at 25% 30%, rgba(120,180,200,0.45) 0%, transparent 50%), linear-gradient(180deg, #5e90b0 0%, #c8a890 50%, #d8b890 80%, #6a4a30 100%)',
  monsoon: 'radial-gradient(ellipse at 30% 30%, rgba(120,140,160,0.55) 0%, transparent 55%), radial-gradient(ellipse at 70% 70%, rgba(80,100,80,0.55) 0%, transparent 55%), linear-gradient(180deg, #4a5660 0%, #6e7a72 35%, #4a5848 65%, #2a3028 100%)',
  hampi: 'radial-gradient(ellipse at 50% 70%, rgba(180,80,40,0.45) 0%, transparent 55%), radial-gradient(ellipse at 25% 30%, rgba(255,200,140,0.55) 0%, transparent 50%), linear-gradient(180deg, #b89a76 0%, #c8784a 40%, #8a5024 70%, #4a2818 100%)',
};

function WPhoto({ tk, k, h, w, children, style, dim = false }) {
  const { radius } = tk;
  return (
    <div style={{
      position: 'relative', height: h, width: w || 'auto', borderRadius: radius?.lg || 12,
      background: W_PHOTOS[k] || '#888',
      overflow: 'hidden',
      ...style,
    }}>
      {dim && <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.65) 100%)' }}/>}
      {children}
    </div>
  );
}

function WPill({ tk, kind = 'ink', children, size = 'md' }) {
  const { t, typ } = tk;
  const bg = kind === 'coral' ? t.primary : kind === 'glass' ? 'rgba(255,255,255,0.92)' : kind === 'tint' ? t.primaryTint : 'rgba(20,20,24,0.78)';
  const fg = kind === 'glass' ? t.ink : kind === 'tint' ? t.primaryDeep : '#fff';
  const padding = size === 'sm' ? '3px 8px' : '4px 9px';
  const fs = size === 'sm' ? 9.5 : 10;
  return <span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding, borderRadius: 999, background: bg, color: fg,
    fontFamily: typ.body, fontSize: fs, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
  }}>{children}</span>;
}

function WAvatar({ tk, initials, size = 28, gradient }) {
  const { typ } = tk;
  return (
    <div style={{
      width: size, height: size, borderRadius: 999,
      background: gradient || 'linear-gradient(135deg, #d4b896, #a07c5a)',
      color: '#fff',
      display: 'grid', placeItems: 'center',
      fontFamily: typ.display, fontWeight: 600, fontSize: size * 0.4,
      flex: '0 0 auto',
    }}>{initials}</div>
  );
}

const W_AVATARS = {
  AR: 'linear-gradient(135deg, #d4b896, #a07c5a)',
  DP: 'linear-gradient(135deg, #c8a677, #8a6845)',
  SK: 'linear-gradient(135deg, #b89a76, #d8c4a6)',
  VK: 'linear-gradient(135deg, #a08680, #6a4a40)',
  RM: 'linear-gradient(135deg, #c0a094, #8a6e62)',
  RB: 'linear-gradient(135deg, #d4b896, #a07c5a)',
  KS: 'linear-gradient(135deg, #b8a094, #6a544a)',
};

/* ──────────────────────────────────────────────────────────────
 * WebHeader — used on every authenticated screen (no side nav)
 * Variants:
 *   variant="auth"   — minimal: brand + "Sign in" only (onboarding)
 *   variant="logged" — full: brand, search, streak, notif, publish, avatar
 *   variant="solid"  — solid surface (for darker scroll states)
 * activeNav: 'home' | 'discover' | 'saved' | 'bookings' | null
 * ────────────────────────────────────────────────────────────── */
function WHeader({ tk, variant = 'logged', activeNav = 'home', solid = false, streak = 7 }) {
  const { t, typ, radius } = tk;

  const NavLink = ({ id, children }) => {
    const active = activeNav === id;
    return (
      <a href="#" style={{
        position: 'relative', padding: '8px 12px', borderRadius: radius.sm,
        fontFamily: typ.body, fontSize: 13.5, fontWeight: active ? 600 : 500,
        color: active ? t.ink : t.inkMuted, textDecoration: 'none', letterSpacing: '-0.005em',
      }}>
        {children}
        {active && <span style={{ position: 'absolute', left: 12, right: 12, bottom: -10, height: 2, background: t.primary, borderRadius: 999 }}/>}
      </a>
    );
  };

  return (
    <header style={{
      position: 'relative', zIndex: 30,
      background: solid ? t.surface : 'rgba(255,255,255,0.82)',
      backdropFilter: 'saturate(180%) blur(20px)', WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: `1px solid ${t.hairline}`,
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', gap: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          <div style={{ width: 8, height: 8, borderRadius: 999, background: t.primary }}/>
          <div style={{ fontFamily: typ.display, fontWeight: 600, fontSize: 22, letterSpacing: '-0.03em', color: t.ink, lineHeight: 1 }}>
            creator<em style={{ fontStyle: 'italic', color: t.primary }}>hub</em>
          </div>
        </div>

        {variant === 'logged' && (
          <>
            <nav style={{ display: 'flex', gap: 2, marginLeft: 6 }}>
              <NavLink id="home">Home</NavLink>
              <NavLink id="discover">Discover</NavLink>
              <NavLink id="saved">Saved</NavLink>
              <NavLink id="bookings">Bookings</NavLink>
            </nav>

            <div style={{
              flex: '1 1 auto', maxWidth: 380, height: 40, marginLeft: 'auto',
              background: t.surfaceAlt, borderRadius: 999, padding: '0 16px',
              display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
            }}>
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={t.inkMuted} strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              <span style={{ flex: 1, fontFamily: typ.body, fontSize: 13, color: t.inkMuted }}>Search creators, places, trips…</span>
              <span style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, padding: '2px 5px', borderRadius: 4, background: t.surface, border: `1px solid ${t.hairline}`, fontWeight: 500 }}>⌘ K</span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: '0 0 auto' }}>
              <div title={`${streak}-day streak`} style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '6px 11px 6px 8px', borderRadius: 999,
                background: t.primaryTint, color: t.primaryDeep,
                fontFamily: typ.body, fontSize: 12, fontWeight: 700,
                border: `1px solid ${t.primary}22`,
              }}>
                <span style={{ fontSize: 13, lineHeight: 1 }}>🔥</span>
                {streak}<span style={{ opacity: 0.65, fontWeight: 500 }}>d</span>
              </div>

              <button style={{
                position: 'relative', width: 38, height: 38, borderRadius: 999, border: 0,
                background: 'transparent', cursor: 'pointer', display: 'grid', placeItems: 'center',
              }}>
                <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                <span style={{ position: 'absolute', top: 8, right: 7, width: 7, height: 7, borderRadius: 999, background: t.primary, border: `2px solid ${t.surface}` }}/>
              </button>

              <button style={{
                background: t.ink, color: t.surface, border: 0,
                padding: '9px 14px 9px 12px', borderRadius: 999, cursor: 'pointer',
                fontFamily: typ.body, fontSize: 13, fontWeight: 600,
                display: 'flex', alignItems: 'center', gap: 6,
              }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Publish
              </button>

              <WAvatar tk={tk} initials="RB" size={34} gradient={W_AVATARS.RB}/>
            </div>
          </>
        )}

        {variant === 'auth' && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 14 }}>
            <a href="#" style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 500, color: t.inkSoft, textDecoration: 'none' }}>Browse stories</a>
            <button style={{
              background: 'transparent', color: t.ink, border: `1.5px solid ${t.hairlineStrong}`,
              padding: '8px 16px', borderRadius: 999, cursor: 'pointer',
              fontFamily: typ.body, fontSize: 13, fontWeight: 600,
            }}>Sign in</button>
          </div>
        )}
      </div>
    </header>
  );
}

/* ──────────────────────────────────────────────────────────────
 * WebFooter — minimal, used on every screen
 * ────────────────────────────────────────────────────────────── */
function WFooter({ tk, big = false }) {
  const { t, typ } = tk;
  if (big) {
    return (
      <footer style={{ marginTop: 80, padding: '60px 32px 40px', borderTop: `1px solid ${t.hairline}`, background: t.surface }}>
        <div style={{ maxWidth: 1240, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1fr 1fr', gap: 40 }}>
          <div>
            <div style={{ fontFamily: typ.display, fontWeight: 600, fontSize: 22, color: t.ink, letterSpacing: '-0.02em', marginBottom: 10 }}>
              creator<em style={{ fontStyle: 'italic', color: t.primary }}>hub</em>
            </div>
            <div style={{ fontFamily: typ.body, fontSize: 13, color: t.inkMuted, lineHeight: 1.55, marginBottom: 18, maxWidth: 280 }}>
              Travel stories worth saving. Travel plans worth booking. Made in Bengaluru, India.
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              {['IG', 'YT', 'X', 'WA'].map(s => (
                <div key={s} style={{ width: 32, height: 32, borderRadius: 8, background: t.surfaceAlt, display: 'grid', placeItems: 'center', fontFamily: typ.mono, fontSize: 10, fontWeight: 700, color: t.ink }}>{s}</div>
              ))}
            </div>
          </div>
          {[
            { h: 'Travelers', items: ['Discover', 'Stories', 'Itineraries', 'Experiences', 'Events'] },
            { h: 'Creators', items: ['Why CreatorHub', 'Earnings', 'Get verified', 'Help center'] },
            { h: 'Company', items: ['About', 'Press', 'Careers', 'Contact'] },
            { h: 'Legal', items: ['Terms', 'Privacy', 'Refunds', 'Trust & safety'] },
          ].map(col => (
            <div key={col.h}>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>{col.h}</div>
              {col.items.map(i => (
                <div key={i} style={{ marginBottom: 10, fontFamily: typ.body, fontSize: 13, color: t.inkSoft }}>{i}</div>
              ))}
            </div>
          ))}
        </div>
        <div style={{ maxWidth: 1240, margin: '36px auto 0', paddingTop: 20, borderTop: `1px solid ${t.hairline}`, display: 'flex', justifyContent: 'space-between', fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>
          <div>© 2026 CreatorHub Technologies Pvt Ltd · India · INR · UPI-first</div>
          <div>v2.4 · Pure white · Coral only</div>
        </div>
      </footer>
    );
  }
  return (
    <footer style={{ marginTop: 60, padding: '32px 32px 28px', borderTop: `1px solid ${t.hairline}`, background: t.surface }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ fontFamily: typ.display, fontWeight: 600, fontSize: 18, color: t.ink, letterSpacing: '-0.02em' }}>
          creator<em style={{ fontStyle: 'italic', color: t.primary }}>hub</em>
        </div>
        <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>
          Travel stories worth saving · Made in Bengaluru
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontFamily: typ.body, fontSize: 12, color: t.inkSoft }}>
          {['About', 'Creators', 'Press', 'Help', 'Privacy'].map(l => <a key={l} href="#" style={{ color: 'inherit', textDecoration: 'none' }}>{l}</a>)}
        </div>
      </div>
    </footer>
  );
}

/* ──────────────────────────────────────────────────────────────
 * Common buttons
 * ────────────────────────────────────────────────────────────── */
function WBtn({ tk, kind = 'ink', children, size = 'md', icon, full, ...rest }) {
  const { t, typ, radius } = tk;
  const sizes = {
    sm: { padding: '8px 14px', fs: 12 },
    md: { padding: '12px 18px', fs: 13.5 },
    lg: { padding: '14px 22px', fs: 14.5 },
  };
  const s = sizes[size];
  const styles = {
    ink: { bg: t.ink, fg: t.surface, br: 'transparent' },
    coral: { bg: t.primary, fg: '#fff', br: 'transparent' },
    outline: { bg: 'transparent', fg: t.ink, br: t.hairlineStrong },
    ghost: { bg: 'transparent', fg: t.ink, br: 'transparent' },
    surface: { bg: t.surface, fg: t.ink, br: t.hairlineStrong },
  }[kind];
  return (
    <button {...rest} style={{
      background: styles.bg, color: styles.fg, border: `1.5px solid ${styles.br}`,
      padding: s.padding, borderRadius: radius.md, cursor: 'pointer',
      fontFamily: typ.body, fontSize: s.fs, fontWeight: 600,
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
      width: full ? '100%' : 'auto',
      transition: 'transform 0.12s, background 0.12s',
      ...rest.style,
    }}>{icon}{children}</button>
  );
}

function WSection({ tk, kicker, title, sub, right, children, max = 1240, padTop = 40 }) {
  const { t, typ } = tk;
  return (
    <section style={{ maxWidth: max, margin: `${padTop}px auto 0`, padding: '0 32px' }}>
      {(kicker || title || right) && (
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 22, gap: 16 }}>
          <div>
            {kicker && <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>{kicker}</div>}
            {title && <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 28, fontWeight: 600, letterSpacing: '-0.015em', color: t.ink }}>{title}</h2>}
            {sub && <div style={{ marginTop: 6, fontFamily: typ.body, fontSize: 13.5, color: t.inkMuted }}>{sub}</div>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}

function WCard({ tk, children, padding = 24, style }) {
  const { t, radius } = tk;
  return (
    <div style={{
      background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg,
      padding, boxShadow: '0 1px 3px rgba(20,20,30,0.04)',
      ...style,
    }}>{children}</div>
  );
}

Object.assign(window, {
  W_PHOTOS, W_AVATARS,
  WPhoto, WPill, WAvatar,
  WHeader, WFooter,
  WBtn, WSection, WCard,
});
