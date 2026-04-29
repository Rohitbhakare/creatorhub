/* CreatorHub — Web · Discover, Search, Filter, Create
 * Single-column, magazine layout. */

/* W-D1 · Discover — masonry grid with vertical filter rail ── */
function W_Discover({ tk }) {
  const { t, typ, radius } = tk;
  const filters = [
    { id: 'all', label: 'All', count: 1420 },
    { id: 'stories', label: 'Stories', count: 642 },
    { id: 'itin', label: 'Itineraries', count: 318 },
    { id: 'exp', label: 'Experiences', count: 184 },
    { id: 'events', label: 'Events', count: 76 },
  ];
  const tags = ['Konkan', 'Spiti', 'Bandra', 'Slow travel', 'Solo', 'Monsoon', 'Foodie', 'Sunrise'];
  const tiles = [
    { kind: 'story', img: 'konkan', title: 'Konkan in 4 quiet days', author: 'Aanya Ravi', stat: '4 chapters · 12 min read', tag: 'Slow travel', span: 2, h: 320 },
    { kind: 'itin', img: 'spiti', title: 'The slow road through Spiti', author: 'Vikram K.', stat: '9 days · ₹38,200', tag: 'Biking', h: 320 },
    { kind: 'exp', img: 'thane', title: 'Mughlai by foot', author: 'Devansh P.', stat: '4 hrs · ₹950 · Sat', tag: 'Foodie', h: 220 },
    { kind: 'event', img: 'velas', title: 'Velas turtle festival', author: 'Konkan Trust', stat: 'Feb 14–28 · ₹1,200', tag: 'Wildlife', h: 220 },
    { kind: 'story', img: 'bandra', title: 'Mornings in Bandra', author: 'Saanvi K.', stat: '3 chapters · 8 min', tag: 'Photography', h: 260 },
    { kind: 'itin', img: 'matheran', title: 'Western Ghats weekend', author: 'Karthik S.', stat: '2 days · ₹4,800', tag: 'Trekking', h: 220 },
    { kind: 'story', img: 'goa', title: 'Off-season Goa', author: 'Riya M.', stat: '5 chapters · 18 min', tag: 'Offbeat', span: 2, h: 260 },
    { kind: 'exp', img: 'fishing', title: 'Dawn with the fishermen', author: 'Aanya Ravi', stat: '5 hrs · ₹1,400 · Daily', tag: 'Slow travel', h: 280 },
    { kind: 'story', img: 'monsoon', title: 'When the Ghats turn green', author: 'Karthik S.', stat: '6 chapters · 22 min', tag: 'Monsoon', h: 280 },
  ];
  return (
    <DCArtboard id="w-discover" label="W·B1 · Discover" width={1280} height={1500}>
      <div style={{ width: 1280, minHeight: 1500, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav="discover"/>
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '36px 32px 0' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10 }}>Discover</div>
          <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 56, lineHeight: 1.02, fontWeight: 600, letterSpacing: '-0.025em', color: t.ink }}>
            Stories worth <em style={{ fontStyle: 'italic', color: t.primary }}>your weekend.</em>
          </h1>
          <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14, fontFamily: typ.body, fontSize: 13.5, color: t.inkMuted }}>
            <span><strong style={{ color: t.ink }}>1,420</strong> from creators near Mumbai</span>
            <span>·</span>
            <span>Updated 4m ago</span>
            <span>·</span>
            <span style={{ color: t.primary, fontWeight: 600 }}>● Live</span>
          </div>
        </div>

        <div style={{ maxWidth: 1240, margin: '32px auto 0', padding: '0 32px', display: 'grid', gridTemplateColumns: '240px 1fr', gap: 28 }}>
          {/* Sidebar filter */}
          <aside style={{ position: 'sticky', top: 88, alignSelf: 'flex-start' }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Type</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginBottom: 28 }}>
              {filters.map(f => (
                <button key={f.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '10px 12px', borderRadius: radius.md, cursor: 'pointer',
                  background: f.id === 'all' ? t.surfaceAlt : 'transparent',
                  border: 0, fontFamily: typ.body, fontSize: 13.5,
                  color: f.id === 'all' ? t.ink : t.inkSoft,
                  fontWeight: f.id === 'all' ? 600 : 500,
                }}>
                  <span>{f.label}</span>
                  <span style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, fontWeight: 500 }}>{f.count}</span>
                </button>
              ))}
            </div>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Vibe</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 28 }}>
              {tags.map(tg => (
                <button key={tg} style={{
                  padding: '6px 11px', borderRadius: 999, cursor: 'pointer',
                  background: tg === 'Slow travel' ? t.ink : t.surface,
                  color: tg === 'Slow travel' ? t.surface : t.inkSoft,
                  border: tg === 'Slow travel' ? 0 : `1px solid ${t.hairline}`,
                  fontFamily: typ.body, fontSize: 11.5, fontWeight: 500,
                }}>{tg}</button>
              ))}
            </div>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Distance</div>
            <div style={{ background: t.surface, padding: 14, borderRadius: radius.md, border: `1px solid ${t.hairline}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: typ.body, fontSize: 12, color: t.inkSoft, marginBottom: 8 }}>
                <span>Within</span>
                <strong style={{ color: t.ink }}>6 hr drive</strong>
              </div>
              <div style={{ height: 4, background: t.surfaceAlt, borderRadius: 999, position: 'relative' }}>
                <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '60%', background: t.primary, borderRadius: 999 }}/>
                <div style={{ position: 'absolute', left: '60%', top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: 999, background: t.surface, border: `2px solid ${t.primary}`, boxShadow: '0 2px 6px rgba(0,0,0,0.1)' }}/>
              </div>
            </div>
            <a style={{ display: 'block', marginTop: 22, fontFamily: typ.body, fontSize: 12.5, color: t.primary, fontWeight: 600 }}>+ More filters</a>
          </aside>

          {/* Grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', gap: 6 }}>
                {['Trending', 'Recent', 'Near me', 'Top creators'].map((s, i) => (
                  <button key={s} style={{
                    padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
                    background: i === 0 ? t.primaryTint : 'transparent',
                    color: i === 0 ? t.primaryDeep : t.inkSoft,
                    border: i === 0 ? `1px solid ${t.primary}33` : `1px solid ${t.hairline}`,
                    fontFamily: typ.body, fontSize: 12.5, fontWeight: i === 0 ? 700 : 500,
                  }}>{s}</button>
                ))}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted }}>
                <span>View</span>
                <div style={{ display: 'flex', background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8 }}>
                  <button style={{ padding: '6px 10px', border: 0, background: t.ink, borderRadius: 6, cursor: 'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
                  </button>
                  <button style={{ padding: '6px 10px', border: 0, background: 'transparent', cursor: 'pointer' }}>
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={t.inkSoft} strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                  </button>
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, gridAutoFlow: 'dense' }}>
              {tiles.map((tile, i) => {
                const span = tile.span === 2 ? { gridColumn: 'span 2' } : {};
                const kindLabel = { story: 'Story', itin: 'Itinerary', exp: 'Experience', event: 'Event' }[tile.kind];
                return (
                  <div key={i} style={{ ...span, position: 'relative', cursor: 'pointer' }}>
                    <WPhoto tk={tk} k={tile.img} h={tile.h} dim style={{ borderRadius: radius.lg }}>
                      <div style={{ position: 'absolute', top: 12, left: 12, display: 'flex', gap: 6 }}>
                        <WPill tk={tk} kind="glass">{kindLabel}</WPill>
                        {tile.kind === 'exp' || tile.kind === 'event' ? <WPill tk={tk} kind="coral">Bookable</WPill> : null}
                      </div>
                      <button style={{ position: 'absolute', top: 12, right: 12, width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.92)', border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center', backdropFilter: 'blur(8px)' }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth="1.8"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
                      </button>
                      <div style={{ position: 'absolute', left: 14, right: 14, bottom: 12, color: '#fff' }}>
                        <div style={{ fontFamily: typ.display, fontSize: tile.span === 2 ? 24 : 18, fontWeight: 600, letterSpacing: '-0.01em', lineHeight: 1.15, textShadow: '0 1px 4px rgba(0,0,0,0.35)' }}>{tile.title}</div>
                        <div style={{ marginTop: 6, fontFamily: typ.body, fontSize: 12, opacity: 0.9, textShadow: '0 1px 3px rgba(0,0,0,0.35)' }}>{tile.author} · {tile.stat}</div>
                      </div>
                    </WPhoto>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: 24, textAlign: 'center' }}>
              <WBtn tk={tk} kind="outline" size="md">Load 24 more</WBtn>
            </div>
          </div>
        </div>
        <WFooter tk={tk}/>
      </div>
    </DCArtboard>
  );
}

/* W-D2 · Search overlay (focused command palette) ──────────── */
function W_Search({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-search" label="W·B2 · Search · live results" width={1280} height={760}>
      <div style={{ width: 1280, height: 760, background: t.bg, position: 'relative' }}>
        {/* dimmed page behind */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.25, filter: 'blur(2px)' }}>
          <WHeader tk={tk} variant="logged" activeNav="home"/>
          <div style={{ padding: '40px 80px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {['konkan', 'spiti', 'velas', 'matheran'].map(k => <WPhoto key={k} tk={tk} k={k} h={200} style={{ borderRadius: 16 }}/>)}
          </div>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,20,30,0.45)' }}/>

        {/* Command palette */}
        <div style={{
          position: 'relative', maxWidth: 720, margin: '90px auto 0',
          background: t.surface, borderRadius: radius.xl, overflow: 'hidden',
          boxShadow: '0 32px 80px rgba(20,20,30,0.4)', border: `1px solid ${t.hairline}`,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '20px 24px', borderBottom: `1px solid ${t.hairline}` }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={t.inkMuted} strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input readOnly value="kon" style={{ flex: 1, border: 0, background: 'transparent', fontFamily: typ.body, fontSize: 18, color: t.ink, outline: 'none', fontWeight: 500 }}/>
            <span style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, padding: '3px 7px', borderRadius: 5, background: t.surfaceAlt, fontWeight: 500 }}>esc</span>
          </div>

          <div style={{ padding: '14px 0' }}>
            {/* Group: Places */}
            <div style={{ padding: '6px 24px 6px', fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Places · 3</div>
            {[
              { name: 'Konkan coast', meta: 'Maharashtra · 142 stories', img: 'konkan' },
              { name: 'Konark, Odisha', meta: 'Sun temple · 8 stories', img: 'fishing' },
            ].map((r, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 14, padding: '10px 24px', cursor: 'pointer',
                background: i === 0 ? t.primaryTint : 'transparent',
              }}>
                <WPhoto tk={tk} k={r.img} h={44} style={{ width: 44, flex: '0 0 44px', borderRadius: radius.sm }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink }}><strong style={{ background: t.primaryTint, color: t.primaryDeep, padding: '0 2px', borderRadius: 2 }}>Kon</strong>{r.name.replace(/^Kon/i, '')}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 1 }}>{r.meta}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.inkMuted} strokeWidth="1.8"><polyline points="9 18 15 12 9 6"/></svg>
              </div>
            ))}

            <div style={{ padding: '14px 24px 6px', fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Stories · 28</div>
            {[
              { name: 'Konkan in 4 quiet days', meta: 'Aanya Ravi · 4 chapters', img: 'konkan' },
              { name: 'Konkan monsoon: my friend got stuck', meta: 'Devansh P. · 1 chapter', img: 'monsoon' },
              { name: 'A weekend at Konark in February', meta: 'Saanvi K. · 6 chapters', img: 'thane' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 24px', cursor: 'pointer' }}>
                <WPhoto tk={tk} k={r.img} h={44} style={{ width: 44, flex: '0 0 44px', borderRadius: radius.sm }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 500, color: t.ink }}><strong style={{ background: t.primaryTint, color: t.primaryDeep, padding: '0 2px', borderRadius: 2 }}>Kon</strong>{r.name.replace(/^Kon/i, '')}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 1 }}>{r.meta}</div>
                </div>
              </div>
            ))}

            <div style={{ padding: '14px 24px 6px', fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Creators · 4</div>
            {[
              { name: 'Konkan Local', meta: '@konkanlocal · 8.4k followers', id: 'AR' },
              { name: 'Konkan Coast Co.', meta: 'Trust · 12 experiences', id: 'DP' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 24px', cursor: 'pointer' }}>
                <WAvatar tk={tk} initials={r.id} size={36} gradient={W_AVATARS[r.id]}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 500, color: t.ink }}><strong style={{ background: t.primaryTint, color: t.primaryDeep, padding: '0 2px', borderRadius: 2 }}>Kon</strong>{r.name.replace(/^Kon/i, '')}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>{r.meta}</div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 24px', borderTop: `1px solid ${t.hairline}`, background: t.surfaceAlt, fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted }}>
            <div style={{ display: 'flex', gap: 18 }}>
              <span><span style={{ fontFamily: typ.mono, padding: '2px 5px', borderRadius: 4, background: t.surface, border: `1px solid ${t.hairline}`, fontWeight: 500, marginRight: 5 }}>↑↓</span>navigate</span>
              <span><span style={{ fontFamily: typ.mono, padding: '2px 5px', borderRadius: 4, background: t.surface, border: `1px solid ${t.hairline}`, fontWeight: 500, marginRight: 5 }}>↵</span>open</span>
              <span><span style={{ fontFamily: typ.mono, padding: '2px 5px', borderRadius: 4, background: t.surface, border: `1px solid ${t.hairline}`, fontWeight: 500, marginRight: 5 }}>⇧↵</span>save</span>
            </div>
            <span>35 results · 28ms</span>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

/* W-D3 · Filter sheet (advanced filter modal) ──────────────── */
function W_Filter({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-filter" label="W·B3 · Advanced filter modal" width={1280} height={820}>
      <div style={{ width: 1280, height: 820, background: t.bg, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.2, filter: 'blur(3px)' }}>
          <WHeader tk={tk} variant="logged" activeNav="discover"/>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,20,30,0.5)' }}/>

        <div style={{
          position: 'relative', maxWidth: 980, margin: '60px auto 0',
          background: t.surface, borderRadius: radius.xl, overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(20,20,30,0.4)',
        }}>
          <div style={{ padding: '24px 32px', borderBottom: `1px solid ${t.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>Filter</div>
              <div style={{ fontFamily: typ.display, fontSize: 24, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>Tune what you see</div>
            </div>
            <button style={{ width: 36, height: 36, borderRadius: 999, border: 0, background: t.surfaceAlt, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style={{ padding: 32, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 36 }}>
            {/* Left col */}
            <div>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Type of content</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 30 }}>
                {[
                  { l: 'Stories', icon: '📖', sel: true },
                  { l: 'Itineraries', icon: '🗺️', sel: true },
                  { l: 'Experiences', icon: '🎟️', sel: false },
                  { l: 'Events', icon: '📅', sel: false },
                ].map(c => (
                  <button key={c.l} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
                    borderRadius: radius.md, cursor: 'pointer', textAlign: 'left',
                    background: c.sel ? t.primaryTint : t.surface,
                    border: c.sel ? `1.5px solid ${t.primary}` : `1.5px solid ${t.hairline}`,
                  }}>
                    <span style={{ fontSize: 18 }}>{c.icon}</span>
                    <span style={{ fontFamily: typ.body, fontSize: 13.5, fontWeight: 600, color: c.sel ? t.primaryDeep : t.ink }}>{c.l}</span>
                    <span style={{ marginLeft: 'auto', width: 18, height: 18, borderRadius: 999, background: c.sel ? t.primary : 'transparent', border: c.sel ? 0 : `1.5px solid ${t.hairlineStrong}`, display: 'grid', placeItems: 'center' }}>
                      {c.sel && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2"><polyline points="20 6 9 17 4 12"/></svg>}
                    </span>
                  </button>
                ))}
              </div>

              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Distance from Mumbai</div>
              <div style={{ marginBottom: 30 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: typ.body, fontSize: 13, marginBottom: 10 }}>
                  <span style={{ color: t.inkSoft }}>Up to</span>
                  <strong style={{ color: t.ink, fontFamily: typ.mono }}>6 hr drive · ~400 km</strong>
                </div>
                <div style={{ height: 4, background: t.surfaceAlt, borderRadius: 999, position: 'relative' }}>
                  <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '60%', background: t.primary, borderRadius: 999 }}/>
                  <div style={{ position: 'absolute', left: '60%', top: '50%', transform: 'translate(-50%,-50%)', width: 18, height: 18, borderRadius: 999, background: t.surface, border: `2.5px solid ${t.primary}`, boxShadow: '0 4px 10px rgba(0,0,0,0.12)' }}/>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, marginTop: 6 }}>
                  <span>1h</span><span>3h</span><span>6h</span><span>12h</span><span>24h+</span>
                </div>
              </div>

              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Budget · INR</div>
              <div style={{ display: 'flex', gap: 8 }}>
                {['< 5k', '5–15k', '15–30k', '30–60k', '60k+'].map((b, i) => (
                  <button key={b} style={{
                    flex: 1, padding: '10px 6px', borderRadius: radius.md, cursor: 'pointer',
                    background: i === 1 ? t.ink : t.surface,
                    color: i === 1 ? t.surface : t.ink,
                    border: i === 1 ? 0 : `1.5px solid ${t.hairline}`,
                    fontFamily: typ.body, fontSize: 12.5, fontWeight: 600,
                  }}>{b}</button>
                ))}
              </div>
            </div>

            {/* Right col */}
            <div>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Vibes · pick any</div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 30 }}>
                {[
                  { l: 'Slow & quiet', sel: true },
                  { l: 'High octane', sel: false },
                  { l: 'Foodie', sel: true },
                  { l: 'Sunrise', sel: false },
                  { l: 'Sunset', sel: false },
                  { l: 'Solo', sel: true },
                  { l: 'With friends', sel: false },
                  { l: 'With kids', sel: false },
                  { l: 'Pet-friendly', sel: false },
                  { l: 'Monsoon', sel: false },
                  { l: 'Camping', sel: false },
                  { l: 'Heritage', sel: false },
                ].map(v => (
                  <button key={v.l} style={{
                    padding: '7px 13px', borderRadius: 999, cursor: 'pointer',
                    background: v.sel ? t.primary : t.surface,
                    color: v.sel ? '#fff' : t.inkSoft,
                    border: v.sel ? 0 : `1px solid ${t.hairline}`,
                    fontFamily: typ.body, fontSize: 12.5, fontWeight: v.sel ? 600 : 500,
                  }}>{v.sel && '✓ '}{v.l}</button>
                ))}
              </div>

              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>When</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 30 }}>
                {[
                  { l: 'This weekend', sub: '14–15 Feb' },
                  { l: 'Next weekend', sub: '21–22 Feb' },
                  { l: 'Long weekend', sub: 'Mar 1–3', sel: true },
                ].map(d => (
                  <button key={d.l} style={{
                    padding: '12px 14px', borderRadius: radius.md, cursor: 'pointer',
                    background: d.sel ? t.primaryTint : t.surface,
                    border: d.sel ? `1.5px solid ${t.primary}` : `1.5px solid ${t.hairline}`,
                    textAlign: 'left',
                  }}>
                    <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: d.sel ? t.primaryDeep : t.ink }}>{d.l}</div>
                    <div style={{ fontFamily: typ.mono, fontSize: 10.5, color: t.inkMuted, marginTop: 3 }}>{d.sub}</div>
                  </button>
                ))}
              </div>

              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Only show</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { l: 'Verified creators', on: true },
                  { l: 'Bookable now', on: true },
                  { l: 'Free cancel', on: false },
                  { l: 'In my saved lists already', on: false },
                ].map(s => (
                  <label key={s.l} style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer', padding: '6px 0' }}>
                    <span style={{
                      width: 36, height: 20, borderRadius: 999, position: 'relative',
                      background: s.on ? t.primary : t.surfaceAlt,
                      transition: 'background 0.2s',
                    }}>
                      <span style={{ position: 'absolute', top: 2, left: s.on ? 18 : 2, width: 16, height: 16, borderRadius: 999, background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', transition: 'left 0.2s' }}/>
                    </span>
                    <span style={{ fontFamily: typ.body, fontSize: 13.5, color: t.ink }}>{s.l}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div style={{ padding: '20px 32px', borderTop: `1px solid ${t.hairline}`, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <a style={{ fontFamily: typ.body, fontSize: 13, color: t.inkSoft, fontWeight: 500 }}>Reset all</a>
            <div style={{ display: 'flex', gap: 8 }}>
              <WBtn tk={tk} kind="outline" size="md">Cancel</WBtn>
              <WBtn tk={tk} kind="ink" size="md">Show 287 results</WBtn>
            </div>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

/* W-D4 · Create modal (publish kind picker) ────────────────── */
function W_Create({ tk }) {
  const { t, typ, radius } = tk;
  const kinds = [
    { id: 'story', icon: '📖', label: 'Story', sub: 'Free to read · 1–10 chapters · text + photos', stat: 'Avg 12 min · 28 stories live' },
    { id: 'itin', icon: '🗺️', label: 'Itinerary', sub: 'Day-by-day plan · stops + costs + tips', stat: 'Avg ₹38k earned · 9 itineraries live', primary: true },
    { id: 'exp', icon: '🎟️', label: 'Experience', sub: 'Bookable · half-day to multi-day · seat-hold', stat: '8 bookings/wk avg · KYC required' },
    { id: 'event', icon: '📅', label: 'Event', sub: 'Date-bound · Velas turtle festival, etc.', stat: 'Pre-reg or paid' },
  ];
  return (
    <DCArtboard id="w-create" label="W·B4 · Publish · pick a kind" width={1280} height={760}>
      <div style={{ width: 1280, height: 760, background: t.bg, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.2, filter: 'blur(3px)' }}>
          <WHeader tk={tk} variant="logged"/>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,20,30,0.5)' }}/>

        <div style={{
          position: 'relative', maxWidth: 880, margin: '70px auto 0',
          background: t.surface, borderRadius: radius.xl, padding: 36,
          boxShadow: '0 40px 100px rgba(20,20,30,0.4)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>New publication</div>
              <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 36, lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.02em', color: t.ink }}>
                What are you <em style={{ fontStyle: 'italic', color: t.primary }}>publishing</em> today?
              </h2>
              <p style={{ marginTop: 10, marginBottom: 0, fontFamily: typ.body, fontSize: 14, color: t.inkSoft, maxWidth: 560 }}>
                You can change kind later — but stops, dates and pricing transfer best between similar kinds.
              </p>
            </div>
            <button style={{ width: 36, height: 36, borderRadius: 999, border: 0, background: t.surfaceAlt, cursor: 'pointer', display: 'grid', placeItems: 'center', flex: '0 0 36px' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
            {kinds.map(k => (
              <button key={k.id} style={{
                position: 'relative', padding: 22, borderRadius: radius.lg, cursor: 'pointer', textAlign: 'left',
                background: k.primary ? t.primaryTint : t.surface,
                border: k.primary ? `2px solid ${t.primary}` : `1.5px solid ${t.hairline}`,
                boxShadow: k.primary ? '0 8px 24px rgba(225,90,65,0.2)' : '0 1px 3px rgba(20,20,30,0.04)',
              }}>
                {k.primary && (
                  <span style={{ position: 'absolute', top: 14, right: 14, padding: '3px 9px', borderRadius: 999, background: t.primary, color: '#fff', fontFamily: typ.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Recommended</span>
                )}
                <div style={{ width: 44, height: 44, borderRadius: radius.md, background: k.primary ? t.surface : t.surfaceAlt, display: 'grid', placeItems: 'center', fontSize: 22, marginBottom: 14 }}>{k.icon}</div>
                <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>{k.label}</div>
                <div style={{ marginTop: 6, fontFamily: typ.body, fontSize: 13, color: t.inkSoft, lineHeight: 1.45 }}>{k.sub}</div>
                <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${k.primary ? t.primary + '22' : t.hairline}`, fontFamily: typ.mono, fontSize: 10.5, color: k.primary ? t.primaryDeep : t.inkMuted, fontWeight: 600, letterSpacing: '0.05em' }}>{k.stat}</div>
              </button>
            ))}
          </div>

          <div style={{ marginTop: 22, padding: 14, background: t.surfaceAlt, borderRadius: radius.md, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 18 }}>💡</span>
            <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft, lineHeight: 1.5 }}>
              <strong style={{ color: t.ink }}>Drafting from a recent trip?</strong> Connect Google Photos and we'll pre-fill stops, dates and a chapter outline.
            </div>
            <WBtn tk={tk} kind="outline" size="sm">Connect</WBtn>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

Object.assign(window, { W_Discover, W_Search, W_Filter, W_Create });
