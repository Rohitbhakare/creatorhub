/* CreatorHub — Web · Onboarding & auth (separate from mobile)
 * Welcome → Phone → OTP → Location → Interests → Creators → Celebrate → Auth wall
 * Single-column hero, image-led, no admin chrome. */

const W_VERTICALS = [
  { id: 'roadtrips', label: 'Road trips', emoji: '🚗', img: 'spiti' },
  { id: 'biking', label: 'Biking', emoji: '🏍️', img: 'ladakh' },
  { id: 'trekking', label: 'Trekking', emoji: '🥾', img: 'matheran' },
  { id: 'food', label: 'Food trails', emoji: '🥘', img: 'thane' },
  { id: 'beaches', label: 'Beaches', emoji: '🏖️', img: 'velas' },
  { id: 'culture', label: 'Culture', emoji: '🏛️', img: 'hampi' },
  { id: 'wildlife', label: 'Wildlife', emoji: '🐅', img: 'fishing' },
  { id: 'photo', label: 'Photography', emoji: '📷', img: 'bandra' },
  { id: 'spiritual', label: 'Spiritual', emoji: '🪷', img: 'monsoon' },
  { id: 'offbeat', label: 'Offbeat', emoji: '🌿', img: 'goa' },
];

/* W1 · Welcome — full-bleed hero ────────────────────────────── */
function W_Welcome({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-onb-welcome" label="W·A1 · Welcome / first run" width={1280} height={760}>
      <div style={{ width: 1280, height: 760, position: 'relative', overflow: 'hidden', background: t.bg }}>
        <WHeader tk={tk} variant="auth"/>
        {/* Hero: split — left text, right photo collage */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, height: 688 }}>
          <div style={{ padding: '80px 80px 0', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 18 }}>
              India's home for travel storytellers
            </div>
            <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 76, lineHeight: 0.96, color: t.ink, fontWeight: 600, letterSpacing: '-0.025em' }}>
              Travel stories<br/>
              <em style={{ fontStyle: 'italic', color: t.primary }}>worth saving.</em><br/>
              <span style={{ color: t.inkSoft }}>Plans worth booking.</span>
            </h1>
            <p style={{ marginTop: 28, marginBottom: 0, fontFamily: typ.body, fontSize: 17, lineHeight: 1.55, color: t.inkSoft, maxWidth: 460 }}>
              Discover, save, and book trips directly from creators who actually went.
              Free to read. UPI-first. 100% refund if a creator cancels.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 36 }}>
              <WBtn tk={tk} kind="coral" size="lg">
                Get started — it's free
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6"/></svg>
              </WBtn>
              <WBtn tk={tk} kind="outline" size="lg">Browse as a guest</WBtn>
            </div>
            <div style={{ marginTop: 32, display: 'flex', alignItems: 'center', gap: 14, fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted }}>
              <div style={{ display: 'flex' }}>
                {['AR', 'DP', 'SK', 'VK'].map((i, idx) => (
                  <div key={i} style={{ marginLeft: idx ? -8 : 0 }}>
                    <WAvatar tk={tk} initials={i} size={28} gradient={W_AVATARS[i]}/>
                  </div>
                ))}
              </div>
              <div>Joined by <strong style={{ color: t.ink }}>2,400+</strong> Indian creators · 18,000+ travellers</div>
            </div>
          </div>
          <div style={{ padding: '40px 60px 40px 0', position: 'relative' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gridTemplateRows: 'repeat(4, 1fr)', gap: 12, height: '100%' }}>
              <WPhoto tk={tk} k="konkan" h="auto" style={{ gridRow: 'span 2', gridColumn: 'span 2', borderRadius: radius.xl }} dim>
                <div style={{ position: 'absolute', bottom: 16, left: 18, color: '#fff', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                  <div style={{ fontFamily: typ.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.9 }}>Konkan · 4 days</div>
                  <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: 600, letterSpacing: '-0.015em', marginTop: 2 }}>Quiet roads, salt air</div>
                </div>
              </WPhoto>
              <WPhoto tk={tk} k="velas" h="auto" style={{ borderRadius: radius.lg }} dim>
                <div style={{ position: 'absolute', bottom: 10, left: 12, right: 12, color: '#fff', fontFamily: typ.body, fontSize: 11, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>Turtle festival</div>
              </WPhoto>
              <WPhoto tk={tk} k="thane" h="auto" style={{ borderRadius: radius.lg }} dim>
                <div style={{ position: 'absolute', bottom: 10, left: 12, color: '#fff', fontFamily: typ.body, fontSize: 11, fontWeight: 600, textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>Biryani walk</div>
              </WPhoto>
              <WPhoto tk={tk} k="spiti" h="auto" style={{ gridColumn: 'span 2', borderRadius: radius.lg }} dim>
                <div style={{ position: 'absolute', bottom: 12, left: 14, color: '#fff', textShadow: '0 1px 3px rgba(0,0,0,0.4)' }}>
                  <div style={{ fontFamily: typ.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', opacity: 0.9 }}>Himachal · 9 days</div>
                  <div style={{ fontFamily: typ.display, fontSize: 16, fontWeight: 600, marginTop: 2 }}>The slow road through Spiti</div>
                </div>
              </WPhoto>
              <WPhoto tk={tk} k="bhandar" h="auto" style={{ borderRadius: radius.lg }} dim/>
              <WPhoto tk={tk} k="goa" h="auto" style={{ borderRadius: radius.lg }} dim/>
              <WPhoto tk={tk} k="matheran" h="auto" style={{ borderRadius: radius.lg }} dim/>
              <WPhoto tk={tk} k="ladakh" h="auto" style={{ gridColumn: 'span 1', borderRadius: radius.lg }} dim/>
            </div>
            {/* Floating story card */}
            <div style={{
              position: 'absolute', left: -30, bottom: 50, width: 240, padding: 14,
              background: t.surface, borderRadius: radius.lg, border: `1px solid ${t.hairline}`,
              boxShadow: '0 12px 32px rgba(20,20,30,0.18)', display: 'flex', alignItems: 'center', gap: 10,
            }}>
              <WAvatar tk={tk} initials="AR" size={36} gradient={W_AVATARS.AR}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: typ.body, fontSize: 11, fontWeight: 600, color: t.ink }}>Aanya just published</div>
                <div style={{ fontFamily: typ.body, fontSize: 10, color: t.inkMuted, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>"Konkan in 4 quiet days" — 4 chapters</div>
              </div>
              <div style={{ width: 6, height: 6, borderRadius: 999, background: '#1D9E75' }}/>
            </div>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

/* W2 · Phone — focused single-column entry ──────────────────── */
function W_Phone({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-onb-phone" label="W·A2 · Phone number" width={1280} height={760}>
      <div style={{ width: 1280, height: 760, background: t.bg }}>
        <WHeader tk={tk} variant="auth"/>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', height: 688 }}>
          {/* Left photo */}
          <WPhoto tk={tk} k="konkan" h="100%" style={{ borderRadius: 0, position: 'relative' }} dim>
            <div style={{ position: 'absolute', inset: 'auto 0 0 0', padding: '40px 60px', color: '#fff' }}>
              <div style={{ fontFamily: typ.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', opacity: 0.9, marginBottom: 14 }}>Stories from</div>
              <div style={{ fontFamily: typ.display, fontSize: 38, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05, textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                Konkan, Bandra, Spiti — and<br/>2,400 other places worth going.
              </div>
            </div>
          </WPhoto>

          <div style={{ padding: '60px 80px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Step 1 of 5 · Account</div>
            <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 42, lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.02em', color: t.ink }}>
              What's your <em style={{ fontStyle: 'italic', color: t.primary }}>phone number?</em>
            </h2>
            <p style={{ marginTop: 14, marginBottom: 36, fontFamily: typ.body, fontSize: 15, color: t.inkSoft, lineHeight: 1.55, maxWidth: 380 }}>
              We'll text a 6-digit code. We never message you for marketing without asking.
            </p>

            <div style={{
              display: 'flex', alignItems: 'stretch', borderRadius: radius.lg,
              border: `1.5px solid ${t.primary}`,
              boxShadow: `0 0 0 3px ${t.primaryTint}`,
              background: t.surface, marginBottom: 14, maxWidth: 440,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '0 16px', borderRight: `1px solid ${t.hairline}` }}>
                <div style={{ width: 24, height: 16, borderRadius: 2, background: 'linear-gradient(180deg, #FF9933 0%, #FF9933 33%, #fff 33%, #fff 66%, #138808 66%, #138808 100%)' }}/>
                <span style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink }}>+91</span>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={t.inkMuted} strokeWidth="2"><polyline points="6 9 12 15 18 9"/></svg>
              </div>
              <input readOnly value="98765 43210" style={{
                flex: 1, border: 0, background: 'transparent', padding: '18px 18px',
                fontFamily: typ.body, fontSize: 18, fontWeight: 500, letterSpacing: '0.03em', color: t.ink, outline: 'none',
              }}/>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28 }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: `1.5px solid ${t.primary}`, background: t.primary, display: 'grid', placeItems: 'center' }}>
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
              <div style={{ fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft }}>I agree to <a style={{ color: t.ink, fontWeight: 600 }}>Terms</a> and <a style={{ color: t.ink, fontWeight: 600 }}>Privacy</a></div>
            </div>

            <WBtn tk={tk} kind="ink" size="lg" style={{ maxWidth: 440 }}>
              Send code
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6"/></svg>
            </WBtn>

            <div style={{ marginTop: 22, fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted, maxWidth: 440 }}>
              Or sign in with <a style={{ color: t.ink, fontWeight: 600, marginLeft: 4 }}>Google</a> · <a style={{ color: t.ink, fontWeight: 600 }}>Apple</a>
            </div>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

/* W3 · OTP ─────────────────────────────────────────────────── */
function W_Otp({ tk }) {
  const { t, typ, radius } = tk;
  const code = ['4', '8', '2', '1', '', ''];
  return (
    <DCArtboard id="w-onb-otp" label="W·A3 · OTP verification" width={1280} height={760}>
      <div style={{ width: 1280, height: 760, background: t.bg }}>
        <WHeader tk={tk} variant="auth"/>
        <div style={{ maxWidth: 540, margin: '60px auto 0', padding: '0 32px' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Step 2 of 5 · Verify</div>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 40, lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.02em', color: t.ink }}>
            Check your messages
          </h2>
          <p style={{ marginTop: 12, marginBottom: 40, fontFamily: typ.body, fontSize: 15, color: t.inkSoft, lineHeight: 1.55 }}>
            We sent a 6-digit code to <strong style={{ color: t.ink }}>+91 98765 43210</strong>. <a style={{ color: t.primary, fontWeight: 600 }}>Edit number</a>
          </p>

          <div style={{ display: 'flex', gap: 10, marginBottom: 28 }}>
            {code.map((d, i) => (
              <div key={i} style={{
                flex: 1, aspectRatio: '1', display: 'grid', placeItems: 'center',
                background: t.surface,
                border: `1.5px solid ${i === 4 ? t.primary : d ? t.hairlineStrong : t.hairline}`,
                boxShadow: i === 4 ? `0 0 0 3px ${t.primaryTint}` : 'none',
                borderRadius: radius.md,
                fontFamily: typ.display, fontSize: 32, fontWeight: 600, color: t.ink,
              }}>{d || (i === 4 && <span style={{ width: 2, height: 32, background: t.primary, animation: 'wblink 1s infinite' }}/>)}</div>
            ))}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 36 }}>
            <div style={{ flex: 1, height: 1, background: t.hairline }}/>
            <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>Resend in <strong style={{ color: t.ink, fontFamily: typ.mono }}>0:24</strong></div>
            <div style={{ flex: 1, height: 1, background: t.hairline }}/>
          </div>

          <WBtn tk={tk} kind="ink" size="lg" full>
            Verify and continue
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6"/></svg>
          </WBtn>

          <div style={{ marginTop: 24, padding: 14, borderRadius: radius.md, background: t.surfaceAlt, fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft, lineHeight: 1.5 }}>
            <strong style={{ color: t.ink }}>Didn't get the code?</strong> Check spam, or try <a style={{ color: t.primary, fontWeight: 600 }}>WhatsApp instead</a>.
          </div>
        </div>
        <style>{`@keyframes wblink { 0%,100%{opacity:1} 50%{opacity:0} }`}</style>
      </div>
    </DCArtboard>
  );
}

/* W4 · Location ────────────────────────────────────────────── */
function W_OnbLocation({ tk }) {
  const { t, typ, radius } = tk;
  const cities = ['Mumbai', 'Bengaluru', 'Delhi', 'Pune', 'Hyderabad', 'Chennai', 'Kolkata', 'Goa'];
  return (
    <DCArtboard id="w-onb-location" label="W·A4 · Pick your home city" width={1280} height={820}>
      <div style={{ width: 1280, height: 820, background: t.bg }}>
        <WHeader tk={tk} variant="auth"/>
        <div style={{ maxWidth: 980, margin: '50px auto 0', padding: '0 32px' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Step 3 of 5 · Where you live</div>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 42, lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.02em', color: t.ink }}>
            Where do you call <em style={{ fontStyle: 'italic', color: t.primary }}>home?</em>
          </h2>
          <p style={{ marginTop: 12, marginBottom: 32, fontFamily: typ.body, fontSize: 15, color: t.inkSoft, lineHeight: 1.55, maxWidth: 600 }}>
            We'll show stories and weekend trips from creators near you. You can change this anytime.
          </p>

          {/* Search bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px',
            background: t.surface, border: `1.5px solid ${t.hairlineStrong}`, borderRadius: radius.lg, marginBottom: 28,
            boxShadow: '0 4px 12px rgba(20,20,30,0.04)',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.inkMuted} strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input readOnly value="Mum" style={{ flex: 1, border: 0, background: 'transparent', fontFamily: typ.body, fontSize: 16, color: t.ink, outline: 'none' }}/>
            <button style={{ background: 'transparent', border: 0, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontFamily: typ.body, fontSize: 12.5, color: t.primary, fontWeight: 600 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="10" r="3"/><path d="M12 2a8 8 0 0 0-8 8c0 6 8 12 8 12s8-6 8-12a8 8 0 0 0-8-8z"/></svg>
              Use my location
            </button>
          </div>

          {/* Selected card */}
          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 28,
          }}>
            <div style={{
              background: t.surface, borderRadius: radius.lg, padding: 24,
              border: `1.5px solid ${t.primary}`, boxShadow: `0 0 0 3px ${t.primaryTint}, 0 4px 14px rgba(225,90,65,0.15)`,
              display: 'flex', alignItems: 'center', gap: 16,
            }}>
              <WPhoto tk={tk} k="bandra" h={68} style={{ width: 68, flex: '0 0 68px', borderRadius: radius.md }}/>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>Selected</div>
                <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.01em' }}>Mumbai, Maharashtra</div>
                <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>248 active creators · 1,420 stories</div>
              </div>
              <div style={{ width: 26, height: 26, borderRadius: 999, background: t.primary, color: '#fff', display: 'grid', placeItems: 'center' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              </div>
            </div>
            <div style={{
              background: t.surfaceAlt, borderRadius: radius.lg, padding: 16,
              fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft, lineHeight: 1.55,
              display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <div style={{ width: 32, height: 32, borderRadius: 999, background: t.primaryTint, color: t.primary, display: 'grid', placeItems: 'center', flex: '0 0 32px' }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              </div>
              <div>
                Mumbai means we'll prioritise <strong style={{ color: t.ink }}>Konkan, Lonavala, Igatpuri, Velas</strong> and other places within a 6-hour drive.
              </div>
            </div>
          </div>

          {/* Other cities chip rail */}
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12 }}>Or pick another city</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {cities.map(c => (
              <button key={c} style={{
                padding: '10px 16px', borderRadius: 999, cursor: 'pointer',
                background: c === 'Mumbai' ? t.ink : t.surface,
                color: c === 'Mumbai' ? t.surface : t.ink,
                border: c === 'Mumbai' ? `1px solid ${t.ink}` : `1px solid ${t.hairline}`,
                fontFamily: typ.body, fontSize: 13, fontWeight: 500,
              }}>{c}</button>
            ))}
          </div>

          <div style={{ marginTop: 50, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a style={{ fontFamily: typ.body, fontSize: 13.5, color: t.inkSoft, fontWeight: 500 }}>← Back</a>
            <WBtn tk={tk} kind="ink" size="lg">
              Continue
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6"/></svg>
            </WBtn>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

/* W5 · Interests — beautiful image-tile grid ────────────────── */
function W_OnbVerticals({ tk }) {
  const { t, typ, radius } = tk;
  const selected = new Set(['roadtrips', 'biking', 'food', 'photo']);
  return (
    <DCArtboard id="w-onb-verticals" label="W·A5 · Pick your interests" width={1280} height={920}>
      <div style={{ width: 1280, minHeight: 920, background: t.bg }}>
        <WHeader tk={tk} variant="auth"/>
        <div style={{ maxWidth: 1100, margin: '40px auto 0', padding: '0 32px' }}>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 24 }}>
            <div>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Step 4 of 5 · Tune your feed</div>
              <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 40, lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.02em', color: t.ink }}>
                What gets you <em style={{ fontStyle: 'italic', color: t.primary }}>moving?</em>
              </h2>
              <p style={{ marginTop: 10, marginBottom: 0, fontFamily: typ.body, fontSize: 14.5, color: t.inkSoft, maxWidth: 540 }}>
                Pick at least 3. We use these only to curate your home feed.
              </p>
            </div>
            <div style={{
              padding: '8px 14px', borderRadius: 999, background: t.primaryTint, color: t.primaryDeep,
              fontFamily: typ.body, fontSize: 12, fontWeight: 700, border: `1px solid ${t.primary}33`,
            }}>{selected.size} selected · min 3</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {W_VERTICALS.map(v => {
              const sel = selected.has(v.id);
              return (
                <button key={v.id} style={{
                  position: 'relative', padding: 0, border: 0, cursor: 'pointer',
                  borderRadius: radius.lg, overflow: 'hidden', textAlign: 'left',
                  boxShadow: sel ? `0 0 0 3px ${t.primary}, 0 8px 24px rgba(225,90,65,0.25)` : `0 0 0 1px ${t.hairline}`,
                  transition: 'transform 0.15s, box-shadow 0.15s',
                }}>
                  <WPhoto tk={tk} k={v.img} h={170} dim>
                    <div style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderRadius: 999, background: sel ? t.primary : 'rgba(255,255,255,0.85)', display: 'grid', placeItems: 'center', backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)' }}>
                      {sel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>}
                    </div>
                    <div style={{ position: 'absolute', left: 12, bottom: 12, color: '#fff' }}>
                      <div style={{ fontSize: 22, marginBottom: 2 }}>{v.emoji}</div>
                      <div style={{ fontFamily: typ.body, fontSize: 13.5, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{v.label}</div>
                    </div>
                  </WPhoto>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a style={{ fontFamily: typ.body, fontSize: 13.5, color: t.inkSoft, fontWeight: 500 }}>← Back</a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <a style={{ fontFamily: typ.body, fontSize: 13.5, color: t.inkSoft, fontWeight: 500 }}>Skip for now</a>
              <WBtn tk={tk} kind="ink" size="lg">
                Continue with 4 picks
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6"/></svg>
              </WBtn>
            </div>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

/* W6 · Creators ─────────────────────────────────────────────── */
function W_OnbCreators({ tk }) {
  const { t, typ, radius } = tk;
  const creators = [
    { id: 'AR', name: 'Aanya Ravi', city: 'Mumbai', followers: '2.4k', tags: ['Konkan', 'Slow travel'], img: 'konkan', verified: true, followed: true },
    { id: 'VK', name: 'Vikram Kapoor', city: 'Manali', followers: '8.1k', tags: ['Biking', 'Spiti'], img: 'spiti', verified: true, followed: true },
    { id: 'DP', name: 'Devansh Pillai', city: 'Thane', followers: '1.8k', tags: ['Food', 'Walks'], img: 'thane', verified: false, followed: false },
    { id: 'SK', name: 'Saanvi Kumar', city: 'Bandra', followers: '4.2k', tags: ['Photography', 'Monsoon'], img: 'bandra', verified: true, followed: false },
    { id: 'RM', name: 'Riya Mehta', city: 'Goa', followers: '3.6k', tags: ['Beaches', 'Offbeat'], img: 'goa', verified: false, followed: true },
    { id: 'KS', name: 'Karthik S.', city: 'Bengaluru', followers: '12k', tags: ['Treks', 'Western Ghats'], img: 'matheran', verified: true, followed: false },
  ];
  return (
    <DCArtboard id="w-onb-creators" label="W·A6 · Follow creators" width={1280} height={920}>
      <div style={{ width: 1280, minHeight: 920, background: t.bg }}>
        <WHeader tk={tk} variant="auth"/>
        <div style={{ maxWidth: 1100, margin: '40px auto 0', padding: '0 32px' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Step 5 of 5 · Follow voices</div>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 40, lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.02em', color: t.ink }}>
            Three creators we think you'll <em style={{ fontStyle: 'italic', color: t.primary }}>love.</em>
          </h2>
          <p style={{ marginTop: 10, marginBottom: 32, fontFamily: typ.body, fontSize: 14.5, color: t.inkSoft, maxWidth: 600 }}>
            Based on your interests in Road trips, Biking and Food. You can unfollow anytime.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {creators.map(c => (
              <div key={c.id} style={{
                background: t.surface, borderRadius: radius.lg, overflow: 'hidden',
                border: `1px solid ${t.hairline}`, boxShadow: '0 1px 3px rgba(20,20,30,0.04)',
              }}>
                <WPhoto tk={tk} k={c.img} h={120} dim style={{ borderRadius: 0 }}/>
                <div style={{ padding: '16px 18px 18px', position: 'relative', marginTop: -28 }}>
                  <WAvatar tk={tk} initials={c.id} size={56} gradient={W_AVATARS[c.id]}/>
                  <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{ fontFamily: typ.body, fontSize: 15, fontWeight: 700, color: t.ink }}>{c.name}</div>
                    {c.verified && <span style={{ width: 14, height: 14, borderRadius: 999, background: t.primary, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 700 }}>✓</span>}
                  </div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{c.city} · {c.followers} followers</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 12 }}>
                    {c.tags.map(tg => (
                      <div key={tg} style={{ padding: '4px 10px', borderRadius: 999, background: t.surfaceAlt, fontFamily: typ.body, fontSize: 11, fontWeight: 500, color: t.inkSoft }}>{tg}</div>
                    ))}
                  </div>
                  <button style={{
                    marginTop: 16, width: '100%', padding: '10px 14px', borderRadius: radius.md, cursor: 'pointer',
                    background: c.followed ? t.surface : t.ink,
                    color: c.followed ? t.ink : t.surface,
                    border: c.followed ? `1.5px solid ${t.hairlineStrong}` : 0,
                    fontFamily: typ.body, fontSize: 13, fontWeight: 600,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  }}>
                    {c.followed ? <>✓ Following</> : <>+ Follow</>}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: 32, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <a style={{ fontFamily: typ.body, fontSize: 13.5, color: t.inkSoft, fontWeight: 500 }}>← Back</a>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <a style={{ fontFamily: typ.body, fontSize: 13.5, color: t.inkSoft, fontWeight: 500 }}>See more creators</a>
              <WBtn tk={tk} kind="coral" size="lg">
                Done — take me home
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6"/></svg>
              </WBtn>
            </div>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

/* W7 · Celebrate — gamification reveal ──────────────────────── */
function W_OnbCelebrate({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-onb-celebrate" label="W·A7 · Welcome celebration + first quest" width={1280} height={760}>
      <div style={{ width: 1280, height: 760, background: `radial-gradient(ellipse at top, ${t.primaryTint}, ${t.bg} 60%)`, position: 'relative', overflow: 'hidden' }}>
        <WHeader tk={tk} variant="auth"/>
        {/* Confetti dots */}
        <svg width="100%" height="500" style={{ position: 'absolute', top: 72, left: 0, opacity: 0.7, pointerEvents: 'none' }}>
          {Array.from({ length: 60 }).map((_, i) => {
            const x = (i * 137) % 1280;
            const y = (i * 53) % 460 + 20;
            const colors = [t.primary, t.primaryDeep, '#1D9E75', '#BA7517', t.ink];
            return <circle key={i} cx={x} cy={y} r={2 + (i % 3)} fill={colors[i % colors.length]} opacity={0.6}/>;
          })}
        </svg>

        <div style={{ maxWidth: 720, margin: '60px auto 0', padding: '0 32px', textAlign: 'center', position: 'relative' }}>
          <div style={{
            width: 96, height: 96, margin: '0 auto 28px', borderRadius: 999,
            background: `linear-gradient(135deg, ${t.primary}, ${t.primaryDeep})`,
            display: 'grid', placeItems: 'center',
            boxShadow: '0 20px 60px rgba(225,90,65,0.4)',
            fontSize: 44,
          }}>🎉</div>
          <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 14 }}>You're in</div>
          <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 56, lineHeight: 1.02, fontWeight: 600, letterSpacing: '-0.025em', color: t.ink }}>
            Welcome, <em style={{ fontStyle: 'italic', color: t.primary }}>Riya.</em>
          </h1>
          <p style={{ marginTop: 16, marginBottom: 36, fontFamily: typ.body, fontSize: 17, color: t.inkSoft, lineHeight: 1.5 }}>
            We've curated 142 stories near Mumbai for your first week.<br/>
            Read 3 to unlock your first badge.
          </p>

          {/* Quest card */}
          <div style={{
            display: 'inline-block', textAlign: 'left',
            background: t.surface, borderRadius: radius.xl,
            border: `1px solid ${t.hairline}`,
            padding: '24px 28px', boxShadow: '0 24px 60px rgba(20,20,30,0.12)',
            minWidth: 480, marginBottom: 28,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 16 }}>
              <div style={{ width: 46, height: 46, borderRadius: radius.md, background: `linear-gradient(135deg, ${t.primary}, ${t.primaryDeep})`, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 22, boxShadow: '0 6px 18px rgba(225,90,65,0.35)' }}>🏆</div>
              <div>
                <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 2 }}>First quest unlocked</div>
                <div style={{ fontFamily: typ.display, fontSize: 18, fontWeight: 600, color: t.ink, letterSpacing: '-0.01em' }}>Curious Beginner</div>
              </div>
              <div style={{ marginLeft: 'auto', padding: '4px 10px', borderRadius: 999, background: t.primaryTint, color: t.primaryDeep, fontFamily: typ.mono, fontSize: 11, fontWeight: 700, letterSpacing: '0.06em' }}>+150 XP</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ flex: 1, height: 8, borderRadius: 999, background: t.surfaceAlt, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '0%', background: t.primary, borderRadius: 999 }}/>
              </div>
              <div style={{ fontFamily: typ.mono, fontSize: 12, fontWeight: 700, color: t.ink }}>0 / 3</div>
            </div>
            <div style={{ fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted }}>Read 3 stories from creators you follow · ends in 7 days</div>
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
            <WBtn tk={tk} kind="coral" size="lg">
              Take me to my feed
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6"/></svg>
            </WBtn>
            <WBtn tk={tk} kind="outline" size="lg">Tour the app</WBtn>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

/* W8 · Auth wall (logged-out feed nudge) ────────────────────── */
function W_AuthWall({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-onb-authwall" label="W·A8 · Soft auth wall" width={1280} height={720}>
      <div style={{ width: 1280, height: 720, background: t.bg, position: 'relative' }}>
        <WHeader tk={tk} variant="auth"/>
        {/* Faded feed background */}
        <div style={{ position: 'absolute', top: 72, left: 0, right: 0, bottom: 0, opacity: 0.35, padding: '40px 80px', filter: 'blur(2px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            {['konkan', 'spiti', 'velas', 'thane', 'matheran', 'goa', 'bhandar', 'bandra'].map(k => (
              <WPhoto key={k} tk={tk} k={k} h={180} style={{ borderRadius: radius.lg }}/>
            ))}
          </div>
        </div>

        <div style={{ position: 'relative', maxWidth: 480, margin: '120px auto 0', padding: 36, background: t.surface, borderRadius: radius.xl, border: `1px solid ${t.hairline}`, boxShadow: '0 24px 64px rgba(20,20,30,0.15)' }}>
          <div style={{ width: 56, height: 56, borderRadius: 999, background: t.primaryTint, color: t.primary, display: 'grid', placeItems: 'center', marginBottom: 20 }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
          </div>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 30, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em', lineHeight: 1.1 }}>
            Save this trip for later
          </h2>
          <p style={{ marginTop: 10, marginBottom: 24, fontFamily: typ.body, fontSize: 14.5, color: t.inkSoft, lineHeight: 1.55 }}>
            Sign up free to save unlimited trips, follow creators, and unlock chapter-by-chapter reading. No credit card needed.
          </p>
          <WBtn tk={tk} kind="coral" size="lg" full>Sign up — 30 seconds</WBtn>
          <div style={{ marginTop: 12, textAlign: 'center', fontFamily: typ.body, fontSize: 13, color: t.inkMuted }}>
            Already have an account? <a style={{ color: t.ink, fontWeight: 600 }}>Sign in</a>
          </div>
        </div>
      </div>
    </DCArtboard>
  );
}

Object.assign(window, {
  W_Welcome, W_Phone, W_Otp,
  W_OnbLocation, W_OnbVerticals, W_OnbCreators, W_OnbCelebrate, W_AuthWall,
});
