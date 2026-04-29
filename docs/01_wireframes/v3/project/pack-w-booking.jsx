/* CreatorHub — Web · Booking flow
 * Review · Pay · Confirm */

/* W-K1 · Booking review — line-items + add-ons ──────────────── */
function W_BookReview({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-book-review" label="W·D1 · Booking · review" width={1280} height={1300}>
      <div style={{ width: 1280, minHeight: 1300, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>

        {/* Stepper */}
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 80px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
            {[
              { l: 'Review', on: true, done: false },
              { l: 'Pay', on: false, done: false },
              { l: 'Confirmed', on: false, done: false },
            ].map((s, i, arr) => (
              <React.Fragment key={s.l}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 999, display: 'grid', placeItems: 'center',
                    background: s.on ? t.ink : (s.done ? '#1D9E75' : t.surfaceAlt),
                    color: s.on || s.done ? '#fff' : t.inkMuted,
                    fontFamily: typ.mono, fontSize: 12, fontWeight: 700,
                  }}>{s.done ? '✓' : i + 1}</span>
                  <span style={{ fontFamily: typ.body, fontSize: 13.5, fontWeight: s.on ? 700 : 500, color: s.on ? t.ink : t.inkMuted }}>{s.l}</span>
                </div>
                {i < arr.length - 1 && <div style={{ flex: 1, height: 1, background: t.hairline, marginInline: 4 }}/>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1240, margin: '12px auto 0', padding: '0 80px 80px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 56 }}>
          <div>
            <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>Confirm your trip</div>
            <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 42, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.05, color: t.ink }}>
              Konkan in 4 quiet days,<br/><em style={{ fontStyle: 'italic', color: t.primary }}>14–22 February.</em>
            </h1>

            {/* Trip card */}
            <div style={{ marginTop: 32, padding: 22, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg, display: 'grid', gridTemplateColumns: '120px 1fr', gap: 20 }}>
              <WPhoto tk={tk} k="konkan" h={120} style={{ borderRadius: radius.md }}/>
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
                  <WPill tk={tk} kind="tint">Itinerary</WPill>
                  <WPill tk={tk} kind="tint">9 days</WPill>
                </div>
                <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>Konkan in 4 quiet days</div>
                <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 10, fontFamily: typ.body, fontSize: 13, color: t.inkSoft }}>
                  <WAvatar tk={tk} initials="AR" size={22} gradient={W_AVATARS.AR}/>
                  <span>by <strong style={{ color: t.ink }}>Aanya Ravi</strong> · ★ 4.92 (128)</span>
                </div>
                <div style={{ marginTop: 10, fontFamily: typ.body, fontSize: 13, color: t.inkMuted }}>Sat 14 Feb → Sun 22 Feb · 2 travellers</div>
              </div>
            </div>

            {/* Travellers */}
            <div style={{ marginTop: 36 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>Travellers</h2>
                <a style={{ fontFamily: typ.body, fontSize: 13, color: t.primary, fontWeight: 600 }}>+ Add traveller</a>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { id: 'YO', name: 'You · Ankit Khanna', meta: 'Lead · ankit@gmail.com · +91 98XXX 12 098', verified: true },
                  { id: 'PA', name: 'Priya Anand', meta: '+91 99XXX 45 110 · ID pending', verified: false },
                ].map((p, i) => (
                  <div key={i} style={{ padding: 16, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.md, display: 'flex', alignItems: 'center', gap: 12 }}>
                    <WAvatar tk={tk} initials={p.id} size={36} gradient={W_AVATARS.DP}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: typ.body, fontSize: 13.5, fontWeight: 600, color: t.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                        {p.name}
                        {p.verified && <span style={{ width: 13, height: 13, borderRadius: 999, background: '#1D9E75', color: '#fff', display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 700 }}>✓</span>}
                      </div>
                      <div style={{ fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{p.meta}</div>
                    </div>
                    {!p.verified && <span style={{ padding: '3px 8px', borderRadius: 999, background: '#FBE9C8', color: '#8A5B16', fontFamily: typ.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>NEEDS ID</span>}
                  </div>
                ))}
              </div>
            </div>

            {/* Add-ons */}
            <div style={{ marginTop: 36 }}>
              <h2 style={{ margin: '0 0 14px', fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>Add-on experiences</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { img: 'fishing', t: 'Dawn with the fishermen', d: 'Day 3 · 5h · 2 guests', p: '₹2,800', sel: true },
                  { img: 'bhandar', t: 'Konkani thali at Pendse home', d: 'Day 4 · 2h · 2 guests', p: '₹1,200', sel: false },
                  { img: 'velas', t: 'Velas turtle hatching', d: 'Day 6 · 3h · 2 guests', p: '₹2,400', sel: false },
                ].map((a, i) => (
                  <label key={i} style={{
                    display: 'grid', gridTemplateColumns: '70px 1fr auto auto', gap: 14, alignItems: 'center',
                    padding: 12, borderRadius: radius.md, cursor: 'pointer',
                    background: a.sel ? t.primaryTint : t.surface,
                    border: a.sel ? `1.5px solid ${t.primary}` : `1px solid ${t.hairline}`,
                  }}>
                    <WPhoto tk={tk} k={a.img} h={56} style={{ width: 70, borderRadius: radius.sm }}/>
                    <div>
                      <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink }}>{a.t}</div>
                      <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{a.d}</div>
                    </div>
                    <div style={{ fontFamily: typ.display, fontSize: 16, fontWeight: 600, color: t.ink, letterSpacing: '-0.01em' }}>{a.p}</div>
                    <span style={{
                      width: 24, height: 24, borderRadius: 999, display: 'grid', placeItems: 'center',
                      background: a.sel ? t.primary : 'transparent',
                      border: a.sel ? 0 : `1.5px solid ${t.hairlineStrong}`,
                    }}>
                      {a.sel && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Cancel policy */}
            <div style={{ marginTop: 36, padding: 22, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg }}>
              <h3 style={{ margin: 0, fontFamily: typ.display, fontSize: 18, fontWeight: 600, color: t.ink }}>Cancellation timeline</h3>
              <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 0 }}>
                {[
                  { l: 'Now → 7 Feb', sub: 'Full refund', c: '#1D9E75' },
                  { l: '7 Feb → 12 Feb', sub: '50% refund', c: '#C29033' },
                  { l: '12 Feb onwards', sub: 'Non-refundable', c: '#C44' },
                ].map((s, i) => (
                  <div key={i} style={{ paddingLeft: i ? 16 : 0, borderLeft: i ? `1px solid ${t.hairline}` : 0 }}>
                    <div style={{ width: 8, height: 8, borderRadius: 999, background: s.c, marginBottom: 8 }}/>
                    <div style={{ fontFamily: typ.body, fontSize: 12.5, fontWeight: 600, color: t.ink }}>{s.l}</div>
                    <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Summary rail */}
          <aside style={{ position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
            <div style={{ background: t.surface, border: `1px solid ${t.hairlineStrong}`, borderRadius: radius.lg, padding: 24, boxShadow: '0 8px 28px rgba(20,20,30,0.08)' }}>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 12 }}>Order summary</div>
              <div style={{ fontFamily: typ.body, fontSize: 13.5, color: t.inkSoft, lineHeight: 1.9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Itinerary · ₹38,200 × 2</span><span>₹76,400</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Dawn with fishermen × 2</span><span>₹2,800</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Service fee</span><span>₹3,160</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST 5%</span><span>₹4,118</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1D9E75', fontWeight: 600 }}><span>Creator credits</span><span>− ₹500</span></div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.hairline}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 700, color: t.ink }}>Total · INR</span>
                <span style={{ fontFamily: typ.display, fontSize: 28, fontWeight: 600, color: t.ink, letterSpacing: '-0.02em' }}>₹85,978</span>
              </div>
              <div style={{ marginTop: 4, fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted }}>or ₹14,330/mo · 6 EMI · 0% on HDFC, ICICI</div>

              <div style={{ marginTop: 18 }}>
                <WBtn tk={tk} kind="coral" full size="lg">
                  Continue to payment
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4"><polyline points="9 18 15 12 9 6"/></svg>
                </WBtn>
                <WBtn tk={tk} kind="outline" full size="md" style={{ marginTop: 8 }}>Hold this for 24 hours</WBtn>
              </div>

              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 8, fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted }}>
                <span style={{ width: 12, height: 12, borderRadius: 999, background: '#1D9E75', display: 'grid', placeItems: 'center', color: '#fff', fontSize: 8 }}>✓</span>
                <span>You won't be charged yet · price-locked for 24h</span>
              </div>
            </div>
          </aside>
        </div>
        <WFooter tk={tk}/>
      </div>
    </DCArtboard>
  );
}

/* W-K2 · Pay — method picker + UPI active ───────────────────── */
function W_BookPay({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-book-pay" label="W·D2 · Booking · pay" width={1280} height={1100}>
      <div style={{ width: 1280, minHeight: 1100, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>

        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 80px 0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 22 }}>
            {[
              { l: 'Review', done: true },
              { l: 'Pay', on: true },
              { l: 'Confirmed' },
            ].map((s, i, arr) => (
              <React.Fragment key={s.l}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 26, height: 26, borderRadius: 999, display: 'grid', placeItems: 'center',
                    background: s.on ? t.ink : (s.done ? '#1D9E75' : t.surfaceAlt),
                    color: s.on || s.done ? '#fff' : t.inkMuted,
                    fontFamily: typ.mono, fontSize: 12, fontWeight: 700,
                  }}>{s.done ? '✓' : i + 1}</span>
                  <span style={{ fontFamily: typ.body, fontSize: 13.5, fontWeight: s.on ? 700 : 500, color: s.on ? t.ink : t.inkMuted }}>{s.l}</span>
                </div>
                {i < arr.length - 1 && <div style={{ flex: 1, height: 1, background: t.hairline, marginInline: 4 }}/>}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ maxWidth: 1240, margin: '12px auto 0', padding: '0 80px 80px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 56 }}>
          <div>
            <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 36, fontWeight: 600, letterSpacing: '-0.02em', color: t.ink }}>How would you like to pay?</h1>

            {/* Method tabs */}
            <div style={{ marginTop: 22, display: 'flex', gap: 6 }}>
              {[
                { l: 'UPI', sub: 'Instant', on: true, icon: '⚡' },
                { l: 'Card', sub: 'Visa, Master, Rupay', on: false, icon: '💳' },
                { l: 'EMI', sub: '0% on HDFC, ICICI', on: false, icon: '📊' },
                { l: 'Net banking', sub: 'All major banks', on: false, icon: '🏦' },
                { l: 'Wallet', sub: 'PayTM, PhonePe', on: false, icon: '👛' },
              ].map(m => (
                <button key={m.l} style={{
                  flex: 1, padding: '14px 12px', borderRadius: radius.md, cursor: 'pointer',
                  background: m.on ? t.ink : t.surface,
                  color: m.on ? t.surface : t.ink,
                  border: m.on ? 0 : `1px solid ${t.hairline}`,
                  textAlign: 'left',
                }}>
                  <div style={{ fontSize: 16, marginBottom: 6 }}>{m.icon}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 700 }}>{m.l}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 10.5, opacity: 0.7, marginTop: 2 }}>{m.sub}</div>
                </button>
              ))}
            </div>

            {/* UPI panel */}
            <div style={{ marginTop: 14, padding: 28, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg }}>
              <div style={{ display: 'flex', gap: 28 }}>
                {/* QR card */}
                <div style={{ flex: '0 0 240px', padding: 20, background: t.bg, borderRadius: radius.md, textAlign: 'center', border: `1px solid ${t.hairline}` }}>
                  <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 12 }}>Scan with any UPI app</div>
                  <div style={{
                    width: 200, height: 200, margin: '0 auto', borderRadius: radius.sm,
                    background: '#fff', position: 'relative',
                    backgroundImage: `repeating-linear-gradient(0deg, ${t.ink} 0 4px, transparent 4px 8px), repeating-linear-gradient(90deg, ${t.ink} 0 4px, transparent 4px 8px)`,
                    backgroundSize: '8px 8px',
                  }}>
                    <div style={{ position: 'absolute', top: 8, left: 8, width: 36, height: 36, background: '#fff', border: `8px solid ${t.ink}`, borderRadius: 4 }}/>
                    <div style={{ position: 'absolute', top: 8, right: 8, width: 36, height: 36, background: '#fff', border: `8px solid ${t.ink}`, borderRadius: 4 }}/>
                    <div style={{ position: 'absolute', bottom: 8, left: 8, width: 36, height: 36, background: '#fff', border: `8px solid ${t.ink}`, borderRadius: 4 }}/>
                    <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 40, height: 40, borderRadius: 8, background: t.primary, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: typ.display, fontSize: 18, fontWeight: 700 }}>C</div>
                  </div>
                  <div style={{ marginTop: 12, fontFamily: typ.mono, fontSize: 11, color: t.inkSoft, fontWeight: 500 }}>creatorhub@hdfcbank</div>
                  <div style={{ marginTop: 10, padding: '6px 12px', background: t.primaryTint, color: t.primaryDeep, borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: typ.body, fontSize: 11.5, fontWeight: 600 }}>
                    <span style={{ width: 6, height: 6, borderRadius: 999, background: t.primary, animation: 'pulse 1.4s ease infinite' }}/>
                    Waiting for payment
                  </div>
                </div>

                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>Or pay via UPI ID</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                    <input value="ankit@okhdfcbank" readOnly style={{ flex: 1, padding: '14px 16px', borderRadius: radius.md, border: `1.5px solid ${t.hairlineStrong}`, fontFamily: typ.mono, fontSize: 14, color: t.ink, outline: 'none' }}/>
                    <WBtn tk={tk} kind="ink" size="md">Verify</WBtn>
                  </div>
                  <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 10 }}>Pay using app</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                    {[
                      { l: 'Google Pay', c: '#4285F4' },
                      { l: 'PhonePe', c: '#5F2D91' },
                      { l: 'Paytm', c: '#00BAF2' },
                      { l: 'BHIM', c: '#1D9E75' },
                    ].map(a => (
                      <button key={a.l} style={{ padding: '14px 10px', background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.md, cursor: 'pointer', textAlign: 'center' }}>
                        <div style={{ width: 32, height: 32, margin: '0 auto', borderRadius: 8, background: a.c, color: '#fff', display: 'grid', placeItems: 'center', fontFamily: typ.display, fontSize: 14, fontWeight: 700 }}>{a.l[0]}</div>
                        <div style={{ marginTop: 8, fontFamily: typ.body, fontSize: 11.5, fontWeight: 600, color: t.ink }}>{a.l}</div>
                      </button>
                    ))}
                  </div>

                  <div style={{ marginTop: 24, padding: 14, background: t.surfaceAlt, borderRadius: radius.md, fontFamily: typ.body, fontSize: 12, color: t.inkSoft, display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 14 }}>🔒</span>
                    <span>Razorpay-secured · 256-bit TLS · CreatorHub never sees your bank details.</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Split-pay nudge */}
            <div style={{ marginTop: 16, padding: 18, background: t.primaryTint, borderRadius: radius.lg, border: `1px solid ${t.primary}33`, display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 28 }}>👯</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 700, color: t.primaryDeep }}>Split it with Priya?</div>
                <div style={{ fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft, marginTop: 2 }}>You pay ₹42,989 now. Priya gets a payment link valid for 48 hours.</div>
              </div>
              <WBtn tk={tk} kind="outline" size="sm">Split 50/50</WBtn>
            </div>
          </div>

          {/* Summary */}
          <aside style={{ position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
            <div style={{ background: t.surface, border: `1px solid ${t.hairlineStrong}`, borderRadius: radius.lg, padding: 24, boxShadow: '0 8px 28px rgba(20,20,30,0.08)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <WPhoto tk={tk} k="konkan" h={48} style={{ width: 48, flex: '0 0 48px', borderRadius: radius.sm }}/>
                <div>
                  <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 700, color: t.ink }}>Konkan in 4 quiet days</div>
                  <div style={{ fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted }}>14–22 Feb · 2 travellers · 1 add-on</div>
                </div>
              </div>
              <div style={{ fontFamily: typ.body, fontSize: 13.5, color: t.inkSoft, lineHeight: 1.9 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Itinerary</span><span>₹76,400</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Add-on</span><span>₹2,800</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Service + GST</span><span>₹7,278</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1D9E75', fontWeight: 600 }}><span>Credits</span><span>− ₹500</span></div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.hairline}`, display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 700, color: t.ink }}>To pay now</span>
                <span style={{ fontFamily: typ.display, fontSize: 28, fontWeight: 600, color: t.ink, letterSpacing: '-0.02em' }}>₹85,978</span>
              </div>
              <div style={{ marginTop: 16, padding: 12, background: t.surfaceAlt, borderRadius: radius.sm, fontFamily: typ.mono, fontSize: 11, color: t.inkSoft, display: 'flex', justifyContent: 'space-between' }}>
                <span>Order #</span>
                <strong style={{ color: t.ink }}>CH-A8-2026-0214-7821</strong>
              </div>
            </div>
          </aside>
        </div>
        <WFooter tk={tk}/>
      </div>
    </DCArtboard>
  );
}

/* W-K3 · Booking confirm — celebratory ─────────────────────── */
function W_BookConfirm({ tk }) {
  const { t, typ, radius } = tk;
  return (
    <DCArtboard id="w-book-confirm" label="W·D3 · Booking · confirmed" width={1280} height={1300}>
      <div style={{ width: 1280, minHeight: 1300, background: t.bg }}>
        <WHeader tk={tk} variant="logged" activeNav={null}/>

        {/* Hero band */}
        <div style={{ position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${t.primaryTint} 0%, #FFF6F0 100%)`, padding: '64px 80px 56px', borderBottom: `1px solid ${t.hairline}` }}>
          {/* confetti dots */}
          {[
            { x: 8, y: 12, c: t.primary, s: 6 },
            { x: 18, y: 32, c: '#1D9E75', s: 4 },
            { x: 28, y: 8, c: '#C29033', s: 5 },
            { x: 70, y: 18, c: t.primary, s: 5 },
            { x: 80, y: 38, c: '#5F8FB8', s: 4 },
            { x: 88, y: 12, c: '#1D9E75', s: 6 },
            { x: 92, y: 60, c: t.primary, s: 4 },
            { x: 12, y: 70, c: '#C29033', s: 5 },
            { x: 60, y: 80, c: t.primary, s: 4 },
          ].map((d, i) => (
            <span key={i} style={{ position: 'absolute', left: `${d.x}%`, top: `${d.y}%`, width: d.s, height: d.s, borderRadius: 999, background: d.c, opacity: 0.6 }}/>
          ))}

          <div style={{ maxWidth: 1080, margin: '0 auto', position: 'relative' }}>
            <div style={{ width: 56, height: 56, borderRadius: 999, background: '#1D9E75', color: '#fff', display: 'grid', placeItems: 'center', marginBottom: 22, boxShadow: '0 8px 24px rgba(29,158,117,0.3)' }}>
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontFamily: typ.mono, fontSize: 11, color: '#1D9E75', fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 10 }}>You're booked</div>
            <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 64, fontWeight: 600, letterSpacing: '-0.025em', lineHeight: 1.0, color: t.ink }}>
              Konkan, here we come.<br/>
              <em style={{ fontStyle: 'italic', color: t.primary }}>February 14.</em>
            </h1>
            <div style={{ marginTop: 18, fontFamily: typ.body, fontSize: 15, color: t.inkSoft, maxWidth: 640, lineHeight: 1.5 }}>
              Confirmation sent to <strong style={{ color: t.ink }}>ankit@gmail.com</strong>. Aanya is notified — she usually replies within 4 hours with a welcome note and a quick Q&A.
            </div>

            <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
              <WBtn tk={tk} kind="ink" size="md">Add to calendar</WBtn>
              <WBtn tk={tk} kind="outline" size="md">Download itinerary PDF</WBtn>
              <WBtn tk={tk} kind="outline" size="md">Message Aanya</WBtn>
            </div>
          </div>
        </div>

        <div style={{ maxWidth: 1080, margin: '40px auto 0', padding: '0 80px 80px', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48 }}>
          <div>
            {/* Receipt card */}
            <div style={{ padding: 24, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg, boxShadow: '0 4px 12px rgba(20,20,30,0.04)' }}>
              <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
                <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>Receipt</h2>
                <span style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted }}>CH-A8-2026-0214-7821</span>
              </div>
              <div style={{ fontFamily: typ.body, fontSize: 13.5, color: t.inkSoft, lineHeight: 1.85 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Itinerary · Konkan in 4 quiet days × 2</span><span>₹76,400</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Add-on · Dawn with fishermen × 2</span><span>₹2,800</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Service fee</span><span>₹3,160</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>GST 5%</span><span>₹4,118</span></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#1D9E75', fontWeight: 600 }}><span>Creator credits applied</span><span>− ₹500</span></div>
              </div>
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${t.hairline}`, display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 700, color: t.ink }}>Paid via UPI · ankit@okhdfcbank</span>
                <span style={{ fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>₹85,978</span>
              </div>
            </div>

            {/* Pre-trip checklist */}
            <div style={{ marginTop: 24 }}>
              <h2 style={{ margin: '0 0 14px', fontFamily: typ.display, fontSize: 22, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>Before Feb 14</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { l: 'Verify Priya\'s ID', sub: 'We sent her a link · expires Feb 7', done: false, urgent: true },
                  { l: 'Read chapters 1–4 ahead of time', sub: 'Aanya recommends 30 min total', done: false },
                  { l: 'Pack list (sandals you can soak)', sub: 'PDF · creator-curated', done: true },
                  { l: 'Join the trip group chat', sub: '2 other travellers waiting', done: false },
                ].map((c, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 14, padding: 16,
                    background: t.surface, border: c.urgent ? `1.5px solid ${t.primary}` : `1px solid ${t.hairline}`,
                    borderRadius: radius.md,
                  }}>
                    <span style={{
                      width: 22, height: 22, borderRadius: 999, display: 'grid', placeItems: 'center',
                      background: c.done ? '#1D9E75' : 'transparent',
                      border: c.done ? 0 : `1.5px solid ${t.hairlineStrong}`,
                    }}>
                      {c.done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5"><polyline points="20 6 9 17 4 12"/></svg>}
                    </span>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink, textDecoration: c.done ? 'line-through' : 'none', opacity: c.done ? 0.55 : 1 }}>{c.l}</div>
                      <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{c.sub}</div>
                    </div>
                    {c.urgent && <span style={{ padding: '3px 9px', borderRadius: 999, background: t.primary, color: '#fff', fontFamily: typ.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.1em' }}>DO FIRST</span>}
                    {!c.done && !c.urgent && <a style={{ fontFamily: typ.body, fontSize: 12.5, color: t.primary, fontWeight: 600 }}>Open →</a>}
                  </div>
                ))}
              </div>
            </div>

            {/* Quest reward */}
            <div style={{ marginTop: 24, padding: 22, borderRadius: radius.lg, background: t.ink, color: '#fff', display: 'flex', alignItems: 'center', gap: 18 }}>
              <div style={{ width: 56, height: 56, borderRadius: 999, background: 'rgba(225,90,65,0.25)', color: t.primary, display: 'grid', placeItems: 'center', fontSize: 24 }}>🏆</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 4 }}>+ 250 XP earned</div>
                <div style={{ fontFamily: typ.display, fontSize: 18, fontWeight: 600, letterSpacing: '-0.01em' }}>"First booking" badge unlocked</div>
                <div style={{ fontFamily: typ.body, fontSize: 13, color: 'rgba(255,255,255,0.7)', marginTop: 4 }}>You're 350 XP from <strong style={{ color: '#fff' }}>Curious Beginner → Local Explorer</strong></div>
              </div>
              <WBtn tk={tk} kind="coral" size="md">View badges</WBtn>
            </div>
          </div>

          <aside style={{ position: 'sticky', top: 96, alignSelf: 'flex-start' }}>
            {/* Host card */}
            <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg, padding: 22, textAlign: 'center' }}>
              <WAvatar tk={tk} initials="AR" size={64} gradient={W_AVATARS.AR} style={{ margin: '0 auto 12px' }}/>
              <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>Hosted by</div>
              <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: 600, color: t.ink, letterSpacing: '-0.01em' }}>Aanya Ravi</div>
              <div style={{ fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted, marginTop: 4 }}>★ 4.92 · Replies in ~4 hr</div>
              <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <WBtn tk={tk} kind="ink" full size="sm">Message Aanya</WBtn>
                <WBtn tk={tk} kind="outline" full size="sm">Call · masked number</WBtn>
              </div>
            </div>

            {/* Refer */}
            <div style={{ marginTop: 14, padding: 18, borderRadius: radius.lg, background: `linear-gradient(135deg, ${t.primary} 0%, #C13D1F 100%)`, color: '#fff' }}>
              <div style={{ fontFamily: typ.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8, opacity: 0.85 }}>Bring a friend</div>
              <div style={{ fontFamily: typ.display, fontSize: 18, fontWeight: 600, lineHeight: 1.2 }}>Both get ₹500 credit when they book their first trip.</div>
              <button style={{ marginTop: 14, width: '100%', padding: '10px 14px', background: '#fff', color: t.primary, border: 0, borderRadius: 8, cursor: 'pointer', fontFamily: typ.body, fontSize: 13, fontWeight: 700 }}>Copy your link</button>
            </div>
          </aside>
        </div>
        <WFooter tk={tk}/>
      </div>
    </DCArtboard>
  );
}

Object.assign(window, { W_BookReview, W_BookPay, W_BookConfirm });
