// Pack B — Home feed, Discover, Search overlay, Filter sheet, Quests, Create sheet
// SRS: DISC-FR-001..034, CRT-FR-001..014

// Mini card for feed items
const FeedCard = ({ tk, kind, title, creator, tone, mins, meta, pinned }) => {
  const { t, typ, radius } = tk;
  const kindMeta = {
    itinerary: { label: 'Itinerary', icon: 'route' },
    story:     { label: 'Story',     icon: 'bookOpen' },
    experience:{ label: 'Experience',icon: 'ticket' },
    photo:     { label: 'Photo',     icon: 'camera' },
  }[kind];
  return (
    <div style={{
      background: t.surface, borderRadius: radius.lg, overflow: 'hidden',
      border: `1px solid ${t.hairline}`,
    }}>
      <div style={{ position: 'relative' }}>
        <Photo h={172} tk={tk} tone={tone} r={0}>
          <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
            <div style={{
              padding: '4px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.95)',
              fontFamily: typ.body, fontSize: 10, fontWeight: 700, color: t.ink,
              letterSpacing: '0.04em', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: 4,
            }}>
              <Icon name={kindMeta.icon} size={10} color={t.ink}/>
              {kindMeta.label}
            </div>
            {pinned && <Tag tone="coral" tk={tk} icon="star">Editor's pick</Tag>}
          </div>
          <div style={{ position: 'absolute', top: 10, right: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 999, background: 'rgba(255,255,255,0.95)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bookmark" size={14} color={t.ink}/>
            </div>
          </div>
        </Photo>
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
          <Avatar name={creator} size={22} color="#C47A5E" tk={tk}/>
          <span style={{ fontFamily: typ.body, fontSize: 12, color: t.ink, fontWeight: 600 }}>{creator}</span>
          <span style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted }}>· {meta}</span>
        </div>
        <div style={{ fontFamily: typ.display, fontSize: 19, lineHeight: 1.15, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>
          {title}
        </div>
        <div style={{ marginTop: 10, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: typ.body, fontSize: 11, color: t.inkMuted }}><Icon name="heart" size={13} color={t.inkMuted}/>342</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: typ.body, fontSize: 11, color: t.inkMuted }}><Icon name="chat" size={13} color={t.inkMuted}/>28</span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontFamily: typ.body, fontSize: 11, color: t.inkMuted }}><Icon name="clock" size={13} color={t.inkMuted}/>{mins}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── B1 Home feed ─────────────────────────────────────────────────────────────
const S_Home = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="B1 · Home" sublabel="DISC-FR-001..010 · editorial feed">
      <Shell tk={tk} bg={t.bg}>
        <div style={{
          padding: '52px 16px 10px', display: 'flex', alignItems: 'center', gap: 10,
          background: t.surface, borderBottom: `1px solid ${t.hairline}`,
        }}>
          <div style={{ flex: 1, fontFamily: typ.display, fontSize: 26, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>
            CreatorHub<span style={{ color: t.primary }}>.</span>
          </div>
          <HeaderIcon icon="magnifyingGlass" tk={tk}/>
          <HeaderIcon icon="bell" tk={tk} badge/>
        </div>

        {/* Segmented: For you / Following / Local */}
        <div style={{ padding: '12px 16px 8px', background: t.surface, borderBottom: `1px solid ${t.hairline}` }}>
          <Segmented tk={tk} full value="foryou" options={[
            { label: 'For you', value: 'foryou' },
            { label: 'Following', value: 'following' },
            { label: 'Near you', value: 'local' },
          ]}/>
        </div>

        <div style={{ overflowY: 'auto', height: 'calc(100% - 222px)', paddingBottom: 20 }}>
          {/* Hero chapter */}
          <div style={{ padding: '14px 16px 6px' }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, fontWeight: 600, color: t.primary, letterSpacing: '0.14em', textTransform: 'uppercase' }}>Featured chapter</div>
          </div>
          <div style={{ padding: '6px 16px 14px' }}>
            <div style={{ borderRadius: 14, overflow: 'hidden', background: t.surface, border: `1px solid ${t.hairline}` }}>
              <Photo h={190} tk={tk} tone="dusk" r={0}>
                <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 30%, rgba(0,0,0,0.6) 100%)' }}/>
                <div style={{ position: 'relative', padding: 14 }}>
                  <div style={{ fontFamily: typ.mono, fontSize: 9, color: '#fff', letterSpacing: '0.15em', textTransform: 'uppercase', opacity: 0.85 }}>Chapter 1 of 3</div>
                  <div style={{ fontFamily: typ.display, fontSize: 22, lineHeight: 1.1, color: '#fff', fontWeight: typ.displayWeightBold, marginTop: 4, letterSpacing: typ.displayTrack }}>
                    Three days in the Coorg mist
                  </div>
                </div>
              </Photo>
              <div style={{ padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Avatar name="A" size={28} color="#D17A5E" tk={tk}/>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.ink }}>Ananya Rao · 8 min</div>
                </div>
                <Btn tk={tk} variant="outline" size="sm" iconRight="arrowRight">Read</Btn>
              </div>
            </div>
          </div>

          {/* Quest strip */}
          <div style={{ padding: '6px 16px 14px' }}>
            <Card tk={tk} pad={14} style={{ background: t.ink, borderColor: t.ink, display: 'flex', gap: 12, alignItems: 'center' }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="flame" size={20} color="#fff" weight="fill"/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: typ.mono, fontSize: 9, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Weekly quest · 3 days left</div>
                <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 2 }}>Save 5 postcards from new cities</div>
                <div style={{ marginTop: 8 }}><Bar pct={60} tk={tk} color={t.primary} track="rgba(255,255,255,0.15)"/></div>
              </div>
              <div style={{ fontFamily: typ.mono, fontSize: 12, fontWeight: 600, color: '#fff' }}>3/5</div>
            </Card>
          </div>

          {/* Feed */}
          <div style={{ padding: '0 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <FeedCard tk={tk} kind="itinerary" title="Where to eat breakfast in old Bangalore" creator="Faraz A." meta="2h · Bengaluru" mins="6 min" tone="warm" pinned/>
            <FeedCard tk={tk} kind="story" title="A temple where I cried" creator="Nila I." meta="yesterday · Madurai" mins="4 min" tone="dusk"/>
            <FeedCard tk={tk} kind="experience" title="Sunrise on a fishing boat" creator="Sneha K." meta="2d · Goa" mins="₹1,200 · 3h" tone="coast"/>
          </div>
        </div>

        <BottomNav tk={tk} active="home" badge="you"/>
      </Shell>
    </Phone>
  );
};

// ── B2 Discover ─────────────────────────────────────────────────────────────
const S_Discover = ({ tk }) => {
  const { t, typ } = tk;
  const tiles = [
    { t:'Coffee trails', n: 212, tone:'warm' },
    { t:'Temple towns', n: 89, tone:'dusk' },
    { t:'Monsoon Konkan', n: 61, tone:'mist' },
    { t:'Street food', n: 340, tone:'ember' },
    { t:'Trek week', n: 94, tone:'pine' },
    { t:'Slow villages', n: 47, tone:'sand' },
  ];
  return (
    <Phone tk={tk} label="B2 · Discover" sublabel="DISC-FR-020..030 · themes">
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} title="Discover" actions={<><HeaderIcon icon="magnifyingGlass" tk={tk}/><HeaderIcon icon="funnel" tk={tk}/></>}/>

        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 150px)' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10 }}>Themes this week</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {tiles.map(x => (
              <div key={x.t} style={{ position: 'relative', height: 130, borderRadius: 14, overflow: 'hidden' }}>
                <Photo h={130} tk={tk} tone={x.tone} r={0}>
                  <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)' }}/>
                  <div style={{ position: 'relative' }}>
                    <div style={{ fontFamily: typ.display, fontSize: 17, lineHeight: 1.1, color: '#fff', fontWeight: typ.displayWeight, letterSpacing: typ.displayTrack }}>{x.t}</div>
                    <div style={{ fontFamily: typ.mono, fontSize: 10, color: 'rgba(255,255,255,0.8)', marginTop: 3 }}>{x.n} chapters</div>
                  </div>
                </Photo>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '20px 0 10px' }}>Creators near Bengaluru</div>
          <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 6 }}>
            {[
              { n:'Ananya', c:'#D17A5E' }, { n:'Faraz', c:'#B8946E' }, { n:'Maya', c:'#7A9B7E' }, { n:'Ravi', c:'#6B8CAE' }, { n:'Priya', c:'#C47A5E' },
            ].map(x => (
              <div key={x.n} style={{ flexShrink: 0, width: 96, padding: 10, borderRadius: 12, background: t.surface, border: `1px solid ${t.hairline}`, textAlign: 'center' }}>
                <Avatar name={x.n} color={x.c} size={48} tk={tk}/>
                <div style={{ fontFamily: typ.body, fontSize: 12, fontWeight: 600, color: t.ink, marginTop: 8 }}>{x.n}</div>
                <Btn tk={tk} variant="outline" size="sm"><span style={{ fontSize: 11 }}>Follow</span></Btn>
              </div>
            ))}
          </div>

          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '20px 0 10px' }}>Experiences</div>
          <Card tk={tk} pad={0} style={{ overflow: 'hidden' }}>
            <div style={{ display: 'flex', gap: 12, padding: 12 }}>
              <Photo h={78} w={78} r={8} tk={tk} tone="coast"/>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>Sat · Sun · 6AM</div>
                <div style={{ fontFamily: typ.display, fontSize: 16, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, marginTop: 2 }}>Sunrise fishing · Morjim</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  <span style={{ fontFamily: typ.body, fontSize: 13, color: t.ink, fontWeight: 600 }}>₹1,200</span>
                  <Tag tone="default" tk={tk} subtle>8 of 10 seats</Tag>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <BottomNav tk={tk} active="discover"/>
      </Shell>
    </Phone>
  );
};

// ── B3 Search overlay ────────────────────────────────────────────────────────
const S_Search = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="B3 · Search" sublabel="DISC-FR-033 · overlay + suggestions">
      <Shell tk={tk}>
        <div style={{ padding: '52px 12px 10px', display: 'flex', alignItems: 'center', gap: 8, background: t.surface, borderBottom: `1px solid ${t.hairline}` }}>
          <button style={{ width: 36, height: 36, border: 'none', background: 'transparent', cursor: 'pointer' }}>
            <Icon name="caretLeft" size={18} color={t.ink}/>
          </button>
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8, height: 40, padding: '0 12px', background: t.surfaceAlt, borderRadius: 999 }}>
            <Icon name="magnifyingGlass" size={16} color={t.inkMuted}/>
            <div style={{ flex: 1, fontFamily: typ.body, fontSize: 14, color: t.ink }}>
              coorg cof<span style={{ color: t.ink, borderLeft: `1.5px solid ${t.ink}`, marginLeft: 1, animation: 'blink 1s infinite', opacity: 0.9 }}>&nbsp;</span>
            </div>
            <Icon name="x" size={14} color={t.inkMuted}/>
          </div>
        </div>

        <div style={{ padding: '8px 16px', overflowY: 'auto', height: 'calc(100% - 110px)' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '8px 0 4px' }}>Suggestions</div>
          {[
            { i: 'magnifyingGlass', t: <><strong>coorg cof</strong>fee estates</>, s: '214 chapters' },
            { i: 'magnifyingGlass', t: <><strong>coorg cof</strong>fee trail in 48h</>, s: 'Itinerary · Ananya' },
            { i: 'mapPin', t: <>Coorg, Karnataka</>, s: 'Destination' },
            { i: 'user', t: <>Faraz Ahmed</>, s: 'Creator · Delhi' },
            { i: 'ticket', t: <>Kodava breakfast walk</>, s: 'Experience · ₹950' },
          ].map((s, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 0', borderBottom: `1px solid ${t.hairline}` }}>
              <div style={{ width: 36, height: 36, borderRadius: 999, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={s.i} size={16} color={t.ink}/>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: typ.body, fontSize: 14, color: t.ink }}>{s.t}</div>
                <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>{s.s}</div>
              </div>
              <Icon name="arrowUp" size={14} color={t.inkMuted}/>
            </div>
          ))}
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '16px 0 4px' }}>Recent</div>
          {['monsoon konkan', 'rooftop bars bangalore', 'ananya rao'].map(r => (
            <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0' }}>
              <Icon name="clock" size={14} color={t.inkMuted}/>
              <div style={{ flex: 1, fontFamily: typ.body, fontSize: 13, color: t.inkSoft }}>{r}</div>
              <Icon name="x" size={12} color={t.inkFaint}/>
            </div>
          ))}
        </div>
      </Shell>
    </Phone>
  );
};

// ── B4 Filter sheet ──────────────────────────────────────────────────────────
const S_Filter = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="B4 · Filters" sublabel="DISC-FR-034 · filter sheet">
      <Shell tk={tk}>
        <div style={{ padding: '52px 16px 12px', opacity: 0.35 }}>
          <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: typ.displayWeight, color: t.ink }}>Discover</div>
          <div style={{ height: 120, marginTop: 10, background: t.surfaceAlt, borderRadius: 10 }}/>
          <div style={{ height: 120, marginTop: 10, background: t.surfaceAlt, borderRadius: 10 }}/>
        </div>
        <Sheet tk={tk} title="Refine" onClose={() => {}}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Kind</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {[['All', true], ['Itineraries', false], ['Stories', true], ['Experiences', true], ['Photos', false]].map(([l, on]) => (
              <div key={l} style={{
                padding: '8px 14px', borderRadius: 999,
                border: `1px solid ${on ? t.ink : t.hairlineStrong}`,
                background: on ? t.ink : t.surface, color: on ? t.surface : t.ink,
                fontFamily: typ.body, fontSize: 12, fontWeight: 600,
              }}>{l}</div>
            ))}
          </div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Verticals</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            {['Travel', 'Food', 'Culture', 'Adventure', 'Music', 'Wildlife'].map((l, i) => (
              <div key={l} style={{
                padding: '8px 14px', borderRadius: 999,
                border: `1px solid ${i<3 ? t.ink : t.hairlineStrong}`,
                background: i<3 ? t.primaryTint : t.surface, color: i<3 ? t.primaryDeep : t.ink,
                fontFamily: typ.body, fontSize: 12, fontWeight: 600,
              }}>{l}</div>
            ))}
          </div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Duration</div>
          <Segmented tk={tk} full value="any" options={[
            { label: 'Any', value: 'any' }, { label: 'Day', value: 'day' }, { label: '2-3d', value: '3d' }, { label: '1w+', value: 'wk' },
          ]}/>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '20px 0 8px' }}>Budget</div>
          <div style={{ padding: '4px 0' }}>
            <div style={{ position: 'relative', height: 4, background: t.surfaceAlt, borderRadius: 999 }}>
              <div style={{ position: 'absolute', left: '20%', right: '30%', height: '100%', background: t.ink, borderRadius: 999 }}/>
              <div style={{ position: 'absolute', left: '20%', top: -7, width: 18, height: 18, borderRadius: 999, background: t.surface, border: `2px solid ${t.ink}`, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}/>
              <div style={{ position: 'absolute', left: '70%', top: -7, width: 18, height: 18, borderRadius: 999, background: t.surface, border: `2px solid ${t.ink}`, boxShadow: '0 1px 4px rgba(0,0,0,0.1)' }}/>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontFamily: typ.mono, fontSize: 11, color: t.inkSoft }}>
              <span>₹800</span><span>₹8,500</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
            <Btn tk={tk} variant="outline" size="md">Clear</Btn>
            <div style={{ flex: 1 }}>
              <Btn tk={tk} variant="primary" size="md" full>Show 218 results</Btn>
            </div>
          </div>
        </Sheet>
      </Shell>
    </Phone>
  );
};

// ── B5 Create sheet ──────────────────────────────────────────────────────────
const S_Create = ({ tk }) => {
  const { t, typ } = tk;
  const kinds = [
    { title: 'Quick post', body: 'A photo or thought. Under 60s.', icon: 'camera' },
    { title: 'Story', body: 'Long-form reader mode.', icon: 'bookOpen' },
    { title: 'Itinerary', body: 'Day-by-day, saveable.', icon: 'route' },
    { title: 'Experience', body: 'Bookable event.', icon: 'ticket' },
  ];
  return (
    <Phone tk={tk} label="B5 · Create" sublabel="CRT-FR-001..005 · kind picker">
      <Shell tk={tk}>
        <div style={{ padding: '52px 16px 12px', opacity: 0.3 }}>
          <div style={{ fontFamily: typ.display, fontSize: 22, color: t.ink }}>Home</div>
          <div style={{ height: 150, marginTop: 10, background: t.surfaceAlt, borderRadius: 10 }}/>
        </div>
        <Sheet tk={tk} title="What are you making?" onClose={() => {}}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {kinds.map((k, i) => (
              <Card key={k.title} tk={tk} pad={14} style={{ display: 'flex', gap: 14, alignItems: 'center', cursor: 'pointer',
                borderColor: i===2 ? t.ink : t.hairline,
              }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={k.icon} size={22} color={t.ink}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.display, fontSize: 17, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>{k.title}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{k.body}</div>
                </div>
                <Icon name="caretRight" size={16} color={t.inkMuted}/>
              </Card>
            ))}
          </div>
          <div style={{ marginTop: 16, padding: 12, borderRadius: 10, background: t.surfaceAlt, display: 'flex', gap: 10, alignItems: 'center' }}>
            <Icon name="info" size={16} color={t.inkSoft}/>
            <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.inkSoft, lineHeight: 1.5 }}>
              <strong style={{ color: t.ink }}>2 drafts</strong> waiting — open Studio to finish.
            </div>
            <Btn tk={tk} variant="text" size="sm" iconRight="arrowRight">Drafts</Btn>
          </div>
        </Sheet>
      </Shell>
    </Phone>
  );
};

// ── B6 Quests ──────────────────────────────────────────────────────────────
const S_Quests = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="B6 · Quests" sublabel="GAM-FR-010..020 · v1 preview">
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} back title="Quests" subtitle="V1 preview"/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 110px)' }}>
          <Card tk={tk} pad={16} style={{ background: t.ink, borderColor: t.ink }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.14em', textTransform: 'uppercase' }}>Active · 3 days left</div>
            <div style={{ fontFamily: typ.display, fontSize: 22, color: '#fff', fontWeight: typ.displayWeight, marginTop: 6, letterSpacing: typ.displayTrack }}>
              Save 5 postcards from new cities
            </div>
            <div style={{ marginTop: 14 }}><Bar pct={60} tk={tk} color={t.primary} track="rgba(255,255,255,0.15)"/></div>
            <div style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', fontFamily: typ.mono, fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
              <span>3 / 5</span><span>+150 XP · rare stamp</span>
            </div>
          </Card>

          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '20px 0 10px' }}>Creator quests</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { creator:'Ananya', name:'Find a hidden coffee estate', xp:100, prog:'1/3' },
              { creator:'Faraz', name:'Eat at 3 Delhi bylanes', xp:120, prog:'0/3' },
              { creator:'Nila', name:'Visit 5 Madurai temples', xp:200, prog:'2/5' },
            ].map(q => (
              <Card key={q.name} tk={tk} pad={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Avatar name={q.creator} size={32} color="#C47A5E" tk={tk}/>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted }}>{q.creator}'s quest</div>
                    <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink, marginTop: 1 }}>{q.name}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: typ.mono, fontSize: 11, fontWeight: 600, color: t.primary }}>+{q.xp}</div>
                    <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted }}>{q.prog}</div>
                  </div>
                </div>
              </Card>
            ))}
          </div>

          <div style={{
            marginTop: 20, padding: 14, borderRadius: 12, background: t.surfaceAlt,
            border: `1px dashed ${t.hairlineStrong}`,
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <Icon name="info" size={16} color={t.inkSoft}/>
            <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.inkSoft, lineHeight: 1.5 }}>
              <strong style={{ color: t.ink }}>V1 preview.</strong> Quests are MVP-optional per SRS. Toggle via Tweaks › Gamification.
            </div>
          </div>
        </div>
      </Shell>
    </Phone>
  );
};

Object.assign(window, { S_Home, S_Discover, S_Search, S_Filter, S_Create, S_Quests, FeedCard });
