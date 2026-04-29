/* CreatorHub — Web · KYC + Profile + Studio packs */

/* W-Y1 · KYC kickoff ──────────────────────────────────────── */
function W_KYCStart({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-kyc-start" label="W·F1 · KYC · why and what" width={1280} height={900}>
      <div style={{ width: 1280, minHeight: 900, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>
        <div style={{ maxWidth: 1080, margin: '40px auto 0', padding: '0 80px' }}>
          <a style={{ fontFamily: typ.body, fontSize: 13, color: t.inkSoft, fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
            Back to Studio
          </a>
          <div style={{ marginTop: 22, fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>Become a verified creator</div>
          <h1 style={{ margin: '8px 0 0', fontFamily: typ.display, fontSize: 56, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.02, color: t.ink }}>
            Three quick checks,<br/>
            <em style={{ fontStyle: 'italic', color: t.primary }}>and you're paid out.</em>
          </h1>
          <p style={{ marginTop: 14, fontFamily: typ.body, fontSize: 16, color: t.inkSoft, maxWidth: 620, lineHeight: 1.55 }}>
            Required by RBI for any creator earning ₹1k+/month. Reviewed by humans, usually within 24 hours.
          </p>

          <div style={{ marginTop: 36, display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { n: 1, l: 'Identity', d: 'PAN + Aadhaar (link via DigiLocker)', est: '~3 min', icon: '🪪' },
              { n: 2, l: 'Bank account', d: 'Account number + IFSC, ₹1 verification', est: '~2 min', icon: '🏦' },
              { n: 3, l: 'Selfie + signature', d: 'A 5-second video for liveness', est: '~1 min', icon: '🤳' },
            ].map(s => (
              <div key={s.n} style={{ padding: 22, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
                  <span style={{ width: 28, height: 28, borderRadius: 999, background: t.primaryTint, color: t.primaryDeep, display: 'grid', placeItems: 'center', fontFamily: typ.mono, fontSize: 12, fontWeight: 700 }}>{s.n}</span>
                  <span style={{ fontSize: 22 }}>{s.icon}</span>
                </div>
                <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>{s.l}</div>
                <div style={{ marginTop: 6, fontFamily: typ.body, fontSize: 13, color: t.inkSoft, lineHeight: 1.5 }}>{s.d}</div>
                <div style={{ marginTop: 14, fontFamily: typ.mono, fontSize: 10.5, color: t.inkMuted, fontWeight: 600, letterSpacing: '0.1em' }}>⏱ {s.est}</div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 28, padding: 20, background: t.primaryTint, borderRadius: radius.lg, display: 'flex', alignItems: 'center', gap: 16 }}>
            <span style={{ fontSize: 26 }}>🔒</span>
            <div style={{ flex: 1, fontFamily: typ.body, fontSize: 13.5, color: t.inkSoft, lineHeight: 1.55 }}>
              <strong style={{ color: t.ink }}>Your data stays with you.</strong> CreatorHub uses Setu's RBI-licensed KYC API. We never store your raw Aadhaar — only the masked reference token.
            </div>
            <a style={{ fontFamily: typ.body, fontSize: 13, color: t.primary, fontWeight: 700 }}>What we store →</a>
          </div>

          <div style={{ marginTop: 28, display: 'flex', gap: 10 }}>
            <WBtn tk={tk} kind="coral" size="lg">Start verification →</WBtn>
            <WBtn tk={tk} kind="outline" size="lg">Save for later</WBtn>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

/* W-Y2 · KYC step — DigiLocker connect ─────────────────────── */
function W_KYCDigiLocker({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-kyc-digi" label="W·F2 · KYC · DigiLocker" width={1280} height={900}>
      <div style={{ width: 1280, minHeight: 900, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>

        {/* Stepper */}
        <div style={{ maxWidth: 720, margin: '32px auto 0', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {['Identity', 'Bank', 'Selfie'].map((l, i) => (
              <React.Fragment key={l}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 999, background: i === 0 ? t.ink : t.surfaceAlt, color: i === 0 ? '#fff' : t.inkMuted, display: 'grid', placeItems: 'center', fontFamily: typ.mono, fontSize: 11, fontWeight: 700 }}>{i + 1}</span>
                  <span style={{ fontFamily: typ.body, fontSize: 13, fontWeight: i === 0 ? 700 : 500, color: i === 0 ? t.ink : t.inkMuted }}>{l}</span>
                </div>
                {i < 2 && <div style={{ flex: 1, height: 1, background: t.hairline }}/>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 640, margin: '32px auto 0', padding: '0 32px' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>Step 1 · Identity</div>
          <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 38, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05, color: t.ink }}>Pull your PAN and Aadhaar from DigiLocker.</h1>
          <p style={{ marginTop: 12, fontFamily: typ.body, fontSize: 14.5, color: t.inkSoft, lineHeight: 1.55 }}>
            One-tap, no upload, no manual typing. We don't see your DigiLocker password — they hand us a signed token.
          </p>

          {/* Connect card */}
          <div style={{ marginTop: 28, padding: 28, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg, textAlign: 'center', boxShadow: '0 4px 14px rgba(20,20,30,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 22 }}>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: t.ink, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: typ.display, fontSize: 22, fontWeight: 700 }}>C</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: t.inkMuted }}>
                {[0, 1, 2].map(i => <span key={i} style={{ width: 4, height: 4, borderRadius: 999, background: t.primary }}/>)}
              </div>
              <div style={{ width: 56, height: 56, borderRadius: 14, background: '#0066B3', color: '#fff', display: 'grid', placeItems: 'center', fontFamily: typ.display, fontSize: 18, fontWeight: 700 }}>DL</div>
            </div>
            <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>CreatorHub will request</div>
            <div style={{ marginTop: 14, display: 'inline-flex', flexDirection: 'column', gap: 6, textAlign: 'left' }}>
              {[
                { l: 'PAN card', sub: 'Read-only · masked except last 4' },
                { l: 'Aadhaar XML', sub: 'Read-only · used for name + DOB match' },
              ].map(d => (
                <div key={d.l} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', background: t.surfaceAlt, borderRadius: 8 }}>
                  <span style={{ width: 16, height: 16, borderRadius: 999, background: '#1D9E75', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 9, fontWeight: 700 }}>✓</span>
                  <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>{d.l}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted }}>· {d.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ marginTop: 22 }}>
              <WBtn tk={tk} kind="coral" size="lg">Continue with DigiLocker →</WBtn>
            </div>
            <a style={{ display: 'block', marginTop: 14, fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft, fontWeight: 500 }}>Or upload PAN + Aadhaar manually</a>
          </div>

          <div style={{ marginTop: 22, padding: 14, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.md, fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span>⚠</span>
            <span><strong style={{ color: t.ink }}>Name on PAN must match name on bank.</strong> Mismatch is the #1 reason creators get held in review.</span>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

/* W-Y3 · KYC review state ─────────────────────────────────── */
function W_KYCReview({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-kyc-review" label="W·F3 · KYC · in review" width={1280} height={780}>
      <div style={{ width: 1280, minHeight: 780, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>
        <div style={{ maxWidth: 720, margin: '64px auto 0', padding: '0 32px', textAlign: 'center' }}>
          <div style={{ width: 80, height: 80, margin: '0 auto', borderRadius: 999, background: '#FBE9C8', color: '#8A5B16', display: 'grid', placeItems: 'center', boxShadow: '0 8px 24px rgba(194,144,51,0.2)' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
          </div>
          <div style={{ marginTop: 22, fontFamily: typ.mono, fontSize: 11, color: '#8A5B16', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase' }}>In review · usually 24 hours</div>
          <h1 style={{ margin: '12px 0 0', fontFamily: typ.display, fontSize: 44, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05, color: t.ink }}>
            Submitted. <em style={{ fontStyle: 'italic', color: t.primary }}>Sit tight.</em>
          </h1>
          <p style={{ marginTop: 14, fontFamily: typ.body, fontSize: 16, color: t.inkSoft, lineHeight: 1.55, maxWidth: 520, marginInline: 'auto' }}>
            A human at CreatorHub is reviewing your details. We'll email <strong style={{ color: t.ink }}>aanya@gmail.com</strong> the moment it clears — usually within a working day.
          </p>

          <div style={{ marginTop: 32, padding: 22, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg, textAlign: 'left' }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 14 }}>Submission</div>
            {[
              { l: 'Identity · PAN + Aadhaar', v: '✓ Matched · A.R. (last 4: 4821)', ok: true },
              { l: 'Bank · HDFC ****6342', v: '✓ ₹1 deposit verified at 14:08', ok: true },
              { l: 'Liveness selfie', v: '✓ 98% match · 5s clip @ 14:11', ok: true },
              { l: 'Tax form (PAN-linked)', v: '… auto-filled, awaiting signature', ok: 'pending' },
            ].map((r, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '10px 0', borderTop: i ? `1px solid ${t.hairline}` : 0 }}>
                <span style={{ width: 22, height: 22, borderRadius: 999, background: r.ok === true ? '#1D9E75' : (r.ok === 'pending' ? '#FBE9C8' : t.surfaceAlt), color: r.ok === true ? '#fff' : '#8A5B16', display: 'grid', placeItems: 'center', fontFamily: typ.mono, fontSize: 10, fontWeight: 700 }}>{r.ok === true ? '✓' : '…'}</span>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 13.5, fontWeight: 600, color: t.ink }}>{r.l}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{r.v}</div>
                </div>
                {r.ok === 'pending' && <a style={{ fontFamily: typ.body, fontSize: 12.5, color: t.primary, fontWeight: 700 }}>Sign now →</a>}
              </div>
            ))}
          </div>

          <p style={{ marginTop: 24, fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted }}>
            Need to fix something? <a style={{ color: t.primary, fontWeight: 600 }}>Edit submission</a> · <a style={{ color: t.primary, fontWeight: 600 }}>Talk to support</a>
          </p>
        </div>
      </div>
    </DCArtboard>
  );
}

/* W-You · Profile / Saved / Trips ──────────────────────────── */
function W_Profile({ tk }) {
  const { t, typ, radius } = tk;
  const tabs = ['Saved', 'Trips', 'Following', 'Activity'];
  return (
    <DCArtboard id="w-profile" label="W·G1 · You · Saved + trips" width={1280} height={1500}>
      <div style={{ width: 1280, minHeight: 1500, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>

        {/* Hero */}
        <div style={{ background: t.surface, borderBottom: `1px solid ${t.hairline}`, padding: '40px 80px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 28 }}>
            <WAvatar tk={tk} initials="AK" size={104} gradient={W_AVATARS.DP}/>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 38, fontWeight: 600, letterSpacing: '-0.02em', color: t.ink }}>Ankit Khanna</h1>
                <span style={{ padding: '4px 10px', borderRadius: 999, background: t.primaryTint, color: t.primaryDeep, fontFamily: typ.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Curious Beginner</span>
              </div>
              <div style={{ fontFamily: typ.body, fontSize: 14, color: t.inkSoft }}>Mumbai · joined Jan 2026 · loves slow weekends, mango shake, and being the second person on the ferry</div>
              <div style={{ marginTop: 14, display: 'flex', gap: 24, fontFamily: typ.body, fontSize: 13.5 }}>
                <span><strong style={{ color: t.ink, fontFamily: typ.display, fontSize: 18 }}>23</strong> <span style={{ color: t.inkMuted }}>saved</span></span>
                <span><strong style={{ color: t.ink, fontFamily: typ.display, fontSize: 18 }}>4</strong> <span style={{ color: t.inkMuted }}>trips booked</span></span>
                <span><strong style={{ color: t.ink, fontFamily: typ.display, fontSize: 18 }}>12</strong> <span style={{ color: t.inkMuted }}>following</span></span>
                <span><strong style={{ color: t.primary, fontFamily: typ.display, fontSize: 18 }}>650</strong> <span style={{ color: t.inkMuted }}>XP</span></span>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <WBtn tk={tk} kind="ink" size="md">Become a creator</WBtn>
              <WBtn tk={tk} kind="outline" size="md">Edit profile</WBtn>
            </div>
          </div>

          {/* XP track */}
          <div style={{ maxWidth: 1240, margin: '24px auto 0', padding: 16, background: t.bg, borderRadius: radius.md, display: 'flex', alignItems: 'center', gap: 18, border: `1px solid ${t.hairline}` }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase' }}>Next badge</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft }}>
                <span><strong style={{ color: t.ink }}>Local Explorer</strong> at 1,000 XP</span>
                <span>650 / 1,000 · 350 to go</span>
              </div>
              <div style={{ height: 6, background: t.surfaceAlt, borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: '65%', height: '100%', background: `linear-gradient(90deg, ${t.primary} 0%, #C13D1F 100%)`, borderRadius: 999 }}/>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 80px', borderBottom: `1px solid ${t.hairline}` }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map((t2, i) => (
              <button key={t2} style={{
                padding: '14px 18px', border: 0, background: 'transparent', cursor: 'pointer',
                fontFamily: typ.body, fontSize: 14, fontWeight: i === 0 ? 700 : 500,
                color: i === 0 ? t.ink : t.inkMuted,
                borderBottom: i === 0 ? `2px solid ${t.primary}` : '2px solid transparent',
                marginBottom: -1,
              }}>{t2} {i === 0 && <span style={{ color: t.inkMuted, fontWeight: 400 }}>· 23</span>}</button>
            ))}
          </div>
        </div>

        {/* Saved lists grid */}
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 80px 0' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 18 }}>
            <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 28, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>Your lists</h2>
            <div style={{ display: 'flex', gap: 6 }}>
              <WBtn tk={tk} kind="outline" size="sm">+ New list</WBtn>
              <WBtn tk={tk} kind="outline" size="sm">Sort: Recent</WBtn>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { name: 'Konkan dreaming', count: 14, cover: 'konkan', sub: 'Last added · 2 hr ago' },
              { name: 'Long weekends', count: 8, cover: 'thane', sub: 'Last added · yesterday' },
              { name: 'Solo trips · 2026', count: 22, cover: 'spiti', sub: 'Last added · 3 days ago' },
              { name: 'For Mom', count: 4, cover: 'matheran', sub: 'Last added · last week', private: true },
              { name: 'Maybe someday', count: 31, cover: 'goa', sub: '— public · 18 followers' },
              { name: 'Foodie spots', count: 6, cover: 'bhandar', sub: 'Last added · 2 weeks ago' },
            ].map((l, i) => (
              <div key={i} style={{ background: t.surface, borderRadius: radius.lg, overflow: 'hidden', border: `1px solid ${t.hairline}`, cursor: 'pointer', boxShadow: '0 4px 12px rgba(20,20,30,0.04)' }}>
                <WPhoto tk={tk} k={l.cover} h={160} style={{ position: 'relative' }} dim>
                  <div style={{ position: 'absolute', bottom: 12, left: 14, color: '#fff', fontFamily: typ.display, fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{l.name}</div>
                  {l.private && <span style={{ position: 'absolute', top: 12, right: 12, padding: '3px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', color: t.ink, fontFamily: typ.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em' }}>🔒 PRIVATE</span>}
                </WPhoto>
                <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft }}>{l.count} saved · {l.sub}</span>
                  <span style={{ color: t.inkMuted, fontSize: 16 }}>›</span>
                </div>
              </div>
            ))}
          </div>

          {/* Booked trips */}
          <h2 style={{ margin: '40px 0 18px', fontFamily: typ.display, fontSize: 28, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>Coming up</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            {[
              { name: 'Konkan in 4 quiet days', img: 'konkan', when: 'Sat 14 Feb · in 16 days', host: 'Aanya Ravi', state: 'confirmed' },
              { name: 'Velas turtle festival', img: 'velas', when: 'Fri 28 Feb · in 30 days', host: 'Konkan Trust', state: 'confirmed' },
            ].map((trip, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '160px 1fr auto', gap: 18, alignItems: 'center', padding: 16, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg }}>
                <WPhoto tk={tk} k={trip.img} h={120} style={{ borderRadius: radius.md }}/>
                <div>
                  <div style={{ fontFamily: typ.mono, fontSize: 10, color: '#1D9E75', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>● Confirmed</div>
                  <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em', lineHeight: 1.15 }}>{trip.name}</div>
                  <div style={{ marginTop: 6, fontFamily: typ.body, fontSize: 13, color: t.inkSoft }}>{trip.when}</div>
                  <div style={{ marginTop: 4, fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted }}>with {trip.host}</div>
                </div>
                <WBtn tk={tk} kind="outline" size="sm">View →</WBtn>
              </div>
            ))}
          </div>
        </div>
        <WFooter tk={tk}/>
      </div>
    </DCArtboard>
  );
}

/* W-S · Creator Studio dashboard ───────────────────────────── */
function W_Studio({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-studio" label="W·H1 · Creator Studio · dashboard" width={1280} height={1600}>
      <div style={{ width: 1280, minHeight: 1600, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>

        {/* Studio top */}
        <div style={{ background: t.ink, color: '#fff', padding: '32px 80px 28px' }}>
          <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 24 }}>
            <div>
              <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>Creator Studio · Aanya Ravi</div>
              <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 44, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.0 }}>
                ₹3,42,180 <em style={{ fontStyle: 'italic', color: t.primary, fontSize: 24 }}>this quarter.</em>
              </h1>
              <div style={{ marginTop: 8, fontFamily: typ.body, fontSize: 14, color: 'rgba(255,255,255,0.7)' }}>+18% on last quarter · next payout <strong style={{ color: '#fff' }}>15 Feb · ₹84,200</strong></div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <WBtn tk={tk} kind="outline" size="md" style={{ background: 'transparent', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}>Export CSV</WBtn>
              <WBtn tk={tk} kind="coral" size="md">+ New publication</WBtn>
            </div>
          </div>

          {/* KPI band */}
          <div style={{ maxWidth: 1240, margin: '28px auto 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {[
              { l: 'Bookings', v: '128', d: '+24', tone: 'up' },
              { l: 'Story reads', v: '14.2k', d: '+8.1%', tone: 'up' },
              { l: 'Followers', v: '2,418', d: '+312', tone: 'up' },
              { l: 'Reply rate', v: '94%', d: '↘ 2pt', tone: 'down' },
            ].map(k => (
              <div key={k.l} style={{ padding: 18, background: 'rgba(255,255,255,0.06)', borderRadius: radius.md, border: '1px solid rgba(255,255,255,0.1)' }}>
                <div style={{ fontFamily: typ.mono, fontSize: 10, color: 'rgba(255,255,255,0.55)', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>{k.l}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                  <span style={{ fontFamily: typ.display, fontSize: 32, fontWeight: 600, letterSpacing: '-0.02em' }}>{k.v}</span>
                  <span style={{ fontFamily: typ.mono, fontSize: 12, fontWeight: 700, color: k.tone === 'up' ? '#5DD8A7' : '#FFB55A' }}>{k.d}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div style={{ maxWidth: 1240, margin: '32px auto 0', padding: '0 80px', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>
          <div>
            {/* Earnings chart card */}
            <div style={{ padding: 22, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg, boxShadow: '0 4px 12px rgba(20,20,30,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
                <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>Earnings · last 12 weeks</h2>
                <div style={{ display: 'flex', gap: 4 }}>
                  {['Week', 'Month', 'Quarter', 'Year'].map((p, i) => (
                    <button key={p} style={{ padding: '5px 11px', borderRadius: 6, background: i === 2 ? t.ink : 'transparent', color: i === 2 ? t.surface : t.inkSoft, border: 0, cursor: 'pointer', fontFamily: typ.body, fontSize: 12, fontWeight: i === 2 ? 700 : 500 }}>{p}</button>
                  ))}
                </div>
              </div>
              {/* SVG bar chart */}
              <svg width="100%" height="180" viewBox="0 0 720 180" style={{ display: 'block' }}>
                <line x1="0" y1="0" x2="720" y2="0" stroke={t.hairline} strokeDasharray="3,3"/>
                <line x1="0" y1="60" x2="720" y2="60" stroke={t.hairline} strokeDasharray="3,3"/>
                <line x1="0" y1="120" x2="720" y2="120" stroke={t.hairline} strokeDasharray="3,3"/>
                {[
                  28, 42, 38, 56, 48, 72, 65, 88, 76, 110, 132, 158
                ].map((v, i) => {
                  const x = 12 + i * 58;
                  const h = (v / 158) * 160;
                  const isLast = i === 11;
                  return (
                    <g key={i}>
                      <rect x={x} y={170 - h} width={42} height={h} rx={6} fill={isLast ? t.primary : t.primaryTint}/>
                      {isLast && <text x={x + 21} y={170 - h - 8} textAnchor="middle" fontFamily={typ.mono} fontSize={11} fontWeight={700} fill={t.primary}>₹84.2k</text>}
                    </g>
                  );
                })}
              </svg>
              <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontFamily: typ.mono, fontSize: 10, color: t.inkMuted }}>
                {['W47', 'W48', 'W49', 'W50', 'W51', 'W52', 'W01', 'W02', 'W03', 'W04', 'W05', 'W06'].map(w => <span key={w}>{w}</span>)}
              </div>
            </div>

            {/* Publications table */}
            <div style={{ marginTop: 24 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>Your publications</h2>
                <a style={{ fontFamily: typ.body, fontSize: 13, color: t.primary, fontWeight: 600 }}>See all 18 →</a>
              </div>
              <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg, overflow: 'hidden' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '12px 18px', background: t.surfaceAlt, fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase' }}>
                  <span>Title</span><span>Status</span><span>Views</span><span>Bookings</span><span style={{ textAlign: 'right' }}>Earned</span>
                </div>
                {[
                  { t: 'Konkan in 4 quiet days', img: 'konkan', kind: 'Itinerary', state: 'live', states: '#1D9E75', views: '4.2k', books: 24, earn: '₹84,200' },
                  { t: 'Dawn with the fishermen', img: 'fishing', kind: 'Experience', state: 'live', states: '#1D9E75', views: '2.8k', books: 78, earn: '₹1,42,800' },
                  { t: 'Konkan monsoon: when not to go', img: 'monsoon', kind: 'Story', state: 'live', states: '#1D9E75', views: '6.4k', books: '—', earn: '₹0 · free' },
                  { t: 'Velas turtle festival group', img: 'velas', kind: 'Event', state: 'draft', states: '#C29033', views: '—', books: '—', earn: '—' },
                  { t: 'Mughlai by foot · Mahim', img: 'thane', kind: 'Experience', state: 'review', states: '#5F8FB8', views: '—', books: '—', earn: '—' },
                ].map((row, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', padding: '14px 18px', alignItems: 'center', borderTop: `1px solid ${t.hairline}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
                      <WPhoto tk={tk} k={row.img} h={44} style={{ width: 60, flex: '0 0 60px', borderRadius: radius.sm }}/>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontFamily: typ.body, fontSize: 13.5, fontWeight: 600, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.t}</div>
                        <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', marginTop: 2 }}>{row.kind}</div>
                      </div>
                    </div>
                    <div><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '3px 9px', borderRadius: 999, background: row.states + '22', color: row.states, fontFamily: typ.mono, fontSize: 10.5, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase' }}><span style={{ width: 5, height: 5, borderRadius: 999, background: row.states }}/>{row.state}</span></div>
                    <div style={{ fontFamily: typ.mono, fontSize: 13, fontWeight: 500, color: t.ink }}>{row.views}</div>
                    <div style={{ fontFamily: typ.mono, fontSize: 13, fontWeight: 500, color: t.ink }}>{row.books}</div>
                    <div style={{ fontFamily: typ.mono, fontSize: 13, fontWeight: 700, color: t.ink, textAlign: 'right' }}>{row.earn}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right rail */}
          <aside>
            {/* Inbox */}
            <div style={{ padding: 20, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <h3 style={{ margin: 0, fontFamily: typ.display, fontSize: 18, fontWeight: 600, color: t.ink, letterSpacing: '-0.01em' }}>Inbox</h3>
                <span style={{ padding: '2px 8px', borderRadius: 999, background: t.primary, color: '#fff', fontFamily: typ.mono, fontSize: 10, fontWeight: 700 }}>4 new</span>
              </div>
              {[
                { id: 'DP', n: 'Devansh P.', m: 'Quick q about Day 3 — does the boat go out if it rains?', t: '12m', new: true },
                { id: 'SK', n: 'Saanvi K.', m: '5 stars! The Wadkars are the realest people I\'ve met.', t: '2h', new: true },
                { id: 'VK', n: 'Vikram K.', m: 'Booked Velas for 4 of us — payment receipt attached.', t: '1d' },
              ].map((m, i) => (
                <div key={i} style={{ display: 'flex', gap: 12, padding: '10px 0', borderTop: i ? `1px solid ${t.hairline}` : 0, position: 'relative' }}>
                  {m.new && <span style={{ position: 'absolute', left: -12, top: 22, width: 6, height: 6, borderRadius: 999, background: t.primary }}/>}
                  <WAvatar tk={tk} initials={m.id} size={32} gradient={W_AVATARS[m.id]}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
                      <span style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 700, color: t.ink }}>{m.n}</span>
                      <span style={{ fontFamily: typ.mono, fontSize: 10.5, color: t.inkMuted }}>{m.t}</span>
                    </div>
                    <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkSoft, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.m}</div>
                  </div>
                </div>
              ))}
              <a style={{ display: 'block', marginTop: 12, textAlign: 'center', fontFamily: typ.body, fontSize: 13, color: t.primary, fontWeight: 600 }}>Open inbox →</a>
            </div>

            {/* Tip card */}
            <div style={{ marginTop: 14, padding: 18, background: t.primaryTint, borderRadius: radius.lg, border: `1px solid ${t.primary}33` }}>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>● Insight</div>
              <div style={{ fontFamily: typ.display, fontSize: 16, fontWeight: 600, color: t.ink, letterSpacing: '-0.01em', lineHeight: 1.3 }}>
                Konkan demand peaks Friday 6–9pm. Schedule next week's chapter for Friday at 6:30pm to ride it.
              </div>
              <WBtn tk={tk} kind="ink" size="sm" full style={{ marginTop: 14 }}>Schedule a post</WBtn>
            </div>

            {/* Payouts */}
            <div style={{ marginTop: 14, padding: 18, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10 }}>
                <h3 style={{ margin: 0, fontFamily: typ.display, fontSize: 16, fontWeight: 600, color: t.ink }}>Payouts</h3>
                <a style={{ fontFamily: typ.body, fontSize: 12, color: t.primary, fontWeight: 600 }}>All →</a>
              </div>
              {[
                { d: '15 Feb', a: '₹84,200', s: 'Scheduled', c: '#5F8FB8' },
                { d: '01 Feb', a: '₹62,140', s: 'Paid · HDFC', c: '#1D9E75' },
                { d: '15 Jan', a: '₹48,920', s: 'Paid · HDFC', c: '#1D9E75' },
              ].map((p, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderTop: i ? `1px solid ${t.hairline}` : 0 }}>
                  <div>
                    <div style={{ fontFamily: typ.body, fontSize: 12.5, fontWeight: 600, color: t.ink }}>{p.d}</div>
                    <div style={{ fontFamily: typ.mono, fontSize: 10, color: p.c, fontWeight: 700, marginTop: 2 }}>● {p.s}</div>
                  </div>
                  <div style={{ fontFamily: typ.display, fontSize: 16, fontWeight: 600, color: t.ink, letterSpacing: '-0.01em' }}>{p.a}</div>
                </div>
              ))}
            </div>
          </aside>
        </div>
        <WFooter tk={tk}/>
      </div>
    </DCArtboard>
  );
}

Object.assign(window, { W_KYCStart, W_KYCDigiLocker, W_KYCReview, W_Profile, W_Studio });
