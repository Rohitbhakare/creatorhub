/* CreatorHub — Web · Detail screens
 * Itinerary detail · Story reader · Experience · Save modal */

/* W-C1 · Itinerary detail — chapter-based ───────────────────── */
function W_Itinerary({ tk }) {
  const { t, typ, radius } = tk;
  const chapters = [
    { n: 1, title: 'Mumbai → Alibaug · the soft start', img: 'fishing', distance: '95 km · 3h via ferry', stops: 4, on: true },
    { n: 2, title: 'Murud-Janjira · the fort that stayed', img: 'velas', distance: '72 km · 2h coast road', stops: 3, on: false },
    { n: 3, title: 'Harnai & Anjarle · fish, beach, repeat', img: 'konkan', distance: '110 km · 3.5h ghats', stops: 5, on: false },
    { n: 4, title: 'Ratnagiri → Mumbai · the long way home', img: 'matheran', distance: '320 km · 7h with stops', stops: 6, on: false },
  ];
  return (
    <DCArtboard id="w-itin" label="W·C1 · Itinerary · chapter view" width={1280} height={2200}>
      <div style={{ width: 1280, minHeight: 2200, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>

        {/* Hero */}
        <WPhoto tk={tk} k="konkan" h={520} style={{ borderRadius: 0, position: 'relative' }} dim>
          <div style={{ position: 'absolute', top: 28, left: 32, right: 32, display: 'flex', justifyContent: 'space-between' }}>
            <a style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px 8px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', color: t.ink, fontFamily: typ.body, fontSize: 13, fontWeight: 600, backdropFilter: 'blur(8px)' }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="15 18 9 12 15 6"/></svg>
              Back to Discover
            </a>
            <div style={{ display: 'flex', gap: 8 }}>
              {['Save', 'Share', 'Print PDF'].map((l, i) => (
                <button key={l} style={{ padding: '8px 14px', borderRadius: 999, background: i === 0 ? t.primary : 'rgba(255,255,255,0.92)', color: i === 0 ? '#fff' : t.ink, border: 0, cursor: 'pointer', fontFamily: typ.body, fontSize: 13, fontWeight: 600, backdropFilter: 'blur(8px)' }}>{l}</button>
              ))}
            </div>
          </div>

          <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: '40px 80px', color: '#fff' }}>
            <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
              <WPill tk={tk} kind="glass">Itinerary</WPill>
              <WPill tk={tk} kind="glass">4 chapters · 9 days</WPill>
              <WPill tk={tk} kind="coral">Bookable</WPill>
            </div>
            <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 76, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 0.96, textShadow: '0 2px 16px rgba(0,0,0,0.35)' }}>
              The Konkan Coast,<br/>
              <em style={{ fontStyle: 'italic' }}>at walking pace.</em>
            </h1>
            <div style={{ marginTop: 24, display: 'flex', alignItems: 'center', gap: 16 }}>
              <WAvatar tk={tk} initials="AR" size={44} gradient={W_AVATARS.AR}/>
              <div>
                <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600 }}>Aanya Ravi · <span style={{ opacity: 0.85, fontWeight: 500 }}>Mumbai</span></div>
                <div style={{ fontFamily: typ.body, fontSize: 12, opacity: 0.85, marginTop: 2 }}>Verified · 18 published · 2.4k followers</div>
              </div>
              <button style={{ marginLeft: 16, padding: '8px 16px', borderRadius: 999, background: '#fff', color: t.ink, border: 0, cursor: 'pointer', fontFamily: typ.body, fontSize: 12.5, fontWeight: 700 }}>+ Follow</button>
            </div>
          </div>
        </WPhoto>

        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '40px 80px 0', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 56 }}>
          {/* Main column */}
          <div>
            {/* Stat row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0, padding: '22px 0', borderTop: `1px solid ${t.hairline}`, borderBottom: `1px solid ${t.hairline}` }}>
              {[
                { l: 'Distance', v: '~640 km', sub: 'looped' },
                { l: 'Best season', v: 'Nov–Feb', sub: 'avoid Jul' },
                { l: 'Pace', v: 'Slow', sub: '4h drive/day max' },
                { l: 'Budget', v: '₹38k', sub: 'all-in pp' },
              ].map((s, i) => (
                <div key={i} style={{ paddingLeft: i ? 24 : 0, borderLeft: i ? `1px solid ${t.hairline}` : 0 }}>
                  <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>{s.l}</div>
                  <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>{s.v}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Author note */}
            <div style={{ marginTop: 36, marginBottom: 36, padding: '28px 32px', borderLeft: `3px solid ${t.primary}`, background: t.surface, borderRadius: `0 ${radius.lg}px ${radius.lg}px 0` }}>
              <p style={{ margin: 0, fontFamily: typ.display, fontSize: 22, fontStyle: 'italic', fontWeight: 400, lineHeight: 1.45, color: t.ink, letterSpacing: '-0.005em' }}>
                "I wrote this after my fourth visit. Konkan rewards slow people. If you have a week, take ten days. If you have ten, take fourteen. The road won't budge — and that's the point."
              </p>
              <div style={{ marginTop: 14, fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted, fontWeight: 500 }}>— Aanya · Author note · written Nov 2025</div>
            </div>

            {/* Chapters */}
            <div style={{ marginBottom: 18, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 32, fontWeight: 600, letterSpacing: '-0.015em', color: t.ink }}>Four chapters, nine days</h2>
              <a style={{ fontFamily: typ.body, fontSize: 13, color: t.primary, fontWeight: 600 }}>Read all in order →</a>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {chapters.map(c => (
                <div key={c.n} style={{
                  display: 'grid', gridTemplateColumns: '180px 1fr auto', gap: 22, alignItems: 'center',
                  padding: 20, background: t.surface, borderRadius: radius.lg,
                  border: c.on ? `1.5px solid ${t.primary}` : `1px solid ${t.hairline}`,
                  boxShadow: c.on ? `0 0 0 3px ${t.primaryTint}` : '0 1px 3px rgba(20,20,30,0.04)',
                }}>
                  <WPhoto tk={tk} k={c.img} h={120} style={{ borderRadius: radius.md, position: 'relative' }} dim>
                    <div style={{ position: 'absolute', top: 10, left: 10, padding: '4px 9px', borderRadius: 999, background: 'rgba(255,255,255,0.95)', color: t.ink, fontFamily: typ.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>DAY {c.n}</div>
                  </WPhoto>
                  <div>
                    <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em', lineHeight: 1.15 }}>{c.title}</div>
                    <div style={{ marginTop: 8, display: 'flex', gap: 16, fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted }}>
                      <span>📍 {c.distance}</span>
                      <span>📌 {c.stops} stops</span>
                      {c.on && <span style={{ color: t.primary, fontWeight: 600 }}>● Reading</span>}
                    </div>
                    {c.on && (
                      <div style={{ marginTop: 12, height: 4, borderRadius: 999, background: t.surfaceAlt, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: '64%', background: t.primary, borderRadius: 999 }}/>
                      </div>
                    )}
                  </div>
                  <button style={{
                    padding: '11px 18px', borderRadius: radius.md, cursor: 'pointer',
                    background: c.on ? t.ink : t.surface,
                    color: c.on ? t.surface : t.ink,
                    border: c.on ? 0 : `1.5px solid ${t.hairlineStrong}`,
                    fontFamily: typ.body, fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', gap: 6,
                  }}>
                    {c.on ? 'Continue' : 'Read'}
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6"/></svg>
                  </button>
                </div>
              ))}
            </div>

            {/* Map preview */}
            <div style={{ marginTop: 40, marginBottom: 12, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
              <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 28, fontWeight: 600, letterSpacing: '-0.015em', color: t.ink }}>The route</h2>
              <a style={{ fontFamily: typ.body, fontSize: 13, color: t.primary, fontWeight: 600 }}>Open in Maps →</a>
            </div>
            <div style={{
              height: 320, borderRadius: radius.lg, overflow: 'hidden', position: 'relative',
              background: 'linear-gradient(160deg, #f0ede4 0%, #e8e2d4 50%, #d8c8a8 100%)',
              border: `1px solid ${t.hairline}`,
            }}>
              {/* Topographic dotted lines */}
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
                {[0, 30, 60, 90, 120, 150, 180, 210, 240].map(o => (
                  <path key={o} d={`M 0,${o} Q 200,${o + 30} 400,${o + 10} T 800,${o - 5} T 1180,${o + 20}`} fill="none" stroke="#8a7a5a" strokeWidth="0.7" strokeDasharray="2,3"/>
                ))}
              </svg>
              {/* Route path */}
              <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
                <path d="M 80,260 Q 200,200 320,180 Q 460,160 560,140 Q 700,120 820,170 Q 940,220 1080,200" fill="none" stroke={t.primary} strokeWidth="3" strokeDasharray="6,4" strokeLinecap="round"/>
              </svg>
              {/* Pins */}
              {[
                { x: 80, y: 260, l: 'Mumbai', d: 1 },
                { x: 320, y: 180, l: 'Murud', d: 2 },
                { x: 560, y: 140, l: 'Harnai', d: 3 },
                { x: 820, y: 170, l: 'Ratnagiri', d: 4 },
                { x: 1080, y: 200, l: 'Mumbai', d: '↩' },
              ].map((p, i) => (
                <div key={i} style={{ position: 'absolute', left: p.x, top: p.y, transform: 'translate(-50%,-100%)' }}>
                  <div style={{ width: 28, height: 28, borderRadius: 999, background: t.primary, color: '#fff', fontFamily: typ.mono, fontSize: 12, fontWeight: 700, display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.2)', border: '2px solid #fff' }}>{p.d}</div>
                  <div style={{ marginTop: 4, padding: '3px 7px', background: '#fff', borderRadius: 4, fontFamily: typ.body, fontSize: 11, fontWeight: 600, color: t.ink, whiteSpace: 'nowrap', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }}>{p.l}</div>
                </div>
              ))}
            </div>

            {/* Reviews snippet */}
            <div style={{ marginTop: 56 }}>
              <h2 style={{ margin: '0 0 18px', fontFamily: typ.display, fontSize: 28, fontWeight: 600, letterSpacing: '-0.015em', color: t.ink }}>What travellers said</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {[
                  { id: 'DP', name: 'Devansh', meta: 'Travelled Dec 2025', q: 'I followed this almost exactly. The Murud-Janjira chapter is gold. The author was right — slow it down.', stars: 5 },
                  { id: 'SK', name: 'Saanvi', meta: 'Travelled Jan 2026', q: 'Did chapters 1–3 over a long weekend. Honest tips, no fluff. Booked the fishing experience separately, worth it.', stars: 5 },
                ].map((r, i) => (
                  <div key={i} style={{ padding: 22, background: t.surface, borderRadius: radius.lg, border: `1px solid ${t.hairline}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                      <WAvatar tk={tk} initials={r.id} size={36} gradient={W_AVATARS[r.id]}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: typ.body, fontSize: 13.5, fontWeight: 600, color: t.ink }}>{r.name}</div>
                        <div style={{ fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted }}>{r.meta}</div>
                      </div>
                      <div style={{ color: t.primary, fontFamily: typ.mono, fontSize: 13, fontWeight: 700 }}>{'★'.repeat(r.stars)}</div>
                    </div>
                    <p style={{ margin: 0, fontFamily: typ.body, fontSize: 14, color: t.inkSoft, lineHeight: 1.55 }}>"{r.q}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right rail · sticky CTA */}
          <aside style={{ position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
            <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg, padding: 22, boxShadow: '0 8px 24px rgba(20,20,30,0.06)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 6 }}>
                <span style={{ fontFamily: typ.display, fontSize: 32, fontWeight: 600, color: t.ink, letterSpacing: '-0.02em' }}>₹38,200</span>
                <span style={{ fontFamily: typ.body, fontSize: 13, color: t.inkMuted }}>per person, all-in</span>
              </div>
              <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginBottom: 18 }}>fuel · stays · food · creator's tip-jar</div>

              <WBtn tk={tk} kind="coral" full size="lg">
                Book this itinerary
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6"/></svg>
              </WBtn>
              <WBtn tk={tk} kind="outline" full size="md" style={{ marginTop: 8 }}>Save to a list</WBtn>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.hairline}`, fontFamily: typ.body, fontSize: 12, color: t.inkMuted, lineHeight: 1.6 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Free cancel</span><strong style={{ color: t.ink }}>up to 7 days before</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span>Pay</span><strong style={{ color: t.ink }}>UPI · cards · split</strong></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}><span>Refund if creator cancels</span><strong style={{ color: '#1D9E75' }}>100%</strong></div>
              </div>
            </div>

            {/* Add-on experience nudge */}
            <div style={{ marginTop: 14, background: t.primaryTint, borderRadius: radius.lg, padding: 16, border: `1px solid ${t.primary}33` }}>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primaryDeep, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8 }}>+ Add-on experience</div>
              <div style={{ display: 'flex', gap: 12 }}>
                <WPhoto tk={tk} k="fishing" h={64} style={{ width: 64, flex: '0 0 64px', borderRadius: radius.sm }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>Dawn with the fishermen</div>
                  <div style={{ fontFamily: typ.body, fontSize: 11.5, color: t.inkSoft }}>Day 3 · 5h · ₹1,400</div>
                </div>
              </div>
              <a style={{ display: 'block', marginTop: 10, fontFamily: typ.body, fontSize: 12, color: t.primary, fontWeight: 700 }}>+ Add to booking</a>
            </div>
          </aside>
        </div>
        <WFooter tk={tk}/>
      </div>
    </DCArtboard>
  );
}

/* W-C2 · Story reader — focused long-form ───────────────────── */
function W_Story({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-story" label="W·C2 · Story reader · chapter view" width={1280} height={1500}>
      <div style={{ width: 1280, minHeight: 1500, background: t.bg }}>
        {/* Reader chrome — minimal */}
        <header style={{
          position: 'sticky', top: 0, zIndex: 10, background: 'rgba(255,255,255,0.92)',
          backdropFilter: 'blur(20px)', borderBottom: `1px solid ${t.hairline}`,
          padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <a style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: typ.body, fontSize: 13, color: t.inkSoft, fontWeight: 500 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            All chapters
          </a>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
            <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>Day 1 of 4 · The Konkan Coast</div>
            <div style={{ width: 280, height: 3, background: t.surfaceAlt, borderRadius: 999, overflow: 'hidden' }}>
              <div style={{ width: '64%', height: '100%', background: t.primary, borderRadius: 999 }}/>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 6 }}>
            {['Aa', '🔖', '🔗'].map(b => (
              <button key={b} style={{ width: 36, height: 36, borderRadius: 999, border: 0, background: t.surfaceAlt, cursor: 'pointer', fontFamily: typ.display, fontSize: 14, fontWeight: 600, color: t.ink }}>{b}</button>
            ))}
          </div>
        </header>

        {/* Article */}
        <article style={{ maxWidth: 720, margin: '40px auto 0', padding: '0 32px' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 14 }}>Chapter 1 · Day 1</div>
          <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 56, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.02, color: t.ink }}>
            Mumbai → Alibaug:<br/>
            <em style={{ fontStyle: 'italic', color: t.primary }}>the soft start.</em>
          </h1>
          <div style={{ marginTop: 22, display: 'flex', alignItems: 'center', gap: 14, fontFamily: typ.body, fontSize: 13, color: t.inkMuted }}>
            <WAvatar tk={tk} initials="AR" size={32} gradient={W_AVATARS.AR}/>
            <span><strong style={{ color: t.ink }}>Aanya Ravi</strong> · 8 min read · Posted Nov 2025</span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 12 }}>
              <span>♥ 248</span>
              <span>💬 18</span>
            </span>
          </div>

          <WPhoto tk={tk} k="fishing" h={420} style={{ borderRadius: radius.lg, marginTop: 32, position: 'relative' }} dim>
            <div style={{ position: 'absolute', bottom: 14, left: 16, right: 16, color: '#fff', fontFamily: typ.body, fontSize: 12, fontStyle: 'italic', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              The Mandwa jetty at 6:48 am, before the second ferry of the day.
            </div>
          </WPhoto>

          <div style={{ marginTop: 36, fontFamily: typ.serif, fontSize: 19, lineHeight: 1.65, color: t.inkSoft, letterSpacing: '0.005em' }}>
            <p style={{ margin: '0 0 24px' }}>
              <span style={{ float: 'left', fontFamily: typ.display, fontSize: 76, lineHeight: 0.85, fontWeight: 600, color: t.primary, marginRight: 10, marginTop: 4 }}>T</span>
              he ferry from Gateway leaves at 6:30 am if you're sensible, and 9:15 am if you're not. I've been the second person twice and learned my lesson the third time. There's something about the city pulling away behind you and the salt picking up — Mumbai stops being Mumbai about ten minutes in.
            </p>
            <p style={{ margin: '0 0 24px' }}>
              By the time you're on the Mandwa side, the road has already changed its mind about being a road. It widens. It softens. The auto-rickshaws here drive like they have somewhere to be on Tuesday — which they probably don't.
            </p>

            <blockquote style={{
              margin: '36px 0', padding: '24px 28px', borderLeft: `3px solid ${t.primary}`,
              background: t.primaryTint, borderRadius: `0 ${radius.md}px ${radius.md}px 0`,
              fontFamily: typ.display, fontSize: 22, fontStyle: 'italic', fontWeight: 400, color: t.primaryDeep, lineHeight: 1.4, letterSpacing: '-0.005em',
            }}>
              "If you have a week, take ten days. The coast won't budge."
            </blockquote>

            <h2 style={{ fontFamily: typ.display, fontSize: 30, fontWeight: 600, letterSpacing: '-0.015em', color: t.ink, marginTop: 40, marginBottom: 12, lineHeight: 1.15 }}>
              Where to actually stop
            </h2>
            <p style={{ margin: '0 0 24px' }}>
              Skip the obvious sights. The locals will quietly tell you that Kihim is for the morning quiet and Akshi is for the afternoon mango shake — they're right. Park somewhere that isn't a parking lot. Walk for forty-five minutes.
            </p>

            {/* Pull-out card: a stop */}
            <div style={{ margin: '36px 0', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, background: t.surface, borderRadius: radius.lg, overflow: 'hidden', border: `1px solid ${t.hairline}` }}>
              <WPhoto tk={tk} k="bhandar" h={220} style={{ borderRadius: 0 }}/>
              <div style={{ padding: 22 }}>
                <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Stop · Kihim Beach</div>
                <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em', lineHeight: 1.15 }}>Best between 6:30 and 8 am</div>
                <div style={{ marginTop: 8, fontFamily: typ.body, fontSize: 13.5, color: t.inkSoft, lineHeight: 1.55 }}>Empty till the sun leans in. Local Mr. Pendse runs an unlabeled tea stall that has the best vada-pav for 30 km in any direction.</div>
                <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
                  <span style={{ padding: '4px 9px', borderRadius: 999, background: t.surfaceAlt, fontFamily: typ.mono, fontSize: 10, color: t.inkSoft, fontWeight: 600 }}>📍 Kihim, Alibaug</span>
                  <span style={{ padding: '4px 9px', borderRadius: 999, background: t.surfaceAlt, fontFamily: typ.mono, fontSize: 10, color: t.inkSoft, fontWeight: 600 }}>⏱ 1.5 hr</span>
                </div>
              </div>
            </div>

            <p style={{ margin: '0 0 24px' }}>
              You'll meet a dog. You always meet a dog. Mine was named Lata by the kids of the tea stall, after a singer who used to vacation here in the eighties. Don't feed her — she's been told.
            </p>
          </div>

          {/* Footer · chapter nav + reactions */}
          <div style={{ marginTop: 60, paddingTop: 36, borderTop: `1px solid ${t.hairline}` }}>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
              {['❤️ 248', '🔥 + Loved it', '🔖 Save', '↗ Share'].map((b, i) => (
                <button key={b} style={{ padding: '9px 18px', borderRadius: 999, border: `1.5px solid ${t.hairlineStrong}`, background: t.surface, cursor: 'pointer', fontFamily: typ.body, fontSize: 13, fontWeight: 500, color: t.ink, display: 'flex', alignItems: 'center', gap: 6 }}>{b}</button>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <a style={{ padding: 20, borderRadius: radius.lg, background: t.surface, border: `1px solid ${t.hairline}`, cursor: 'pointer', textDecoration: 'none' }}>
                <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6 }}>← Prologue</div>
                <div style={{ fontFamily: typ.display, fontSize: 17, fontWeight: 600, color: t.ink, lineHeight: 1.2, letterSpacing: '-0.01em' }}>Why Konkan, why now</div>
              </a>
              <a style={{ padding: 20, borderRadius: radius.lg, background: t.ink, color: '#fff', cursor: 'pointer', textDecoration: 'none' }}>
                <div style={{ fontFamily: typ.mono, fontSize: 10, color: '#fff', opacity: 0.65, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 6, textAlign: 'right' }}>Day 2 →</div>
                <div style={{ fontFamily: typ.display, fontSize: 17, fontWeight: 600, lineHeight: 1.2, letterSpacing: '-0.01em', textAlign: 'right' }}>Murud-Janjira: the fort that stayed</div>
              </a>
            </div>
          </div>
        </article>
        <WFooter tk={tk}/>
      </div>
    </DCArtboard>
  );
}

/* W-C3 · Experience detail — bookable ───────────────────────── */
function W_Experience({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-exp" label="W·C3 · Experience · bookable" width={1280} height={1900}>
      <div style={{ width: 1280, minHeight: 1900, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>

        {/* Photo gallery */}
        <div style={{ maxWidth: 1240, margin: '24px auto 0', padding: '0 32px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gridTemplateRows: '300px 156px', gap: 8 }}>
          <WPhoto tk={tk} k="fishing" h="auto" style={{ gridRow: 'span 2', borderRadius: `${radius.lg}px 4px 4px ${radius.lg}px`, position: 'relative' }} dim>
            <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 6 }}>
              <WPill tk={tk} kind="coral">Bookable</WPill>
              <WPill tk={tk} kind="glass">Sells out</WPill>
            </div>
          </WPhoto>
          <WPhoto tk={tk} k="bhandar" h="auto" style={{ borderRadius: '4px 4px 4px 4px' }}/>
          <WPhoto tk={tk} k="velas" h="auto" style={{ borderRadius: `4px ${radius.lg}px 4px 4px` }}/>
          <WPhoto tk={tk} k="konkan" h="auto" style={{ borderRadius: '4px 4px 4px 4px' }}/>
          <WPhoto tk={tk} k="monsoon" h="auto" style={{ borderRadius: `4px 4px ${radius.lg}px 4px`, position: 'relative' }}>
            <button style={{ position: 'absolute', right: 12, bottom: 12, padding: '7px 13px', borderRadius: 8, background: 'rgba(255,255,255,0.95)', color: t.ink, border: 0, cursor: 'pointer', fontFamily: typ.body, fontSize: 12, fontWeight: 600, display: 'flex', alignItems: 'center', gap: 5 }}>
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/></svg>
              Show all 18 photos
            </button>
          </WPhoto>
        </div>

        <div style={{ maxWidth: 1240, margin: '36px auto 0', padding: '0 32px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 56 }}>
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              <WPill tk={tk} kind="tint">Slow travel</WPill>
              <WPill tk={tk} kind="tint">Half-day</WPill>
              <WPill tk={tk} kind="tint">Group · 4–8</WPill>
            </div>
            <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 48, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.02, color: t.ink }}>
              Dawn with the fishermen
            </h1>
            <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 14, fontFamily: typ.body, fontSize: 14, color: t.inkSoft }}>
              <span><strong style={{ color: t.ink }}>Harnai jetty, Konkan</strong></span>
              <span>·</span>
              <span style={{ color: t.primary, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><span>★ 4.92</span><span style={{ color: t.inkMuted, fontWeight: 500 }}>(184 reviews)</span></span>
            </div>

            <div style={{ marginTop: 28, padding: '20px 0', borderTop: `1px solid ${t.hairline}`, borderBottom: `1px solid ${t.hairline}`, display: 'flex', alignItems: 'center', gap: 14 }}>
              <WAvatar tk={tk} initials="AR" size={48} gradient={W_AVATARS.AR}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: typ.body, fontSize: 14, color: t.inkMuted }}>Hosted by</div>
                <div style={{ fontFamily: typ.body, fontSize: 16, fontWeight: 700, color: t.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Aanya Ravi <span style={{ width: 14, height: 14, borderRadius: 999, background: t.primary, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 700 }}>✓</span>
                </div>
                <div style={{ fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted, marginTop: 2 }}>Konkan native · 12 experiences · Verified KYC</div>
              </div>
              <WBtn tk={tk} kind="outline" size="sm">View profile</WBtn>
            </div>

            {/* Highlights */}
            <div style={{ marginTop: 36 }}>
              <h2 style={{ margin: '0 0 18px', fontFamily: typ.display, fontSize: 24, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>What you'll do</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                {[
                  { icon: '🌅', t: '5:30 am pickup', s: 'From your stay in Anjarle or Harnai' },
                  { icon: '🛶', t: 'Onto the boat', s: 'A small mechanised boat with the Wadkar family' },
                  { icon: '🎣', t: 'Watch them work', s: 'Cast nets, sort, photograph (ask first)' },
                  { icon: '🍳', t: 'Beach breakfast', s: 'Whatever came in — usually pomfret or surmai' },
                ].map(h => (
                  <div key={h.t} style={{ padding: 18, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.md, display: 'flex', gap: 14 }}>
                    <span style={{ fontSize: 26, flex: '0 0 30px' }}>{h.icon}</span>
                    <div>
                      <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink }}>{h.t}</div>
                      <div style={{ fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted, marginTop: 4, lineHeight: 1.45 }}>{h.s}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* About */}
            <div style={{ marginTop: 40 }}>
              <h2 style={{ margin: '0 0 14px', fontFamily: typ.display, fontSize: 24, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>About this experience</h2>
              <p style={{ margin: '0 0 14px', fontFamily: typ.body, fontSize: 15, color: t.inkSoft, lineHeight: 1.65 }}>
                The Wadkar family has fished out of Harnai for four generations. They take a small group out on their dawn run twice a week — not as a tour, but as a quiet way to share what they do. You ride along, you watch, you don't get in the way. There's no soundtrack. There's no narration. There is, by the end, a hot breakfast on the sand.
              </p>
              <p style={{ margin: 0, fontFamily: typ.body, fontSize: 15, color: t.inkSoft, lineHeight: 1.65 }}>
                I co-host because I grew up two villages over. We split fees with the boat and the cook. Nothing fancy. Wear sandals you don't mind getting wet.
              </p>
            </div>

            {/* Reviews */}
            <div style={{ marginTop: 40 }}>
              <h2 style={{ margin: '0 0 18px', fontFamily: typ.display, fontSize: 24, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>184 reviews · ★ 4.92 average</h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
                {[
                  { id: 'DP', name: 'Devansh', d: 'Jan 2026', q: 'Quietest morning of my life. The Wadkars are the real thing.' },
                  { id: 'SK', name: 'Saanvi', d: 'Dec 2025', q: 'Honest, unposed, and the breakfast is unreal. Bring a jacket — sea wind.' },
                  { id: 'VK', name: 'Vikram', d: 'Dec 2025', q: 'No theatre. Just the work. Took my parents — they still talk about it.' },
                  { id: 'KS', name: 'Karthik', d: 'Nov 2025', q: '5h disappeared. Aanya translates only what matters. Worth twice the price.' },
                ].map((r, i) => (
                  <div key={i} style={{ padding: 22, background: t.surface, borderRadius: radius.lg, border: `1px solid ${t.hairline}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
                      <WAvatar tk={tk} initials={r.id} size={32} gradient={W_AVATARS[r.id]}/>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>{r.name}</div>
                        <div style={{ fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted }}>{r.d}</div>
                      </div>
                      <span style={{ color: t.primary, fontFamily: typ.mono, fontSize: 12, fontWeight: 700 }}>★ 5</span>
                    </div>
                    <p style={{ margin: 0, fontFamily: typ.body, fontSize: 13.5, color: t.inkSoft, lineHeight: 1.55 }}>"{r.q}"</p>
                  </div>
                ))}
              </div>
              <a style={{ display: 'inline-block', marginTop: 18, fontFamily: typ.body, fontSize: 13.5, color: t.primary, fontWeight: 700 }}>Read all 184 reviews →</a>
            </div>
          </div>

          {/* Booking rail */}
          <aside style={{ position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
            <div style={{ background: t.surface, border: `1px solid ${t.hairlineStrong}`, borderRadius: radius.lg, padding: 24, boxShadow: '0 8px 28px rgba(20,20,30,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
                <div>
                  <span style={{ fontFamily: typ.display, fontSize: 30, fontWeight: 600, color: t.ink, letterSpacing: '-0.02em' }}>₹1,400</span>
                  <span style={{ fontFamily: typ.body, fontSize: 13, color: t.inkMuted, marginLeft: 4 }}>/ person</span>
                </div>
                <span style={{ color: t.primary, fontFamily: typ.mono, fontSize: 12, fontWeight: 700 }}>★ 4.92 · 184</span>
              </div>

              {/* Date row */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
                <div style={{ padding: '12px 14px', borderRadius: radius.md, border: `1px solid ${t.hairline}` }}>
                  <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 3 }}>Date</div>
                  <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>Sat 14 Feb</div>
                </div>
                <div style={{ padding: '12px 14px', borderRadius: radius.md, border: `1px solid ${t.hairline}` }}>
                  <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 3 }}>Guests</div>
                  <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>2 adults</div>
                </div>
              </div>

              {/* Available slots */}
              <div style={{ padding: 12, background: t.surfaceAlt, borderRadius: radius.md, marginBottom: 14 }}>
                <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginBottom: 8 }}><strong style={{ color: '#1D9E75' }}>● 4 slots left</strong> for Sat 14 Feb · 5:30 am</div>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[1, 1, 1, 1, 0, 0, 0, 0].map((s, i) => (
                    <div key={i} style={{ flex: 1, height: 6, borderRadius: 999, background: s ? '#1D9E75' : t.hairline }}/>
                  ))}
                </div>
              </div>

              <WBtn tk={tk} kind="coral" full size="lg">
                Reserve · pay later
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6"/></svg>
              </WBtn>
              <div style={{ marginTop: 8, textAlign: 'center', fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted }}>You won't be charged yet · Free cancel up to 24h before</div>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${t.hairline}`, fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft, lineHeight: 1.7 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>₹1,400 × 2</span><span>₹2,800</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Service fee</span><span>₹140</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST 5%</span><span>₹147</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, paddingTop: 10, borderTop: `1px solid ${t.hairline}`, fontWeight: 700, color: t.ink, fontSize: 14 }}><span>Total</span><span>₹3,087</span></div>
              </div>
            </div>
          </aside>
        </div>
        <WFooter tk={tk}/>
      </div>
    </DCArtboard>
  );
}

/* W-C4 · Save modal — list picker ──────────────────────────── */
function W_SaveSheet({ tk }) {
  const { t, typ, radius } = tk;
  const lists = [
    { id: 1, name: 'Konkan dreaming', count: 14, sel: true, gradient: 'fishing' },
    { id: 2, name: 'Long weekends', count: 8, sel: false, gradient: 'thane' },
    { id: 3, name: 'Solo trips · 2026', count: 22, sel: false, gradient: 'spiti' },
    { id: 4, name: 'For Mom', count: 4, sel: true, gradient: 'matheran' },
    { id: 5, name: 'Maybe someday', count: 31, sel: false, gradient: 'goa' },
  ];
  return (
    <DCArtboard id="w-save" label="W·C4 · Save to list · modal" width={1280} height={760}>
      <div style={{ width: 1280, height: 760, background: t.bg, position: 'relative' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.25, filter: 'blur(2px)' }}>
          <WHeader tk={tk} variant="logged"/>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'rgba(20,20,30,0.5)' }}/>

        <div style={{
          position: 'relative', maxWidth: 520, margin: '90px auto 0',
          background: t.surface, borderRadius: radius.xl, overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(20,20,30,0.4)',
        }}>
          <div style={{ padding: '24px 28px 18px', borderBottom: `1px solid ${t.hairline}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>Save</div>
              <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>Konkan in 4 quiet days</div>
              <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>by Aanya Ravi · Itinerary</div>
            </div>
            <button style={{ width: 32, height: 32, borderRadius: 999, border: 0, background: t.surfaceAlt, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>

          <div style={{ padding: '14px 16px', maxHeight: 380, overflow: 'auto' }}>
            {lists.map(l => (
              <button key={l.id} style={{
                display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                padding: '10px 12px', borderRadius: radius.md, cursor: 'pointer',
                background: l.sel ? t.primaryTint : 'transparent', border: 0, marginBottom: 4,
                textAlign: 'left',
              }}>
                <WPhoto tk={tk} k={l.gradient} h={48} style={{ width: 48, flex: '0 0 48px', borderRadius: radius.sm }}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink }}>{l.name}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>{l.count} saved</div>
                </div>
                <span style={{
                  width: 22, height: 22, borderRadius: 999, display: 'grid', placeItems: 'center',
                  background: l.sel ? t.primary : 'transparent',
                  border: l.sel ? 0 : `1.5px solid ${t.hairlineStrong}`,
                }}>
                  {l.sel && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                </span>
              </button>
            ))}

            <button style={{
              display: 'flex', alignItems: 'center', gap: 14, width: '100%',
              padding: '12px', borderRadius: radius.md, cursor: 'pointer',
              background: 'transparent', border: `1.5px dashed ${t.hairlineStrong}`,
              fontFamily: typ.body, fontSize: 13.5, fontWeight: 600, color: t.primary,
              marginTop: 6,
            }}>
              <span style={{ width: 24, height: 24, borderRadius: 999, background: t.primaryTint, color: t.primary, display: 'grid', placeItems: 'center', fontSize: 14, fontWeight: 700 }}>+</span>
              New list…
            </button>
          </div>

          <div style={{ padding: '16px 20px', borderTop: `1px solid ${t.hairline}`, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkSoft }}>Saved to <strong style={{ color: t.ink }}>2 lists</strong></div>
            <div style={{ display: 'flex', gap: 8 }}>
              <WBtn tk={tk} kind="outline" size="sm">Cancel</WBtn>
              <WBtn tk={tk} kind="ink" size="sm">Done</WBtn>
            </div>
          </div>
        </div>

        {/* Toast */}
        <div style={{
          position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
          padding: '12px 20px', background: t.ink, color: '#fff', borderRadius: 999,
          display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 12px 32px rgba(0,0,0,0.25)',
          fontFamily: typ.body, fontSize: 13, fontWeight: 500,
        }}>
          <span style={{ color: t.primary }}>+5 XP</span>
          <span>· "First save" badge nearer (3 / 5)</span>
        </div>
      </div>
    </DCArtboard>
  );
}

Object.assign(window, { W_Itinerary, W_Story, W_Experience, W_SaveSheet });
