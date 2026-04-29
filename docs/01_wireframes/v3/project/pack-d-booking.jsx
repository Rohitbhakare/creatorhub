// Pack D — Booking flow w/ 10-min seat hold timer
// SRS: BK-FR-001..012

// ── D1 Booking · review ──────────────────────────────────────────────────────
const S_BookingReview = ({ tk }) => {
  const { t, typ, radius } = tk;
  return (
    <Phone tk={tk} label="D1 · Review" sublabel="BK-FR-003 · seat + party">
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} back title="Review booking" subtitle="Step 1 of 3"/>
        <div style={{ padding: '12px 16px 100px', overflowY: 'auto', height: 'calc(100% - 170px)' }}>
          <Card tk={tk} pad={12} style={{ display: 'flex', gap: 12 }}>
            <Photo h={78} w={78} r={8} tk={tk} tone="coast"/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sat · 26 Apr · 5:40 AM</div>
              <div style={{ fontFamily: typ.display, fontSize: 17, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, marginTop: 2 }}>Sunrise on a fishing boat</div>
              <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkSoft, marginTop: 2 }}>Morjim · with Sneha K.</div>
            </div>
          </Card>

          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '20px 0 8px' }}>Party size</div>
          <Card tk={tk} pad={14} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: typ.body, fontSize: 14, color: t.ink, fontWeight: 600 }}>Guests</div>
              <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>Max 10 per boat · 8 left</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <button style={{ width: 32, height: 32, borderRadius: 999, border: `1px solid ${t.hairlineStrong}`, background: t.surface, cursor: 'pointer' }}><Icon name="minus" size={14} color={t.ink}/></button>
              <span style={{ fontFamily: typ.display, fontSize: 22, fontWeight: typ.displayWeightBold, color: t.ink, width: 28, textAlign: 'center' }}>2</span>
              <button style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: t.ink, cursor: 'pointer' }}><Icon name="plus" size={14} color="#fff"/></button>
            </div>
          </Card>

          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '20px 0 8px' }}>Lead guest</div>
          <Card tk={tk} pad={14}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Field tk={tk} label="Full name" required><Input tk={tk} value="Aarav Sharma" state="valid"/></Field>
              <Field tk={tk} label="Phone" required><Input tk={tk} value="+91 98765 43210" icon="phone"/></Field>
              <Field tk={tk} label="Email for tickets"><Input tk={tk} value="aarav@mail.com"/></Field>
            </div>
          </Card>

          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '20px 0 8px' }}>House rules</div>
          <Card tk={tk} pad={14} style={{ background: t.surfaceAlt, borderColor: 'transparent' }}>
            <div style={{ fontFamily: typ.body, fontSize: 12, lineHeight: 1.6, color: t.inkSoft }}>
              No alcohol on the boat. Life-jackets mandatory. Free cancellation up to 24h before. Full refund if the crew cancels for weather.
            </div>
          </Card>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>2 × ₹1,200</div>
            <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: typ.displayWeightBold, color: t.ink, letterSpacing: typ.displayTrack }}>₹2,400</div>
          </div>
          <div style={{ flex: 1 }}><Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">Hold seats · Pay</Btn></div>
        </div>
      </Shell>
    </Phone>
  );
};

// ── D2 Booking · seat hold payment ───────────────────────────────────────────
const S_BookingPay = ({ tk }) => {
  const { t, typ, radius } = tk;
  return (
    <Phone tk={tk} label="D2 · Payment" sublabel="BK-FR-007 · 10-min seat hold">
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} back title="Payment" subtitle="Step 2 of 3"/>
        {/* Seat hold timer banner */}
        <div style={{
          margin: '12px 16px 0', padding: '10px 14px', borderRadius: radius.md,
          background: t.primaryTint, border: `1px solid ${t.primary}33`,
          display: 'flex', alignItems: 'center', gap: 10,
        }}>
          <Icon name="clock" size={18} color={t.primaryDeep}/>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: typ.body, fontSize: 12, fontWeight: 600, color: t.primaryDeep }}>Seats held for you · 9:42</div>
            <div style={{ fontFamily: typ.body, fontSize: 11, color: t.primaryDeep, opacity: 0.85, marginTop: 1 }}>Complete payment before the timer runs out.</div>
          </div>
        </div>

        <div style={{ padding: '14px 16px 100px', overflowY: 'auto', height: 'calc(100% - 230px)' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Method</div>
          <Card tk={tk} pad={0}>
            {[
              { i:'bank', l:'UPI', s:'Pay via any UPI app', on: true },
              { i:'receipt', l:'Card', s:'Visa · Mastercard · Rupay', on: false },
              { i:'whatsapp', l:'WhatsApp Pay', s:'Send invoice to yourself', on: false },
            ].map(m => (
              <div key={m.l} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: 14,
                borderBottom: `1px solid ${t.hairline}`,
              }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={m.i} size={18} color={t.ink}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink }}>{m.l}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 1 }}>{m.s}</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: 999,
                  border: `1.5px solid ${m.on ? t.ink : t.hairlineStrong}`,
                  background: m.on ? t.ink : t.surface,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {m.on && <div style={{ width: 8, height: 8, borderRadius: 999, background: t.surface }}/>}
                </div>
              </div>
            ))}
          </Card>

          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '20px 0 8px' }}>Summary</div>
          <Card tk={tk} pad={14}>
            {[
              ['2 × Sunrise fishing', '₹2,400'],
              ['Platform fee', '₹60'],
              ['GST 5%', '₹123'],
            ].map(([l,v]) => (
              <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontFamily: typ.body, fontSize: 13, color: t.inkSoft }}>
                <span>{l}</span><span>{v}</span>
              </div>
            ))}
            <div style={{ marginTop: 8, paddingTop: 10, borderTop: `1px solid ${t.hairline}`, display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink }}>Total</span>
              <span style={{ fontFamily: typ.display, fontSize: 20, fontWeight: typ.displayWeightBold, color: t.ink, letterSpacing: typ.displayTrack }}>₹2,583</span>
            </div>
          </Card>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}` }}>
          <Btn tk={tk} variant="primary" size="lg" full>Pay ₹2,583 via UPI</Btn>
          <div style={{ textAlign: 'center', marginTop: 8, fontFamily: typ.body, fontSize: 11, color: t.inkMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
            <Icon name="shield" size={12} color={t.inkMuted}/> Secured by Razorpay · SSL
          </div>
        </div>
      </Shell>
    </Phone>
  );
};

// ── D3 Booking · confirmation ────────────────────────────────────────────────
const S_BookingConfirm = ({ tk }) => {
  const { t, typ, radius } = tk;
  return (
    <Phone tk={tk} label="D3 · Confirmed" sublabel="BK-FR-010 · ticket + postcard">
      <Shell tk={tk} bg={t.bg}>
        <div style={{ padding: '60px 24px 10px', textAlign: 'center' }}>
          <div style={{
            width: 64, height: 64, borderRadius: 999, background: t.primary,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: 16, boxShadow: `0 8px 30px ${t.primary}55`,
          }}>
            <Icon name="check" size={32} color="#fff" weight="bold"/>
          </div>
          <div style={{ fontFamily: typ.display, fontSize: 28, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1.05 }}>
            You're in.
          </div>
          <div style={{ fontFamily: typ.body, fontSize: 13, color: t.inkSoft, marginTop: 6 }}>
            Ticket #CH-1284 sent to your phone & email.
          </div>
        </div>

        <div style={{ padding: '16px 16px 100px', overflowY: 'auto' }}>
          <Card tk={tk} pad={0} style={{ overflow: 'hidden' }}>
            <div style={{ padding: 16, display: 'flex', gap: 12, borderBottom: `1px dashed ${t.hairlineStrong}` }}>
              <Photo h={70} w={70} r={8} tk={tk} tone="coast"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Sat · 26 Apr · 5:40 AM</div>
                <div style={{ fontFamily: typ.display, fontSize: 16, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, marginTop: 2 }}>Sunrise on a fishing boat</div>
                <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>Morjim · 2 seats</div>
              </div>
            </div>
            {/* perforation */}
            <div style={{ height: 10, position: 'relative', background: 'repeating-linear-gradient(90deg, '+t.hairline+' 0 4px, transparent 4px 8px)' }}/>
            <div style={{ padding: 16, display: 'flex', justifyContent: 'center' }}>
              <div style={{ width: 120, height: 120, background: t.ink, display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gridTemplateRows: 'repeat(12, 1fr)' }}>
                {Array.from({ length: 144 }).map((_, i) => (
                  <div key={i} style={{ background: Math.random() > 0.52 ? '#fff' : t.ink }}/>
                ))}
              </div>
            </div>
            <div style={{ padding: '0 16px 16px', textAlign: 'center', fontFamily: typ.mono, fontSize: 11, color: t.inkSoft }}>
              CH-1284 · show at pier 3
            </div>
          </Card>

          <Card tk={tk} pad={14} style={{ marginTop: 14, display: 'flex', gap: 12, alignItems: 'center', background: t.primaryTint, borderColor: 'transparent' }}>
            <div style={{ width: 46, height: 46, borderRadius: 10, background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="star" size={22} color={t.primary} weight="fill"/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.primaryDeep }}>Coastal Sunrise postcard earned</div>
              <div style={{ fontFamily: typ.body, fontSize: 11, color: t.primaryDeep, opacity: 0.8, marginTop: 1 }}>Unlocks in your passport after the trip.</div>
            </div>
          </Card>

          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <Btn tk={tk} variant="outline" size="md">Add to calendar</Btn>
            <Btn tk={tk} variant="outline" size="md">Share</Btn>
          </div>
          <div style={{ marginTop: 10 }}>
            <Btn tk={tk} variant="ghost" size="md" full iconRight="arrowRight">View in My Bookings</Btn>
          </div>
        </div>
      </Shell>
    </Phone>
  );
};

Object.assign(window, { S_BookingReview, S_BookingPay, S_BookingConfirm });
