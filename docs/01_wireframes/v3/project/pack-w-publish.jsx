/* CreatorHub — Web · Publishing wizard
 * 3-step composer: Outline → Stops → Publish */

/* W-P1 · Publish · Step 1 — outline & basics ───────────────── */
function W_PubOutline({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-pub-outline" label="W·E1 · Publish · Outline" width={1280} height={1500}>
      <div style={{ width: 1280, minHeight: 1500, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>
        <WPubChrome tk={tk} step={1}/>

        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 80px 80px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 48 }}>
          <div>
            <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>Step 1 of 3</div>
            <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 42, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05, color: t.ink }}>
              Sketch the <em style={{ fontStyle: 'italic', color: t.primary }}>outline.</em>
            </h1>
            <p style={{ marginTop: 10, marginBottom: 0, fontFamily: typ.body, fontSize: 15, color: t.inkSoft, maxWidth: 600 }}>
              The basics first — title, vibe, how long. You can rewrite anything in the next steps.
            </p>

            {/* Title */}
            <WPubField tk={tk} label="Title" hint="Concrete &gt; clever. ‘Konkan in 4 quiet days’ &gt; ‘A coastal escape’.">
              <input value="Konkan in 4 quiet days" readOnly style={W_INPUT(t, typ, true)}/>
              <div style={W_HINTBAR(t, typ)}>
                <span>26 / 60</span>
                <span style={{ color: '#1D9E75' }}>● Reads well in feeds</span>
              </div>
            </WPubField>

            {/* Subtitle */}
            <WPubField tk={tk} label="Subtitle / one-line pitch">
              <input value="A four-chapter, slow-pace itinerary along the Konkan coast — for the people who think weekends should feel longer." readOnly style={W_INPUT(t, typ)}/>
            </WPubField>

            {/* Cover */}
            <WPubField tk={tk} label="Cover photo" hint="Landscape works best. We auto-crop for the feed.">
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                <WPhoto tk={tk} k="konkan" h={200} style={{ borderRadius: radius.md, position: 'relative' }} dim>
                  <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 9px', borderRadius: 999, background: t.primary, color: '#fff', fontFamily: typ.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Cover</div>
                </WPhoto>
                <WPhoto tk={tk} k="fishing" h={200} style={{ borderRadius: radius.md }}/>
                <div style={{ height: 200, borderRadius: radius.md, border: `1.5px dashed ${t.hairlineStrong}`, background: t.surface, display: 'grid', placeItems: 'center', cursor: 'pointer' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ width: 36, height: 36, margin: '0 auto', borderRadius: 999, background: t.primaryTint, color: t.primary, display: 'grid', placeItems: 'center', fontSize: 18, fontWeight: 700 }}>+</div>
                    <div style={{ marginTop: 8, fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft, fontWeight: 500 }}>Add photo</div>
                  </div>
                </div>
              </div>
            </WPubField>

            {/* Region & duration */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <WPubField tk={tk} label="Region">
                <div style={{ ...W_INPUT(t, typ), display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 6, height: 6, borderRadius: 999, background: t.primary }}/>
                  Konkan coast · Maharashtra
                </div>
              </WPubField>
              <WPubField tk={tk} label="Duration">
                <div style={{ display: 'flex', gap: 8 }}>
                  <input value="9" readOnly style={{ ...W_INPUT(t, typ), width: 64, textAlign: 'center', fontFamily: typ.mono, fontSize: 18, fontWeight: 700 }}/>
                  <select disabled style={{ ...W_INPUT(t, typ), flex: 1, appearance: 'none', backgroundImage: `url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='10' height='6'><polyline points='1 1 5 5 9 1' fill='none' stroke='%23677' stroke-width='1.5'/></svg>")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
                    <option>days</option>
                  </select>
                </div>
              </WPubField>
            </div>

            {/* Vibe chips */}
            <WPubField tk={tk} label="Vibe — pick up to 3" hint="Helps us match readers and recommend you.">
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {[
                  { l: 'Slow & quiet', sel: true },
                  { l: 'Coastal', sel: true },
                  { l: 'Foodie', sel: true },
                  { l: 'Solo' },
                  { l: 'Couples' },
                  { l: 'Family' },
                  { l: 'Monsoon' },
                  { l: 'Heritage' },
                  { l: 'Adventure' },
                  { l: 'Photography' },
                  { l: 'Sunrise' },
                  { l: 'Sunset' },
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
            </WPubField>

            {/* Chapter outline */}
            <WPubField tk={tk} label="Chapter outline" hint="Drag to reorder. You'll fill stops + writing in step 2.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { n: 1, t: 'Mumbai → Alibaug · the soft start', est: '8 min · 4 stops' },
                  { n: 2, t: 'Murud-Janjira · the fort that stayed', est: '6 min · 3 stops' },
                  { n: 3, t: 'Harnai & Anjarle · fish, beach, repeat', est: '10 min · 5 stops' },
                  { n: 4, t: 'Ratnagiri → Mumbai · the long way home', est: '12 min · 6 stops' },
                ].map(c => (
                  <div key={c.n} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: 14, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.md }}>
                    <span style={{ color: t.inkMuted, cursor: 'grab' }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></svg>
                    </span>
                    <span style={{ width: 26, height: 26, borderRadius: 999, background: t.primaryTint, color: t.primaryDeep, display: 'grid', placeItems: 'center', fontFamily: typ.mono, fontSize: 12, fontWeight: 700 }}>{c.n}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink }}>{c.t}</div>
                      <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>{c.est}</div>
                    </div>
                    <span style={{ padding: '3px 8px', borderRadius: 999, background: '#FBE9C8', color: '#8A5B16', fontFamily: typ.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>DRAFT</span>
                  </div>
                ))}
                <button style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '12px', borderRadius: radius.md, border: `1.5px dashed ${t.hairlineStrong}`, background: 'transparent', cursor: 'pointer', fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.primary }}>
                  + Add chapter
                </button>
              </div>
            </WPubField>
          </div>

          {/* AI assist rail */}
          <aside style={{ position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
            <div style={{ background: t.ink, color: '#fff', borderRadius: radius.lg, padding: 22 }}>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>● Assistant</div>
              <div style={{ fontFamily: typ.display, fontSize: 19, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em' }}>Pre-fill from your camera roll</div>
              <p style={{ marginTop: 8, marginBottom: 14, fontFamily: typ.body, fontSize: 13, color: 'rgba(255,255,255,0.75)', lineHeight: 1.55 }}>
                Connect Google Photos and we'll suggest stops based on your geo-tagged photos from this trip.
              </p>
              <WBtn tk={tk} kind="coral" full size="sm">Connect Google Photos</WBtn>
              <div style={{ marginTop: 12, fontFamily: typ.body, fontSize: 11.5, color: 'rgba(255,255,255,0.55)', textAlign: 'center' }}>or paste a Google Maps timeline link</div>
            </div>

            <div style={{ marginTop: 14, padding: 18, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg }}>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Outline checks</div>
              {[
                { l: 'Title under 60 chars', ok: true },
                { l: 'Cover photo set', ok: true },
                { l: 'At least 3 chapters', ok: true },
                { l: '≥ 1 vibe selected', ok: true },
                { l: 'Region pinned', ok: true },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft }}>
                  <span style={{ width: 16, height: 16, borderRadius: 999, background: c.ok ? '#1D9E75' : t.surfaceAlt, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700 }}>{c.ok ? '✓' : ''}</span>
                  {c.l}
                </div>
              ))}
              <div style={{ marginTop: 12, padding: '10px 12px', background: t.primaryTint, borderRadius: radius.sm, fontFamily: typ.body, fontSize: 12, color: t.primaryDeep, fontWeight: 600 }}>
                Ready for step 2 →
              </div>
            </div>
          </aside>
        </div>

        <WPubFooter tk={tk} step={1}/>
      </div>
    </DCArtboard>
  );
}

/* W-P2 · Publish · Step 2 — chapter editor + map ───────────── */
function W_PubChapter({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-pub-chapter" label="W·E2 · Publish · Chapter editor" width={1280} height={1300}>
      <div style={{ width: 1280, minHeight: 1300, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>
        <WPubChrome tk={tk} step={2}/>

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 32px', display: 'grid', gridTemplateColumns: '220px 1fr 360px', gap: 0 }}>
          {/* Chapter list rail */}
          <aside style={{ paddingTop: 28, borderRight: `1px solid ${t.hairline}`, paddingRight: 16 }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Chapters · 4</div>
            {[
              { n: 1, t: 'Mumbai → Alibaug', state: 'editing' },
              { n: 2, t: 'Murud-Janjira', state: 'draft' },
              { n: 3, t: 'Harnai & Anjarle', state: 'draft' },
              { n: 4, t: 'Ratnagiri → Mumbai', state: 'empty' },
            ].map(c => (
              <button key={c.n} style={{
                display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                padding: '10px 12px', borderRadius: radius.md, marginBottom: 4, cursor: 'pointer',
                background: c.state === 'editing' ? t.surfaceAlt : 'transparent',
                border: 0, textAlign: 'left',
              }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: c.state === 'editing' ? t.primary : (c.state === 'draft' ? '#FBE9C8' : t.surfaceAlt), color: c.state === 'editing' ? '#fff' : (c.state === 'draft' ? '#8A5B16' : t.inkMuted), display: 'grid', placeItems: 'center', fontFamily: typ.mono, fontSize: 11, fontWeight: 700 }}>{c.n}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 12.5, fontWeight: c.state === 'editing' ? 700 : 500, color: t.ink }}>{c.t}</div>
                  <div style={{ fontFamily: typ.mono, fontSize: 9.5, color: t.inkMuted, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 1 }}>{c.state}</div>
                </div>
              </button>
            ))}
          </aside>

          {/* Editor */}
          <main style={{ padding: '28px 28px 0' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, marginBottom: 8 }}>
              <span style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Chapter 1</span>
              <span style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>· edited 2m ago · auto-saved</span>
            </div>
            <input value="Mumbai → Alibaug · the soft start" readOnly style={{ width: '100%', border: 0, background: 'transparent', fontFamily: typ.display, fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', color: t.ink, outline: 'none', padding: 0 }}/>

            {/* Inline toolbar */}
            <div style={{ marginTop: 18, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 4, padding: '8px 10px', background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.md, position: 'sticky', top: 80, zIndex: 5 }}>
              {[
                { l: 'B', s: { fontWeight: 700 } },
                { l: 'I', s: { fontStyle: 'italic' } },
                { l: 'H₁', s: {} },
                { l: 'H₂', s: {} },
                { l: '“ Quote', s: {} },
                { l: '🔗 Link', s: {} },
                { l: '📷 Photo', s: { color: t.primary, fontWeight: 700 } },
                { l: '📍 Stop', s: { color: t.primary, fontWeight: 700 } },
                { l: '💡 Tip', s: {} },
                { l: '— Divider', s: {} },
              ].map(b => (
                <button key={b.l} style={{ padding: '6px 11px', border: 0, borderRadius: 6, background: 'transparent', cursor: 'pointer', fontFamily: typ.body, fontSize: 13, color: t.inkSoft, ...b.s }}>{b.l}</button>
              ))}
              <span style={{ marginLeft: 'auto', fontFamily: typ.mono, fontSize: 10.5, color: t.inkMuted }}>1,247 / ~1,500 words · 8 min read</span>
            </div>

            {/* Editor body */}
            <article style={{ fontFamily: typ.serif, fontSize: 17, lineHeight: 1.65, color: t.inkSoft }}>
              <p style={{ margin: '0 0 18px' }}>The ferry from Gateway leaves at 6:30 am if you're sensible, and 9:15 am if you're not. I've been the second person twice and learned my lesson the third time.</p>

              <p style={{ margin: '0 0 18px' }}>By the time you're on the Mandwa side, the road has already changed its mind about being a road. It widens. It softens. The auto-rickshaws here drive like they have somewhere to be on Tuesday — which they probably don't.</p>

              {/* Active block: stop */}
              <div style={{
                margin: '24px 0', padding: 16, borderRadius: radius.lg,
                background: t.surface, border: `1.5px solid ${t.primary}`,
                boxShadow: `0 0 0 4px ${t.primaryTint}`,
                display: 'grid', gridTemplateColumns: '120px 1fr', gap: 14,
              }}>
                <WPhoto tk={tk} k="bhandar" h={120} style={{ borderRadius: radius.md }}/>
                <div>
                  <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>Stop · editing</div>
                  <input value="Kihim Beach · best at 6:30 am" readOnly style={{ width: '100%', border: 0, background: 'transparent', fontFamily: typ.display, fontSize: 18, fontWeight: 600, color: t.ink, padding: 0, outline: 'none' }}/>
                  <input value="Mr. Pendse's tea stall, 30m off the main beach" readOnly style={{ width: '100%', border: 0, background: 'transparent', fontFamily: typ.body, fontSize: 13, color: t.inkSoft, padding: '4px 0 0', outline: 'none' }}/>
                  <div style={{ marginTop: 10, display: 'flex', gap: 6 }}>
                    {['📍 Pin map', '⏱ 1.5 hr', '💰 Free', '☼ Morning'].map(p => (
                      <span key={p} style={{ padding: '3px 9px', borderRadius: 999, background: t.surfaceAlt, fontFamily: typ.mono, fontSize: 10, fontWeight: 600, color: t.inkSoft }}>{p}</span>
                    ))}
                  </div>
                </div>
              </div>

              <p style={{ margin: '0 0 18px' }}>You'll meet a dog. You always meet a dog. Mine was named Lata by the kids of the tea stall<span style={{ borderLeft: `2px solid ${t.primary}`, marginLeft: 1 }}/></p>

              <div style={{ padding: '12px 14px', background: t.primaryTint, borderRadius: radius.md, fontFamily: typ.body, fontSize: 12.5, color: t.primaryDeep, display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                <span>💡</span>
                <span><strong>Suggestion:</strong> add a "💡 Tip" block here about ferry timings — your readers will thank you.</span>
                <a style={{ marginLeft: 'auto', fontWeight: 700, color: t.primary }}>Add →</a>
              </div>
            </article>
          </main>

          {/* Map rail */}
          <aside style={{ borderLeft: `1px solid ${t.hairline}`, paddingTop: 28, paddingLeft: 20 }}>
            <div style={{ position: 'sticky', top: 96 }}>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Stops in this chapter · 4</div>

              <div style={{
                height: 280, borderRadius: radius.md, position: 'relative', overflow: 'hidden',
                background: 'linear-gradient(160deg, #f0ede4 0%, #e8e2d4 50%, #d8c8a8 100%)',
                border: `1px solid ${t.hairline}`,
              }}>
                <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.3 }}>
                  {[0, 40, 80, 120, 160, 200, 240].map(o => (
                    <path key={o} d={`M 0,${o} Q 100,${o + 20} 200,${o + 5} T 360,${o + 15}`} fill="none" stroke="#8a7a5a" strokeWidth="0.7" strokeDasharray="2,3"/>
                  ))}
                </svg>
                <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                  <path d="M 40,220 Q 100,180 160,140 Q 220,110 280,90" fill="none" stroke={t.primary} strokeWidth="2.5" strokeDasharray="5,3" strokeLinecap="round"/>
                </svg>
                {[
                  { x: 40, y: 220, n: 1 },
                  { x: 160, y: 140, n: 2, on: true },
                  { x: 220, y: 115, n: 3 },
                  { x: 280, y: 90, n: 4 },
                ].map(p => (
                  <div key={p.n} style={{ position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%,-50%)', width: p.on ? 30 : 22, height: p.on ? 30 : 22, borderRadius: 999, background: p.on ? t.primary : '#fff', color: p.on ? '#fff' : t.ink, border: p.on ? '3px solid #fff' : `2px solid ${t.primary}`, display: 'grid', placeItems: 'center', fontFamily: typ.mono, fontSize: 10, fontWeight: 700, boxShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>{p.n}</div>
                ))}
              </div>

              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { n: 1, t: 'Gateway → Mandwa ferry' },
                  { n: 2, t: 'Kihim Beach', on: true },
                  { n: 3, t: 'Akshi mango stall' },
                  { n: 4, t: 'Alibaug overnight' },
                ].map(s => (
                  <div key={s.n} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: radius.sm, background: s.on ? t.primaryTint : 'transparent', cursor: 'pointer' }}>
                    <span style={{ width: 18, height: 18, borderRadius: 999, background: s.on ? t.primary : t.surface, color: s.on ? '#fff' : t.inkSoft, border: s.on ? 0 : `1.5px solid ${t.hairlineStrong}`, display: 'grid', placeItems: 'center', fontFamily: typ.mono, fontSize: 9.5, fontWeight: 700 }}>{s.n}</span>
                    <span style={{ flex: 1, fontFamily: typ.body, fontSize: 12.5, fontWeight: s.on ? 700 : 500, color: t.ink }}>{s.t}</span>
                    <span style={{ color: t.inkMuted, fontSize: 14 }}>⋯</span>
                  </div>
                ))}
                <button style={{ marginTop: 4, padding: '8px', borderRadius: radius.sm, border: `1.5px dashed ${t.hairlineStrong}`, background: 'transparent', cursor: 'pointer', fontFamily: typ.body, fontSize: 12, fontWeight: 600, color: t.primary }}>+ Add stop</button>
              </div>
            </div>
          </aside>
        </div>

        <WPubFooter tk={tk} step={2}/>
      </div>
    </DCArtboard>
  );
}

/* W-P3 · Publish · Step 3 — pricing & visibility ──────────── */
function W_PubPublish({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-pub-publish" label="W·E3 · Publish · Pricing & visibility" width={1280} height={1400}>
      <div style={{ width: 1280, minHeight: 1400, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>
        <WPubChrome tk={tk} step={3}/>

        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 80px 80px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48 }}>
          <div>
            <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>Step 3 of 3</div>
            <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 42, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05, color: t.ink }}>
              Set the price, <em style={{ fontStyle: 'italic', color: t.primary }}>and ship.</em>
            </h1>

            {/* Mode picker */}
            <WPubField tk={tk} label="How will readers experience this?">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                {[
                  { l: 'Free to read', sub: 'Story · 0% cut', sel: false, icon: '📖' },
                  { l: 'Paid itinerary', sub: 'PDF unlock · 15% cut', sel: true, icon: '🗺️' },
                  { l: 'Bookable', sub: 'CreatorHub handles · 12% cut', sel: false, icon: '🎟️' },
                ].map(m => (
                  <button key={m.l} style={{
                    padding: 16, borderRadius: radius.md, cursor: 'pointer', textAlign: 'left',
                    background: m.sel ? t.primaryTint : t.surface,
                    border: m.sel ? `1.5px solid ${t.primary}` : `1.5px solid ${t.hairline}`,
                  }}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{m.icon}</div>
                    <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 700, color: m.sel ? t.primaryDeep : t.ink }}>{m.l}</div>
                    <div style={{ fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted, marginTop: 4 }}>{m.sub}</div>
                  </button>
                ))}
              </div>
            </WPubField>

            {/* Price */}
            <WPubField tk={tk} label="Price per person · INR" hint="Comparable creator itineraries: ₹26k – ₹54k.">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div style={{ ...W_INPUT(t, typ), display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px' }}>
                  <span style={{ fontFamily: typ.display, fontSize: 18, color: t.inkMuted }}>₹</span>
                  <input value="38,200" readOnly style={{ flex: 1, border: 0, background: 'transparent', outline: 'none', fontFamily: typ.display, fontSize: 26, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em', padding: 0 }}/>
                  <span style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>/ person</span>
                </div>
                <div style={{ padding: 14, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.md }}>
                  <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 4 }}>You take home</div>
                  <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: '#1D9E75', letterSpacing: '-0.015em' }}>₹32,470</div>
                  <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>after 15% platform · GST handled by us</div>
                </div>
              </div>

              {/* Smart hint */}
              <div style={{ marginTop: 10, padding: 12, background: '#F2F8F4', borderRadius: radius.sm, fontFamily: typ.body, fontSize: 12.5, color: '#225E47', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid #C8DDD0' }}>
                <span>📊</span>
                <span><strong>Sweet spot.</strong> Itineraries between ₹35k–₹42k convert 2.4× better than higher tiers. 18 of 24 trips at this price sold out last quarter.</span>
              </div>
            </WPubField>

            {/* Capacity */}
            <WPubField tk={tk} label="Group size">
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: 14, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.md }}>
                <span style={{ fontFamily: typ.body, fontSize: 13, color: t.inkSoft }}>Min</span>
                <span style={{ padding: '6px 14px', background: t.surfaceAlt, borderRadius: 8, fontFamily: typ.mono, fontSize: 14, fontWeight: 700, color: t.ink }}>2</span>
                <span style={{ flex: 1, height: 4, background: t.surfaceAlt, borderRadius: 999, position: 'relative', margin: '0 6px' }}>
                  <span style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '50%', background: t.primary, borderRadius: 999 }}/>
                  <span style={{ position: 'absolute', left: '20%', top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: 999, background: '#fff', border: `2px solid ${t.primary}` }}/>
                  <span style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 14, height: 14, borderRadius: 999, background: '#fff', border: `2px solid ${t.primary}` }}/>
                </span>
                <span style={{ padding: '6px 14px', background: t.surfaceAlt, borderRadius: 8, fontFamily: typ.mono, fontSize: 14, fontWeight: 700, color: t.ink }}>8</span>
                <span style={{ fontFamily: typ.body, fontSize: 13, color: t.inkSoft }}>Max</span>
              </div>
            </WPubField>

            {/* Visibility */}
            <WPubField tk={tk} label="Who can see it?">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { l: 'Public', sub: 'Anyone on CreatorHub · indexed by Google', icon: '🌍', sel: true },
                  { l: 'Followers only', sub: 'Just your 2.4k followers', icon: '👥', sel: false },
                  { l: 'Unlisted', sub: 'Only people with the link', icon: '🔗', sel: false },
                  { l: 'Draft', sub: 'Save for later', icon: '📝', sel: false },
                ].map(v => (
                  <label key={v.l} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: 14, borderRadius: radius.md, cursor: 'pointer', background: v.sel ? t.primaryTint : t.surface, border: v.sel ? `1.5px solid ${t.primary}` : `1px solid ${t.hairline}` }}>
                    <span style={{ fontSize: 20, width: 28 }}>{v.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: typ.body, fontSize: 13.5, fontWeight: 600, color: t.ink }}>{v.l}</div>
                      <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{v.sub}</div>
                    </div>
                    <span style={{ width: 18, height: 18, borderRadius: 999, background: v.sel ? t.primary : 'transparent', border: v.sel ? `5px solid ${t.primary}33` : `1.5px solid ${t.hairlineStrong}` }}/>
                  </label>
                ))}
              </div>
            </WPubField>

            {/* Schedule */}
            <WPubField tk={tk} label="When to publish">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                <button style={{ padding: 14, background: t.ink, color: '#fff', border: 0, borderRadius: radius.md, cursor: 'pointer', fontFamily: typ.body, fontSize: 13, fontWeight: 700 }}>Now</button>
                <button style={{ padding: 14, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.md, cursor: 'pointer', fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>Sat 6 am · best for Konkan</button>
                <button style={{ padding: 14, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.md, cursor: 'pointer', fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>Pick date…</button>
              </div>
            </WPubField>
          </div>

          {/* Live preview rail */}
          <aside style={{ position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Live preview · Feed card</div>
            <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg, overflow: 'hidden', boxShadow: '0 8px 28px rgba(20,20,30,0.06)' }}>
              <WPhoto tk={tk} k="konkan" h={200}/>
              <div style={{ padding: 16 }}>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  <WPill tk={tk} kind="tint">Itinerary</WPill>
                  <WPill tk={tk} kind="coral">Bookable · ₹38.2k</WPill>
                </div>
                <div style={{ fontFamily: typ.display, fontSize: 19, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em', lineHeight: 1.2 }}>Konkan in 4 quiet days</div>
                <div style={{ marginTop: 6, fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft }}>A four-chapter, slow-pace itinerary along the Konkan coast — for the people who think weekends should feel longer.</div>
                <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
                  <WAvatar tk={tk} initials="AR" size={26} gradient={W_AVATARS.AR}/>
                  <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.ink }}>Aanya Ravi · ★ 4.92</div>
                  <span style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted }}>9 days</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: 18, padding: 16, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg }}>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 10 }}>Pre-flight</div>
              {[
                { l: '4 chapters complete', ok: true },
                { l: '12 stops with photos', ok: true },
                { l: 'Cover + price set', ok: true },
                { l: 'KYC verified · payouts active', ok: true },
              ].map((c, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft }}>
                  <span style={{ width: 16, height: 16, borderRadius: 999, background: '#1D9E75', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700 }}>✓</span>
                  {c.l}
                </div>
              ))}
            </div>
          </aside>
        </div>

        <WPubFooter tk={tk} step={3}/>
      </div>
    </DCArtboard>
  );
}

/* shared chrome ──────────────────────────────── */
function WPubChrome({ tk, step }) {
  const { t, typ } = tk;
  const steps = [
    { n: 1, l: 'Outline' },
    { n: 2, l: 'Chapters & stops' },
    { n: 3, l: 'Price & ship' },
  ];
  return (
    <div style={{ borderBottom: `1px solid ${t.hairline}`, background: t.surface }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '14px 80px', display: 'flex', alignItems: 'center', gap: 24 }}>
        <a style={{ fontFamily: typ.body, fontSize: 13, color: t.inkSoft, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          Back to Studio
        </a>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 10, justifyContent: 'center' }}>
          {steps.map((s, i, arr) => (
            <React.Fragment key={s.n}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{
                  width: 24, height: 24, borderRadius: 999, display: 'grid', placeItems: 'center',
                  background: s.n === step ? t.ink : (s.n < step ? '#1D9E75' : t.surfaceAlt),
                  color: s.n === step || s.n < step ? '#fff' : t.inkMuted,
                  fontFamily: typ.mono, fontSize: 11, fontWeight: 700,
                }}>{s.n < step ? '✓' : s.n}</span>
                <span style={{ fontFamily: typ.body, fontSize: 12.5, fontWeight: s.n === step ? 700 : 500, color: s.n === step ? t.ink : t.inkMuted }}>{s.l}</span>
              </div>
              {i < arr.length - 1 && <div style={{ width: 32, height: 1, background: t.hairline }}/>}
            </React.Fragment>
          ))}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>
          <span style={{ width: 6, height: 6, borderRadius: 999, background: '#1D9E75' }}/>
          Auto-saved 12s ago
        </div>
      </div>
    </div>
  );
}
function WPubField({ tk, label, hint, children }) {
  const { t, typ } = tk;
  return (
    <div style={{ marginTop: 24 }}>
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 8 }}>
        <label style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 700, color: t.ink }}>{label}</label>
        {hint && <span style={{ fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted }}>{hint}</span>}
      </div>
      {children}
    </div>
  );
}
function WPubFooter({ tk, step }) {
  const { t, typ } = tk;
  return (
    <div style={{ position: 'sticky', bottom: 0, borderTop: `1px solid ${t.hairline}`, background: 'rgba(255,255,255,0.95)', backdropFilter: 'blur(20px)', padding: '14px 80px' }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted }}>You're {step}/3 · est ~6 min remaining</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <WBtn tk={tk} kind="ghost" size="md">Save draft</WBtn>
          <WBtn tk={tk} kind="outline" size="md">Preview</WBtn>
          {step < 3 ? (
            <WBtn tk={tk} kind="ink" size="md">Continue · {step === 1 ? 'Chapters' : 'Price & ship'} →</WBtn>
          ) : (
            <WBtn tk={tk} kind="coral" size="md">Publish now</WBtn>
          )}
        </div>
      </div>
    </div>
  );
}
const W_INPUT = (t, typ, big) => ({
  width: '100%', padding: big ? '14px 16px' : '12px 14px',
  borderRadius: 10, border: `1.5px solid ${t.hairline}`, background: t.surface,
  fontFamily: typ.body, fontSize: big ? 16 : 14, color: t.ink, outline: 'none', fontWeight: 500,
});
const W_HINTBAR = (t, typ) => ({
  marginTop: 6, display: 'flex', justifyContent: 'space-between',
  fontFamily: typ.mono, fontSize: 10.5, color: t.inkMuted, fontWeight: 500,
});

Object.assign(window, { W_PubOutline, W_PubChapter, W_PubPublish });
