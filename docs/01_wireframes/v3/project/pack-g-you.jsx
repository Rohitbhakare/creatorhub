// Pack G — You/Profile: viewer, edit, connected accounts, notifications, bookings
// SRS: PRF-FR-001..020, NOTIF-FR-*

const YouHeader = ({ tk, title = 'You' }) => {
  const { t, typ } = tk;
  return (
    <div style={{ padding: '52px 16px 12px', background: t.surface, borderBottom: `1px solid ${t.hairline}`, display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ flex: 1, fontFamily: typ.display, fontSize: 22, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>{title}</div>
      <HeaderIcon icon="bell" tk={tk} badge="3"/>
      <HeaderIcon icon="gear" tk={tk}/>
    </div>
  );
};

// G1 — Profile (self view)
const S_You = ({ tk }) => {
  const { t, typ } = tk;
  const tiles = [
    { i: 'bookmark', l: 'Saved', n: 24 },
    { i: 'ticket', l: 'Bookings', n: 4 },
    { i: 'checkCircle', l: 'Completed', n: 12 },
    { i: 'heart', l: 'Following', n: 38 },
  ];
  return (
    <Phone tk={tk} label="G1 · You" sublabel="PRF-FR-001">
      <Shell tk={tk} bg={t.bg}>
        <YouHeader tk={tk}/>
        <div style={{ overflowY: 'auto', height: 'calc(100% - 146px)' }}>
          <div style={{ padding: '18px 16px 8px', background: t.surface, borderBottom: `1px solid ${t.hairline}` }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
              <Avatar tk={tk} name="AS" size={64} color={t.primary}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1.05 }}>Aarav Sharma</div>
                <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>@aarav · Bengaluru</div>
                <div style={{ marginTop: 6 }}><Tag tone="success" subtle tk={tk} icon="checkCircle">Verified creator</Tag></div>
              </div>
            </div>
            <p style={{ margin: '14px 0 10px', fontFamily: typ.body, fontSize: 13, color: t.inkSoft, lineHeight: 1.5 }}>
              Writes about coffee, mist, and the Western Ghats. Runs weekend photo walks in Coorg.
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn tk={tk} variant="dark" size="sm" full>Edit profile</Btn>
              <Btn tk={tk} variant="outline" size="sm" icon="share"/>
            </div>
          </div>

          <div style={{ padding: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {tiles.map(x => (
              <Card key={x.l} tk={tk} pad={12} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={x.i} size={16} color={t.ink}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1 }}>{x.n}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>{x.l}</div>
                </div>
              </Card>
            ))}
          </div>

          <div style={{ padding: '4px 16px 12px' }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Account</div>
            <Card tk={tk} pad={0}>
              {[
                { i:'identification', l:'Creator profile', s:'Public page · aarav.creatorhub.in' },
                { i:'link', l:'Connected accounts', s:'Instagram, YouTube · 2 linked' },
                { i:'bell', l:'Notifications', s:'Booking alerts on · Weekly digest' },
                { i:'ticket', l:'My bookings', s:'4 upcoming · 1 this week' },
                { i:'wallet', l:'Payouts', s:'HDFC ****6789 · next Monday' },
                { i:'shield', l:'Privacy & data', s:null },
              ].map((r,i,arr) => (
                <div key={r.l} style={{ padding: '14px 14px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: i<arr.length-1?`1px solid ${t.hairline}`:'none' }}>
                  <div style={{ width: 32, height: 32, borderRadius: 8, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={r.i} size={16} color={t.inkSoft}/></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 500, color: t.ink }}>{r.l}</div>
                    {r.s && <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 1 }}>{r.s}</div>}
                  </div>
                  <Icon name="caretRight" size={14} color={t.inkMuted}/>
                </div>
              ))}
            </Card>
          </div>
        </div>
        <BottomNav tk={tk} active="you"/>
      </Shell>
    </Phone>
  );
};

// G2 — Edit profile
const S_YouEdit = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="G2 · Edit profile" sublabel="PRF-FR-005">
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} back title="Edit profile" actions={<Btn tk={tk} variant="primary" size="sm">Save</Btn>}/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 80px)' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', paddingBottom: 14 }}>
            <div style={{ position: 'relative' }}>
              <Avatar tk={tk} name="AS" size={88} color={t.primary}/>
              <div style={{ position: 'absolute', bottom: -2, right: -2, width: 30, height: 30, borderRadius: 999, background: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${t.surface}` }}>
                <Icon name="camera" size={14} color="#fff"/>
              </div>
            </div>
            <div style={{ marginTop: 8, fontFamily: typ.body, fontSize: 12, color: t.primary, fontWeight: 600 }}>Change photo</div>
          </div>
          <Field tk={tk} label="Display name"><Input tk={tk} value="Aarav Sharma"/></Field>
          <div style={{ marginTop: 14 }}><Field tk={tk} label="Handle" hint="creatorhub.in/@handle"><Input tk={tk} value="aarav" suffix=".creatorhub.in"/></Field></div>
          <div style={{ marginTop: 14 }}><Field tk={tk} label="Tagline" hint="One line · up to 70 chars"><Input tk={tk} value="Mist, coffee & the Western Ghats"/></Field></div>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 6 }}>Bio</div>
            <textarea defaultValue="Writes about coffee, mist, and the Western Ghats. Runs weekend photo walks in Coorg." style={{
              width: '100%', minHeight: 84, padding: 12, borderRadius: 10,
              border: `1.5px solid ${t.hairlineStrong}`, background: t.surface,
              fontFamily: typ.body, fontSize: 13, color: t.ink, lineHeight: 1.5, resize: 'none',
            }}/>
            <div style={{ fontFamily: typ.body, fontSize: 10, color: t.inkMuted, marginTop: 4, textAlign: 'right' }}>82 / 280</div>
          </div>
          <div style={{ marginTop: 14 }}><Field tk={tk} label="Home base"><Input tk={tk} value="Bengaluru, KA" icon="mapPin"/></Field></div>
          <div style={{ marginTop: 14 }}><Field tk={tk} label="Website"><Input tk={tk} value="aarav.substack.com" icon="link"/></Field></div>
          <div style={{ marginTop: 20, fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Topics · pick up to 5</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['Coffee','Travel','Photography','Food','Trekking','Books','Music','Culture','Nature','Film'].map((tag,i) => (
              <div key={tag} style={{
                padding: '7px 12px', borderRadius: 999, fontFamily: typ.body, fontSize: 12, fontWeight: 500,
                background: i<4 ? t.primary : t.surface, color: i<4 ? '#fff' : t.ink,
                border: `1px solid ${i<4 ? t.primary : t.hairlineStrong}`,
              }}>{tag}</div>
            ))}
          </div>
        </div>
      </Shell>
    </Phone>
  );
};

// G3 — Connected accounts
const S_YouConnected = ({ tk }) => {
  const { t, typ } = tk;
  const accts = [
    { n:'Instagram', h:'@aarav.walks', s:'12.4K followers · last sync 2h ago', c:'#E4405F', on:true, i:'camera' },
    { n:'YouTube', h:'Aarav Walks', s:'3.2K subs · last sync yesterday', c:'#FF0000', on:true, i:'videoCamera' },
    { n:'Substack', h:'aarav.substack.com', s:'Not connected', c:'#FF6719', on:false, i:'bookOpen' },
    { n:'Spotify', h:null, s:'Not connected', c:'#1DB954', on:false, i:'musicNotes' },
  ];
  return (
    <Phone tk={tk} label="G3 · Connected accounts" sublabel="PRF-FR-010">
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} back title="Connected accounts"/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 80px)' }}>
          <Card tk={tk} pad={14} style={{ background: t.primaryTint, borderColor: 'transparent', display: 'flex', gap: 10, marginBottom: 14 }}>
            <Icon name="info" size={16} color={t.primaryDeep}/>
            <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.primaryDeep, lineHeight: 1.5 }}>
              Connecting accounts lets you pull media into chapters and share new posts automatically.
            </div>
          </Card>
          {accts.map(a => (
            <Card key={a.n} tk={tk} pad={14} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: a.c, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={a.i} size={20} color="#fff"/>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink }}>{a.n}</div>
                {a.h && <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkSoft, marginTop: 1 }}>{a.h}</div>}
                <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>{a.s}</div>
              </div>
              {a.on ? <Toggle on tk={tk}/> : <Btn tk={tk} variant="outline" size="sm">Connect</Btn>}
            </Card>
          ))}
        </div>
      </Shell>
    </Phone>
  );
};

// G4 — Notifications inbox
const S_YouNotifs = ({ tk }) => {
  const { t, typ } = tk;
  const groups = [
    { h:'Today', items: [
      { i:'ticket', a:'Booking confirmed', s:'Meera Iyer · Coorg Coffee Trail · Sat 12 Apr', time:'2m', pri:true, unread:true },
      { i:'heart', a:'Rohan liked your itinerary', s:'Three days in the Coorg mist', time:'1h', unread:true },
      { i:'users', a:'3 new followers', s:'Tara, Vikas and 1 other', time:'3h', unread:true },
    ]},
    { h:'Earlier', items: [
      { i:'checkCircle', a:'KYC approved', s:'You can now accept paid bookings', time:'yesterday', pri:true },
      { i:'chat', a:'Comment on "Mist chapter"', s:'Meera: "Where\'s the homestay?"', time:'2d' },
      { i:'star', a:'New review · 5 stars', s:'Vikas on Coorg Coffee Trail', time:'3d' },
      { i:'bell', a:'Weekly digest', s:'3 new quests · 12 new chapters from creators you follow', time:'5d' },
    ]},
  ];
  return (
    <Phone tk={tk} label="G4 · Notifications" sublabel="NOTIF-FR-001">
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} back title="Notifications" actions={<Btn tk={tk} variant="text" size="sm">Mark read</Btn>}/>
        <div style={{ padding: '8px 0 0', background: t.surface, borderBottom: `1px solid ${t.hairline}` }}>
          <div style={{ padding: '0 16px' }}>
            <Segmented full value="all" tk={tk} options={[{label:'All',value:'all'},{label:'Bookings',value:'b'},{label:'Social',value:'s'},{label:'System',value:'sys'}]}/>
          </div>
        </div>
        <div style={{ overflowY: 'auto', height: 'calc(100% - 156px)' }}>
          {groups.map(g => (
            <div key={g.h}>
              <div style={{ padding: '14px 16px 6px', fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', background: t.bg }}>{g.h}</div>
              {g.items.map((n,i) => (
                <div key={i} style={{ padding: '12px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', background: n.unread ? t.surface : 'transparent', borderBottom: `1px solid ${t.hairline}` }}>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: n.pri ? t.primaryTint : t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name={n.i} size={16} color={n.pri ? t.primaryDeep : t.inkSoft}/>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'baseline' }}>
                      <div style={{ flex: 1, fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>{n.a}</div>
                      <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted }}>{n.time}</div>
                    </div>
                    <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkSoft, marginTop: 2, lineHeight: 1.4 }}>{n.s}</div>
                  </div>
                  {n.unread && <div style={{ width: 8, height: 8, borderRadius: 999, background: t.primary, flexShrink: 0, marginTop: 14 }}/>}
                </div>
              ))}
            </div>
          ))}
        </div>
      </Shell>
    </Phone>
  );
};

// G5 — My bookings (traveler side)
const S_YouBookings = ({ tk }) => {
  const { t, typ } = tk;
  const bookings = [
    { s:'upcoming', t:'Coorg Coffee Trail', c:'Meera Iyer', d:'Sat 12 Apr · 7:00 AM', loc:'Madikeri', status:'Confirmed', id:'CH-8821' },
    { s:'upcoming', t:'Dawn Light @ Nandi Hills', c:'Rohan Das', d:'Sun 20 Apr · 5:30 AM', loc:'Nandi Hills', status:'Confirmed', id:'CH-8844' },
    { s:'upcoming', t:'Old City Food Walk', c:'Tara Khan', d:'Fri 26 Apr · 6:00 PM', loc:'Bangalore', status:'Pay pending', pending:true, id:'CH-8856' },
  ];
  return (
    <Phone tk={tk} label="G5 · My bookings" sublabel="BKG-FR-012 · traveler">
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} back title="My bookings"/>
        <div style={{ padding: '8px 16px 0', background: t.surface, borderBottom: `1px solid ${t.hairline}` }}>
          <Segmented full value="up" tk={tk} options={[{label:'Upcoming · 4',value:'up'},{label:'Past · 12',value:'past'}]}/>
        </div>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 156px)' }}>
          {bookings.map(b => (
            <Card key={b.id} tk={tk} pad={0} style={{ marginBottom: 12, overflow: 'hidden' }}>
              <div style={{ padding: 14, display: 'flex', gap: 12 }}>
                <Photo w={56} h={56} r={8} tk={tk} tone="forest"/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink }}>{b.t}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>with {b.c} · {b.loc}</div>
                  <div style={{ marginTop: 6 }}><Tag tone={b.pending ? 'warning' : 'success'} subtle tk={tk}>{b.status}</Tag></div>
                </div>
              </div>
              <div style={{ padding: '10px 14px', background: t.surfaceAlt, borderTop: `1px solid ${t.hairline}`, display: 'flex', alignItems: 'center', gap: 10, fontFamily: typ.mono, fontSize: 11, color: t.inkSoft }}>
                <Icon name="calendar" size={14} color={t.inkSoft}/>
                <span>{b.d}</span>
                <span style={{ flex: 1 }}/>
                <span style={{ color: t.inkMuted }}>{b.id}</span>
                {!b.pending && <Btn tk={tk} variant="text" size="sm" iconRight="caretRight">Open</Btn>}
                {b.pending && <Btn tk={tk} variant="primary" size="sm">Pay now</Btn>}
              </div>
            </Card>
          ))}
        </div>
      </Shell>
    </Phone>
  );
};

Object.assign(window, { S_You, S_YouEdit, S_YouConnected, S_YouNotifs, S_YouBookings });
