// Pack I — Web mini-site (desktop) · CRT-FR-040
// The public web face of a verified creator, auto-generated from profile + content.
// Rendered as a labelled browser-chrome frame, 1040×820 max-height.

const BrowserChrome = ({ children, tk, url = 'meera.creatorhub.in' }) => {
  const { t, typ } = tk;
  return (
    <div style={{ width: 1040, background: '#E7E4DC', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)', border: `1px solid ${t.hairline}` }}>
      <div style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(0,0,0,0.08)' }}>
        <div style={{ display: 'flex', gap: 7 }}>
          <div style={{ width: 12, height: 12, borderRadius: 999, background: '#FF5F57' }}/>
          <div style={{ width: 12, height: 12, borderRadius: 999, background: '#FEBC2E' }}/>
          <div style={{ width: 12, height: 12, borderRadius: 999, background: '#28C840' }}/>
        </div>
        <div style={{
          flex: 1, background: '#F6F3EC', borderRadius: 7, padding: '6px 12px',
          display: 'flex', alignItems: 'center', gap: 8,
          fontFamily: typ.mono, fontSize: 12, color: '#5A564D',
          boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
        }}>
          <Icon name="lock" size={12} color="#6B6760"/>
          <span>{url}</span>
        </div>
        <div style={{ width: 64 }}/>
      </div>
      {children}
    </div>
  );
};

// I1 — Creator mini-site · home
const S_Website = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', bottom: '100%', left: 0, paddingBottom: 8, fontSize: 12, fontWeight: 500, color: 'rgba(60,50,40,0.7)', whiteSpace: 'nowrap' }}>I1 · meera.creatorhub.in</div>
      <BrowserChrome tk={tk}>
        <div style={{ background: t.surface, height: 760, overflow: 'hidden' }}>
          {/* nav */}
          <div style={{ padding: '18px 40px', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${t.hairline}` }}>
            <div style={{ flex: 1, fontFamily: typ.display, fontSize: 20, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>
              Meera Iyer<span style={{ color: t.primary }}>.</span>
            </div>
            <div style={{ display: 'flex', gap: 28, fontFamily: typ.body, fontSize: 14, color: t.inkSoft }}>
              {['Chapters','Experiences','Journal','About'].map(x => <span key={x} style={{ cursor: 'pointer' }}>{x}</span>)}
            </div>
            <div style={{ width: 28 }}/>
            <button style={{
              padding: '8px 14px', borderRadius: 8, background: t.ink, color: t.surface,
              border: 'none', fontFamily: typ.body, fontSize: 13, fontWeight: 600, cursor: 'pointer',
            }}>Follow</button>
          </div>

          {/* hero */}
          <div style={{ padding: '52px 40px 40px', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 36, alignItems: 'center' }}>
            <div>
              <div style={{ fontFamily: typ.mono, fontSize: 12, color: t.primary, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Coorg · since 2019</div>
              <h1 style={{ margin: '14px 0 16px', fontFamily: typ.display, fontSize: 64, lineHeight: 0.95, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>
                Stories from the<br/>plantation<em style={{ fontStyle: 'italic', color: t.primary }}> roads.</em>
              </h1>
              <p style={{ margin: 0, fontFamily: typ.body, fontSize: 17, lineHeight: 1.55, color: t.inkSoft, maxWidth: 460 }}>
                I grow coffee in Madikeri and write about the slow back-roads of Coorg. New chapters every Saturday. Photo walks open for booking.
              </p>
              <div style={{ marginTop: 24, display: 'flex', gap: 10 }}>
                <button style={{ padding: '12px 18px', background: t.primary, color: '#fff', border: 'none', borderRadius: 10, fontFamily: typ.body, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Read the latest chapter →</button>
                <button style={{ padding: '12px 18px', background: 'transparent', color: t.ink, border: `1.5px solid ${t.ink}`, borderRadius: 10, fontFamily: typ.body, fontSize: 14, fontWeight: 600, cursor: 'pointer' }}>Book a walk</button>
              </div>
            </div>
            <Photo w={420} h={420} tk={tk} tone="dusk" r={4}/>
          </div>

          {/* strip */}
          <div style={{ padding: '0 40px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20, padding: '22px 0', borderTop: `1px solid ${t.hairline}`, borderBottom: `1px solid ${t.hairline}` }}>
              {[['42','chapters'],['8.2K','readers'],['1,204','walks hosted'],['4.9','rating']].map(([n,l]) => (
                <div key={l}>
                  <div style={{ fontFamily: typ.display, fontSize: 30, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1 }}>{n}</div>
                  <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* latest chapters */}
          <div style={{ padding: '30px 40px' }}>
            <div style={{ display: 'flex', alignItems: 'baseline', marginBottom: 18 }}>
              <div style={{ flex: 1, fontFamily: typ.display, fontSize: 24, fontWeight: 600, color: t.ink, letterSpacing: typ.displayTrack }}>Latest chapters</div>
              <div style={{ fontFamily: typ.body, fontSize: 13, color: t.primary, fontWeight: 600, cursor: 'pointer' }}>See all 42 →</div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 18 }}>
              {[
                { t:'Three days in the Coorg mist', k:'Itinerary', d:'6 chapters · 42 min', tone:'forest' },
                { t:'Old Kodava kitchens', k:'Story', d:'8 min read', tone:'amber' },
                { t:'Dawn at Abbey Falls', k:'Story', d:'5 min read', tone:'dusk' },
              ].map((c,i) => (
                <div key={i}>
                  <Photo w="100%" h={180} tk={tk} tone={c.tone} r={4}/>
                  <div style={{ padding: '12px 0' }}>
                    <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 600 }}>{c.k}</div>
                    <div style={{ fontFamily: typ.display, fontSize: 19, fontWeight: 600, color: t.ink, marginTop: 6, lineHeight: 1.15, letterSpacing: typ.displayTrack }}>{c.t}</div>
                    <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 4 }}>{c.d}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </BrowserChrome>
    </div>
  );
};

// I2 — Mini-site booking (a public experience booking page)
const S_WebsiteExperience = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <div style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', bottom: '100%', left: 0, paddingBottom: 8, fontSize: 12, fontWeight: 500, color: 'rgba(60,50,40,0.7)', whiteSpace: 'nowrap' }}>I2 · meera.creatorhub.in/coffee-trail</div>
      <BrowserChrome tk={tk} url="meera.creatorhub.in/coffee-trail">
        <div style={{ background: t.bg, height: 760, overflow: 'hidden' }}>
          <div style={{ padding: '14px 40px', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${t.hairline}`, background: t.surface }}>
            <div style={{ flex: 1, fontFamily: typ.display, fontSize: 18, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>
              Meera Iyer<span style={{ color: t.primary }}>.</span>
            </div>
            <div style={{ display: 'flex', gap: 22, fontFamily: typ.body, fontSize: 13, color: t.inkSoft }}>
              {['Chapters','Experiences','Journal','About'].map(x => <span key={x}>{x}</span>)}
            </div>
          </div>

          <div style={{ padding: '28px 40px 0', display: 'grid', gridTemplateColumns: '1fr 360px', gap: 32 }}>
            <div>
              <Photo w="100%" h={320} tk={tk} tone="forest" r={4}/>
              <div style={{ marginTop: 20 }}>
                <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, letterSpacing: '0.16em', textTransform: 'uppercase', fontWeight: 600 }}>Experience · Coorg</div>
                <h1 style={{ margin: '8px 0 10px', fontFamily: typ.display, fontSize: 44, lineHeight: 1.02, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>
                  Coorg Coffee Trail <em style={{ fontStyle: 'italic', color: t.primary }}>at dawn.</em>
                </h1>
                <p style={{ margin: 0, fontFamily: typ.body, fontSize: 15, lineHeight: 1.55, color: t.inkSoft, maxWidth: 560 }}>
                  Four hours through my family's estate before the tourists wake up. You'll pick red cherries, meet the pickers, and finish on the roof with a filter coffee.
                </p>
                <div style={{ marginTop: 18, display: 'flex', gap: 22, fontFamily: typ.body, fontSize: 13 }}>
                  {[['Duration','4h'],['Group','up to 8'],['Rating','4.9 · 126']].map(([k,v]) => (
                    <div key={k}>
                      <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontSize: 15, fontWeight: 600, color: t.ink, marginTop: 3 }}>{v}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 24, fontFamily: typ.display, fontSize: 18, fontWeight: 600, color: t.ink }}>What you'll do</div>
                <div style={{ marginTop: 10, paddingLeft: 0 }}>
                  {[
                    'Meet at the gate · 6:45 AM',
                    'Cherry-picking walk through the main block',
                    'Depulper & fermentation yard',
                    'Filter coffee & breakfast on the old tile roof',
                  ].map((x,i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '8px 0', fontFamily: typ.body, fontSize: 13, color: t.inkSoft }}>
                      <div style={{ width: 20, height: 20, borderRadius: 999, background: t.primaryTint, color: t.primaryDeep, fontFamily: typ.mono, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{i+1}</div>
                      {x}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Booking card */}
            <div style={{ position: 'sticky', top: 20 }}>
              <Card tk={tk} pad={20} style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <div style={{ fontFamily: typ.display, fontSize: 32, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>₹2,400</div>
                  <div style={{ fontFamily: typ.body, fontSize: 13, color: t.inkMuted }}>per person</div>
                </div>
                <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 4 }}>All taxes included · cancel 48h free</div>

                <div style={{ marginTop: 18, border: `1px solid ${t.hairlineStrong}`, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', borderBottom: `1px solid ${t.hairlineStrong}` }}>
                    <div style={{ padding: 12, borderRight: `1px solid ${t.hairlineStrong}` }}>
                      <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Date</div>
                      <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink, marginTop: 3 }}>Sat 12 Apr</div>
                    </div>
                    <div style={{ padding: 12 }}>
                      <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Time</div>
                      <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink, marginTop: 3 }}>7:00 AM</div>
                    </div>
                  </div>
                  <div style={{ padding: 12 }}>
                    <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Guests</div>
                    <div style={{ display: 'flex', alignItems: 'center', marginTop: 3 }}>
                      <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink, flex: 1 }}>2 adults</div>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 999, border: `1px solid ${t.hairlineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>−</div>
                        <div style={{ width: 26, height: 26, borderRadius: 999, border: `1px solid ${t.hairlineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>+</div>
                      </div>
                    </div>
                  </div>
                </div>

                <button style={{
                  marginTop: 14, width: '100%', padding: '14px 0', background: t.primary, color: '#fff',
                  border: 'none', borderRadius: 10, fontFamily: typ.body, fontSize: 15, fontWeight: 700, cursor: 'pointer',
                }}>Book · ₹4,800</button>
                <div style={{ marginTop: 10, display: 'flex', gap: 6, alignItems: 'center', fontFamily: typ.body, fontSize: 11, color: t.inkMuted, justifyContent: 'center' }}>
                  <Icon name="shield" size={12} color={t.inkMuted}/>
                  Secure UPI/card via Razorpay · instant confirmation
                </div>
              </Card>
              <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: t.surface, borderRadius: 10, border: `1px solid ${t.hairline}` }}>
                <Avatar tk={tk} name="M" size={32} color={t.primary}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 12, fontWeight: 600, color: t.ink }}>Hosted by Meera</div>
                  <div style={{ fontFamily: typ.body, fontSize: 10, color: t.inkMuted }}>Verified · 1,204 walks hosted</div>
                </div>
                <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 600 }}>Message →</div>
              </div>
            </div>
          </div>
        </div>
      </BrowserChrome>
    </div>
  );
};

Object.assign(window, { S_Website, S_WebsiteExperience });
