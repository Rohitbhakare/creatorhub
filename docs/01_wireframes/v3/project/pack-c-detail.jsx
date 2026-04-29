// Pack C — Detail screens: Itinerary, Story (reader mode), Experience, Save sheet
// SRS: DISC-FR-040..060, BK-FR-001..005

// ── C1 Itinerary detail ──────────────────────────────────────────────────────
const S_Itinerary = ({ tk }) => {
  const { t, typ, radius } = tk;
  return (
    <Phone tk={tk} label="C1 · Itinerary" sublabel="chapters = days">
      <Shell tk={tk}>
        <div style={{ position: 'relative' }}>
          <Photo h={260} tk={tk} tone="dusk" r={0}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.4) 0%, transparent 40%, rgba(0,0,0,0.7) 100%)' }}/>
          </Photo>
          <div style={{ position: 'absolute', top: 52, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
            <HeaderIcon icon="caretLeft" tk={tk} light/>
            <div style={{ display: 'flex', gap: 8 }}>
              <HeaderIcon icon="share" tk={tk} light/>
              <HeaderIcon icon="bookmark" tk={tk} light/>
            </div>
          </div>
          <div style={{ position: 'absolute', bottom: 16, left: 16, right: 16 }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: 'rgba(255,255,255,0.85)', letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 6 }}>Itinerary · Coorg, Karnataka</div>
            <div style={{ fontFamily: typ.display, fontSize: 28, color: '#fff', lineHeight: 1.05, fontWeight: typ.displayWeightBold, letterSpacing: typ.displayTrack }}>
              Three days<br/><em style={{ fontStyle: 'italic' }}>in the Coorg mist</em>
            </div>
          </div>
        </div>
        <div style={{ overflowY: 'auto', height: 'calc(100% - 260px)', paddingBottom: 100 }}>
          <div style={{ padding: '14px 16px', borderBottom: `1px solid ${t.hairline}`, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Avatar name="A" color="#D17A5E" size={36} tk={tk}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>Ananya Rao</div>
              <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted }}>42.1k followers · Bengaluru</div>
            </div>
            <Btn tk={tk} variant="dark" size="sm">Follow</Btn>
          </div>
          <div style={{ padding: '14px 16px', display: 'flex', gap: 16, borderBottom: `1px solid ${t.hairline}`, fontFamily: typ.body, fontSize: 12, color: t.inkSoft }}>
            <div><Icon name="clock" size={12} color={t.inkMuted}/> 3 days</div>
            <div><Icon name="currencyInr" size={12} color={t.inkMuted}/> ₹6,200</div>
            <div><Icon name="route" size={12} color={t.inkMuted}/> 148 km</div>
          </div>

          {[
            { d:'Day 1', t:'Arrive in the mist', stops: 4, tone:'dusk' },
            { d:'Day 2', t:'Coffee with Devaiah', stops: 5, tone:'warm' },
            { d:'Day 3', t:'Abbi Falls at dawn', stops: 3, tone:'forest' },
          ].map((c, i) => (
            <div key={i} style={{ padding: '14px 16px', borderBottom: `1px solid ${t.hairline}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 999, background: t.ink, color: t.surface,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: typ.mono, fontSize: 11, fontWeight: 700,
                }}>{i+1}</div>
                <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{c.d} · {c.stops} stops</div>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Photo h={86} w={86} r={8} tk={tk} tone={c.tone}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.display, fontSize: 18, lineHeight: 1.15, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>{c.t}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 4, lineHeight: 1.5 }}>
                    Breakfast at the estate, then a 3km walk through canopy trails…
                  </div>
                  <div style={{ marginTop: 6, display: 'flex', gap: 6 }}>
                    <Tag tone="default" tk={tk} subtle>Easy</Tag>
                    <Tag tone="default" tk={tk} subtitle="coral" subtle>Postcard reward</Tag>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}`, display: 'flex', gap: 10 }}>
          <Btn tk={tk} variant="ghost" size="md" icon="bookmark">Save</Btn>
          <div style={{ flex: 1 }}><Btn tk={tk} variant="primary" size="md" full>Start chapter 1</Btn></div>
        </div>
      </Shell>
    </Phone>
  );
};

// ── C2 Story / reader mode ───────────────────────────────────────────────────
const S_Story = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="C2 · Reader" sublabel="long-form story">
      <Shell tk={tk}>
        <AppHeader tk={tk} back title="Reader" actions={<><HeaderIcon icon="sliders" tk={tk}/><HeaderIcon icon="bookmark" tk={tk}/></>}/>
        <div style={{ overflowY: 'auto', height: 'calc(100% - 110px)', padding: '10px 24px 40px' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8 }}>Story · Madurai</div>
          <h1 style={{
            margin: 0, fontFamily: typ.display, fontSize: 34, lineHeight: 1, fontWeight: typ.displayWeight,
            color: t.ink, letterSpacing: typ.displayTrack,
          }}>
            A temple where<br/><em style={{ fontStyle: 'italic' }}>I cried.</em>
          </h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 14 }}>
            <Avatar name="N" size={28} color="#7A9B7E" tk={tk}/>
            <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkSoft }}>Nila Iyer · 4 min · yesterday</div>
          </div>
          <Photo h={180} tk={tk} tone="dusk" r={10}/>
          <p style={{
            fontFamily: typ.body, fontSize: 16, lineHeight: 1.7, color: t.ink,
            marginTop: 18,
          }}>
            <span style={{
              fontFamily: typ.display, fontSize: 54, float: 'left', lineHeight: 0.85,
              marginRight: 6, marginTop: 4, color: t.primary, fontWeight: typ.displayWeightBold,
            }}>T</span>
            he priests said we could sit in the second corridor. I remember the stone being cool against my palm at 4am, the air thick with camphor. My grandmother had described this exact spot fifty years ago.
          </p>
          <p style={{ fontFamily: typ.body, fontSize: 16, lineHeight: 1.7, color: t.ink }}>
            Nothing had changed. Everything had changed. I was not sure which of us was the ghost.
          </p>
          <div style={{
            margin: '20px 0', padding: '14px 16px', borderLeft: `3px solid ${t.primary}`,
            background: t.primaryTint,
            fontFamily: typ.display, fontSize: 19, lineHeight: 1.35, color: t.primaryDeep,
            fontStyle: 'italic', fontWeight: typ.displayWeight, letterSpacing: typ.displayTrack,
          }}>
            “You don't visit this temple. You apologise to it.”
          </div>
          <p style={{ fontFamily: typ.body, fontSize: 16, lineHeight: 1.7, color: t.ink }}>
            By the time the first bell rang I had already been there a lifetime and none at all…
          </p>
        </div>
        <div style={{
          position: 'absolute', bottom: 20, left: '50%', transform: 'translateX(-50%)',
          display: 'flex', gap: 6, background: t.ink, borderRadius: 999, padding: 5,
          boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
        }}>
          <button style={{ width: 36, height: 36, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 999 }}><Icon name="heart" size={18} color="#fff"/></button>
          <button style={{ width: 36, height: 36, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 999 }}><Icon name="chat" size={18} color="#fff"/></button>
          <button style={{ width: 36, height: 36, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 999 }}><Icon name="bookmark" size={18} color="#fff"/></button>
          <button style={{ width: 36, height: 36, border: 'none', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', borderRadius: 999 }}><Icon name="share" size={18} color="#fff"/></button>
        </div>
      </Shell>
    </Phone>
  );
};

// ── C3 Experience (bookable) ─────────────────────────────────────────────────
const S_Experience = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="C3 · Experience" sublabel="bookable event">
      <Shell tk={tk}>
        <div style={{ position: 'relative' }}>
          <Photo h={230} tk={tk} tone="coast" r={0}/>
          <div style={{ position: 'absolute', top: 52, left: 16, right: 16, display: 'flex', justifyContent: 'space-between' }}>
            <HeaderIcon icon="caretLeft" tk={tk} light/>
            <HeaderIcon icon="share" tk={tk} light/>
          </div>
        </div>
        <div style={{ overflowY: 'auto', height: 'calc(100% - 330px)', paddingBottom: 16 }}>
          <div style={{ padding: '16px 20px 10px' }}>
            <Tag tone="coral" tk={tk}>8 of 10 seats left</Tag>
            <h1 style={{ margin: '10px 0 2px', fontFamily: typ.display, fontSize: 26, lineHeight: 1.05, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>
              Sunrise on a fishing boat
            </h1>
            <div style={{ fontFamily: typ.body, fontSize: 13, color: t.inkMuted }}>Morjim, Goa · with Sneha Kaur</div>
          </div>
          <div style={{ padding: '10px 20px', display: 'flex', gap: 14, borderBottom: `1px solid ${t.hairline}`, fontFamily: typ.body, fontSize: 12, color: t.inkSoft }}>
            <div><Icon name="clock" size={12} color={t.inkMuted}/> 3h</div>
            <div><Icon name="users" size={12} color={t.inkMuted}/> Max 10</div>
            <div><Icon name="calendar" size={12} color={t.inkMuted}/> Sat · Sun</div>
          </div>
          <div style={{ padding: '14px 20px' }}>
            <p style={{ margin: 0, fontFamily: typ.body, fontSize: 14, lineHeight: 1.6, color: t.ink }}>
              Meet Ashok's crew at 5:40am. You'll row out with them past the sandbar, pull in the first cast, then drink chai on the deck as the sun cracks open over the Arabian Sea.
            </p>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '18px 0 8px' }}>Pick a date</div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
              {[['Sat', '26', true], ['Sun', '27', false], ['Sat', '3', false], ['Sun', '4', false]].map(([d, n, on], i) => (
                <div key={i} style={{
                  flexShrink: 0, width: 58, padding: '10px 0', borderRadius: 10,
                  border: `1.5px solid ${on ? t.ink : t.hairlineStrong}`,
                  background: on ? t.ink : t.surface, color: on ? t.surface : t.ink,
                  textAlign: 'center',
                }}>
                  <div style={{ fontFamily: typ.mono, fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', opacity: 0.7 }}>{d}</div>
                  <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: typ.displayWeight, marginTop: 2 }}>{n}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}`, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div>
            <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>From</div>
            <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: typ.displayWeightBold, color: t.ink, letterSpacing: typ.displayTrack }}>₹1,200</div>
          </div>
          <div style={{ flex: 1 }}><Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">Book · 2 seats</Btn></div>
        </div>
      </Shell>
    </Phone>
  );
};

// ── C4 Save sheet ────────────────────────────────────────────────────────────
const S_SaveSheet = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="C4 · Save" sublabel="collection picker">
      <Shell tk={tk}>
        <div style={{ padding: '52px 16px 12px', opacity: 0.35 }}>
          <div style={{ height: 200, background: t.surfaceAlt, borderRadius: 12 }}/>
          <div style={{ marginTop: 10, height: 12, width: '70%', background: t.surfaceAlt, borderRadius: 4 }}/>
          <div style={{ marginTop: 8, height: 12, width: '90%', background: t.surfaceAlt, borderRadius: 4 }}/>
        </div>
        <Sheet tk={tk} title="Save to…" onClose={() => {}}>
          <Input tk={tk} icon="magnifyingGlass" placeholder="Find or create a collection"/>
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column' }}>
            {[
              { n: 'Monsoon wishlist', c: 24, on: true },
              { n: 'Weekend escapes', c: 12, on: false },
              { n: 'Food crawls', c: 38, on: false },
              { n: 'Read later', c: 7, on: false },
            ].map(col => (
              <div key={col.n} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0',
                borderBottom: `1px solid ${t.hairline}`,
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="bookmark" size={18} color={t.inkSoft}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink }}>{col.n}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{col.c} items</div>
                </div>
                <div style={{
                  width: 22, height: 22, borderRadius: 6,
                  border: `1.5px solid ${col.on ? t.ink : t.hairlineStrong}`,
                  background: col.on ? t.ink : t.surface,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {col.on && <Icon name="check" size={14} color="#fff"/>}
                </div>
              </div>
            ))}
            <div style={{ padding: '12px 0' }}>
              <Btn tk={tk} variant="outline" size="md" icon="plus" full>New collection</Btn>
            </div>
          </div>
          <div style={{ marginTop: 8 }}>
            <Btn tk={tk} variant="primary" size="lg" full>Save</Btn>
          </div>
        </Sheet>
      </Shell>
    </Phone>
  );
};

Object.assign(window, { S_Itinerary, S_Story, S_Experience, S_SaveSheet });
