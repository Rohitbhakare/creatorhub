// Pack H — Creator public page + Creator Studio (6 screens)
// SRS: CRT-FR-001..030, STUDIO-FR-*

// H1 — Creator public profile (viewed by a fan)
const S_CreatorPublic = ({ tk }) => {
  const { t, typ } = tk;
  const tabs = ['Itineraries','Stories','Experiences','Stops'];
  return (
    <Phone tk={tk} label="H1 · Creator · public" sublabel="CRT-FR-001">
      <Shell tk={tk} bg={t.bg}>
        <div style={{ position: 'relative', height: 200 }}>
          <Photo w="100%" h={200} tk={tk} tone="dusk" r={0}/>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.28) 0%, transparent 35%, rgba(0,0,0,0.55) 100%)' }}/>
          <div style={{ position: 'absolute', top: 52, left: 12, right: 12, display: 'flex', gap: 8, alignItems: 'center' }}>
            <HeaderIcon icon="caretLeft" tk={tk} light/>
            <div style={{ flex: 1 }}/>
            <HeaderIcon icon="share" tk={tk} light/>
            <HeaderIcon icon="bell" tk={tk} light/>
          </div>
        </div>
        <div style={{ padding: '0 16px', marginTop: -40, position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
            <Avatar tk={tk} name="MI" size={80} color={t.primary} ring/>
            <div style={{ flex: 1, paddingBottom: 4 }}>
              <Btn tk={tk} variant="primary" size="sm" full>+ Follow</Btn>
            </div>
          </div>
          <div style={{ marginTop: 12 }}>
            <div style={{ fontFamily: typ.display, fontSize: 26, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1.0 }}>Meera Iyer</div>
            <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 4, flexWrap: 'wrap' }}>
              <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted }}>@meera · Madikeri, Coorg</div>
              <Tag tone="success" subtle tk={tk} icon="checkCircle">Verified</Tag>
            </div>
            <p style={{ margin: '10px 0 12px', fontFamily: typ.body, fontSize: 13, color: t.inkSoft, lineHeight: 1.5 }}>
              Coffee grower · photo walks on weekends · collecting stories from the plantation roads.
            </p>
            <div style={{ display: 'flex', gap: 18, padding: '12px 0', borderTop: `1px solid ${t.hairline}`, borderBottom: `1px solid ${t.hairline}` }}>
              {[['42','Chapters'],['8.2K','Followers'],['1,204','Bookings'],['4.9','Rating']].map(([n,l]) => (
                <div key={l}>
                  <div style={{ fontFamily: typ.display, fontSize: 17, fontWeight: 600, color: t.ink, lineHeight: 1 }}>{n}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 10, color: t.inkMuted, marginTop: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{l}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ marginTop: 14, display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 10, borderBottom: `1px solid ${t.hairline}` }}>
            {tabs.map((x,i) => (
              <div key={x} style={{
                fontFamily: typ.body, fontSize: 13, fontWeight: i===0?700:500,
                color: i===0 ? t.ink : t.inkMuted, paddingBottom: 8,
                borderBottom: i===0 ? `2px solid ${t.primary}` : 'none', whiteSpace: 'nowrap',
              }}>{x}</div>
            ))}
          </div>
        </div>
        <div style={{ padding: 16, overflowY: 'auto' }}>
          {[
            { t:'Three days in the Coorg mist', s:'6 chapters · 42 min read', tone:'forest', tag:'Itinerary' },
            { t:'Coorg Coffee Trail', s:'Bookable · Sat 6 AM · ₹2,400', tone:'amber', tag:'Experience' },
          ].map((x,i) => (
            <Card key={i} tk={tk} pad={0} style={{ marginBottom: 10, overflow: 'hidden' }}>
              <div style={{ display: 'flex', gap: 12 }}>
                <Photo w={92} h={92} r={0} tk={tk} tone={x.tone}/>
                <div style={{ padding: '12px 12px 12px 0', flex: 1 }}>
                  <Tag tone="default" subtle tk={tk}>{x.tag}</Tag>
                  <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink, marginTop: 6 }}>{x.t}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>{x.s}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </Shell>
    </Phone>
  );
};

// H2 — Studio home (creator's dashboard)
const S_StudioHome = ({ tk }) => {
  const { t, typ } = tk;
  const metrics = [
    { l:'Earnings · this month', n:'₹24,820', d:'+18% vs last', tone:'success' },
    { l:'Bookings · this week', n:'12', d:'3 upcoming', tone:'default' },
    { l:'New followers · 7d', n:'+184', d:'4.2K total', tone:'default' },
    { l:'Pending payout', n:'₹8,400', d:'Clears Mon 14 Apr', tone:'warning' },
  ];
  return (
    <Phone tk={tk} label="H2 · Studio · home" sublabel="STUDIO-FR-001">
      <Shell tk={tk} bg={t.bg}>
        <div style={{ padding: '52px 16px 12px', background: t.surface, borderBottom: `1px solid ${t.hairline}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Studio</div>
            <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1 }}>Good morning, Meera</div>
          </div>
          <HeaderIcon icon="plusCircle" tk={tk}/>
        </div>
        <div style={{ overflowY: 'auto', height: 'calc(100% - 146px)' }}>
          <div style={{ padding: '14px 16px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {metrics.map(m => (
              <Card key={m.l} tk={tk} pad={14}>
                <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>{m.l}</div>
                <div style={{ fontFamily: typ.display, fontSize: 26, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1.05, marginTop: 6 }}>{m.n}</div>
                <div style={{ fontFamily: typ.body, fontSize: 11, color: m.tone==='success'?t.success:m.tone==='warning'?t.warning:t.inkSoft, marginTop: 4 }}>{m.d}</div>
              </Card>
            ))}
          </div>

          <div style={{ padding: '6px 16px 12px' }}>
            <Card tk={tk} pad={16}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                <div style={{ flex: 1, fontFamily: typ.body, fontSize: 13, fontWeight: 700, color: t.ink }}>Earnings · last 30 days</div>
                <Btn tk={tk} variant="text" size="sm" iconRight="caretRight">Details</Btn>
              </div>
              {/* tiny sparkline */}
              <svg viewBox="0 0 300 80" width="100%" height="80" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="sparkG" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0" stopColor={t.primary} stopOpacity="0.28"/>
                    <stop offset="1" stopColor={t.primary} stopOpacity="0"/>
                  </linearGradient>
                </defs>
                <path d="M0,60 L20,52 L40,58 L60,48 L80,40 L100,44 L120,32 L140,34 L160,26 L180,30 L200,18 L220,22 L240,14 L260,18 L280,8 L300,12 L300,80 L0,80Z" fill="url(#sparkG)"/>
                <path d="M0,60 L20,52 L40,58 L60,48 L80,40 L100,44 L120,32 L140,34 L160,26 L180,30 L200,18 L220,22 L240,14 L260,18 L280,8 L300,12" fill="none" stroke={t.primary} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round"/>
              </svg>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, marginTop: 6, letterSpacing: '0.06em' }}>
                <span>MAR 15</span><span>MAR 30</span><span>APR 13</span>
              </div>
            </Card>
          </div>

          <div style={{ padding: '0 16px 12px' }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Upcoming experiences</div>
            {[
              { d:'Sat 12', t:'Coorg Coffee Trail', p:'6 / 8 booked', s:'7:00 AM' },
              { d:'Sun 13', t:'Sunset Estate Walk', p:'3 / 6 booked', s:'5:30 PM' },
            ].map((x,i) => (
              <Card key={i} tk={tk} pad={12} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, textAlign: 'center' }}>
                  <div style={{ fontFamily: typ.display, fontSize: 18, fontWeight: 600, color: t.ink, lineHeight: 1 }}>{x.d.split(' ')[1]}</div>
                  <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: 2 }}>{x.d.split(' ')[0]}</div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>{x.t}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>{x.s} · {x.p}</div>
                </div>
                <Icon name="caretRight" size={14} color={t.inkMuted}/>
              </Card>
            ))}
          </div>

          <div style={{ padding: '0 16px 24px' }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Shortcuts</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { i:'plusCircle', l:'New chapter' },
                { i:'chartLine', l:'Insights' },
                { i:'wallet', l:'Payouts' },
                { i:'chat', l:'Messages' },
              ].map(s => (
                <Card key={s.l} tk={tk} pad={14} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Icon name={s.i} size={18} color={t.ink}/>
                  <div style={{ fontFamily: typ.body, fontSize: 12, fontWeight: 600, color: t.ink }}>{s.l}</div>
                </Card>
              ))}
            </div>
          </div>
        </div>
        <BottomNav tk={tk} active="studio"/>
      </Shell>
    </Phone>
  );
};

// H3 — Studio · Insights (analytics deep-dive)
const S_StudioInsights = ({ tk }) => {
  const { t, typ } = tk;
  const rows = [
    { t:'Three days in the Coorg mist', kind:'Itinerary', v:'12,480', d:'+42%', tone:'success' },
    { t:'Coorg Coffee Trail', kind:'Experience', v:'₹48,000', d:'24 bookings', tone:'default' },
    { t:'Mist chapter', kind:'Story', v:'8,102', d:'+18%', tone:'success' },
    { t:'Old Kodava kitchens', kind:'Story', v:'2,108', d:'−6%', tone:'danger' },
  ];
  return (
    <Phone tk={tk} label="H3 · Studio · insights" sublabel="STUDIO-FR-010">
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} back title="Insights" subtitle="Last 30 days"/>
        <div style={{ padding: '8px 16px 0', background: t.surface, borderBottom: `1px solid ${t.hairline}` }}>
          <Segmented full value="30" tk={tk} options={[{label:'7d',value:'7'},{label:'30d',value:'30'},{label:'90d',value:'90'},{label:'All',value:'a'}]}/>
        </div>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 148px)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 14 }}>
            {[
              { l:'Views', n:'48.2K' },
              { l:'Saves', n:'1,204' },
              { l:'Bookings', n:'₹78K' },
            ].map(m => (
              <Card key={m.l} tk={tk} pad={12}>
                <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{m.l}</div>
                <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: 600, color: t.ink, lineHeight: 1, marginTop: 4 }}>{m.n}</div>
              </Card>
            ))}
          </div>

          <Card tk={tk} pad={14} style={{ marginBottom: 14 }}>
            <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 700, color: t.ink, marginBottom: 12 }}>Views by content kind</div>
            {[
              { l:'Itineraries', pct: 62, v: '29.9K' },
              { l:'Stories', pct: 28, v: '13.5K' },
              { l:'Experiences', pct: 10, v: '4.8K' },
            ].map(x => (
              <div key={x.l} style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', fontFamily: typ.body, fontSize: 12, color: t.inkSoft, marginBottom: 4 }}>
                  <span style={{ flex: 1 }}>{x.l}</span>
                  <span style={{ fontFamily: typ.mono, color: t.ink, fontWeight: 600 }}>{x.v}</span>
                </div>
                <div style={{ height: 6, background: t.surfaceAlt, borderRadius: 999, overflow: 'hidden' }}>
                  <div style={{ width: x.pct+'%', height: '100%', background: t.primary, borderRadius: 999 }}/>
                </div>
              </div>
            ))}
          </Card>

          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Top content</div>
          <Card tk={tk} pad={0}>
            {rows.map((r,i) => (
              <div key={i} style={{ padding: 12, display: 'flex', alignItems: 'center', gap: 10, borderBottom: i<rows.length-1?`1px solid ${t.hairline}`:'none' }}>
                <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, width: 16 }}>{i+1}</div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 12, fontWeight: 600, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.t}</div>
                  <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, marginTop: 1 }}>{r.kind}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: typ.display, fontSize: 14, fontWeight: 600, color: t.ink }}>{r.v}</div>
                  <div style={{ fontFamily: typ.mono, fontSize: 10, color: r.tone==='success'?t.success:r.tone==='danger'?t.danger:t.inkMuted, marginTop: 1 }}>{r.d}</div>
                </div>
              </div>
            ))}
          </Card>
        </div>
      </Shell>
    </Phone>
  );
};

// H4 — Studio · Payouts & earnings
const S_StudioPayouts = ({ tk }) => {
  const { t, typ } = tk;
  const tx = [
    { d:'Apr 08', l:'Booking · Coorg Coffee Trail × 6', a:'+₹14,400', tone:'success' },
    { d:'Apr 05', l:'Tip · Vikas M.', a:'+₹500', tone:'success' },
    { d:'Apr 01', l:'Payout to HDFC ****6789', a:'−₹18,200', tone:'default' },
    { d:'Mar 29', l:'Booking · Sunset Estate Walk × 3', a:'+₹7,200', tone:'success' },
    { d:'Mar 24', l:'Sponsorship · Third Wave Coffee', a:'+₹15,000', tone:'success' },
  ];
  return (
    <Phone tk={tk} label="H4 · Studio · payouts" sublabel="STUDIO-FR-020">
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} back title="Earnings & payouts"/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 80px)' }}>
          <Card tk={tk} pad={20} style={{ background: t.ink, borderColor: t.ink }}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: 'rgba(255,255,255,0.6)', letterSpacing: '0.12em', textTransform: 'uppercase' }}>Available balance</div>
            <div style={{ fontFamily: typ.display, fontSize: 40, fontWeight: typ.displayWeight, color: '#fff', letterSpacing: typ.displayTrack, lineHeight: 1, marginTop: 8 }}>₹24,820</div>
            <div style={{ fontFamily: typ.body, fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 6 }}>Next auto-payout · <strong style={{ color:'#fff' }}>Mon 14 Apr</strong> to HDFC ****6789</div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <Btn tk={tk} variant="primary" size="sm">Withdraw now</Btn>
              <button style={{
                padding: '0 14px', height: 36, borderRadius: 8, border: '1px solid rgba(255,255,255,0.2)',
                background: 'transparent', color: '#fff', fontFamily: typ.body, fontSize: 13, fontWeight: 500, cursor: 'pointer',
              }}>Statement</button>
            </div>
          </Card>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
            <Card tk={tk} pad={12}>
              <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Lifetime</div>
              <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: 600, color: t.ink, marginTop: 4 }}>₹2,84,900</div>
            </Card>
            <Card tk={tk} pad={12}>
              <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Pending clear</div>
              <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: 600, color: t.warning, marginTop: 4 }}>₹4,200</div>
            </Card>
          </div>

          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '18px 0 8px' }}>Transactions</div>
          <Card tk={tk} pad={0}>
            {tx.map((x,i) => (
              <div key={i} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i<tx.length-1?`1px solid ${t.hairline}`:'none' }}>
                <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, width: 44 }}>{x.d}</div>
                <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.ink, minWidth: 0 }}>{x.l}</div>
                <div style={{ fontFamily: typ.display, fontSize: 13, fontWeight: 600, color: x.tone==='success'?t.success:t.ink }}>{x.a}</div>
              </div>
            ))}
          </Card>
        </div>
      </Shell>
    </Phone>
  );
};

// H5 — Studio · Messages (inbox for bookings + fans)
const S_StudioMessages = ({ tk }) => {
  const { t, typ } = tk;
  const threads = [
    { n:'Rohan D.', m:'Is there parking at the meetup point?', time:'2m', unread:true, tag:'Booking' },
    { n:'Tara K.', m:'Thanks! Loved the photo walk 🙏', time:'1h', unread:false, tag:'Booking' },
    { n:'Vikas M.', m:'Can I bring my kid (age 11)?', time:'3h', unread:true, tag:'Inquiry' },
    { n:'CreatorHub Support', m:'Your KYC is approved — you\'re ready to…', time:'yesterday', unread:false, tag:'System' },
    { n:'Priya S.', m:'Loved your Kodava kitchens piece!', time:'2d', unread:false, tag:'DM' },
  ];
  return (
    <Phone tk={tk} label="H5 · Studio · messages" sublabel="STUDIO-FR-025">
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} back title="Messages"/>
        <div style={{ padding: '8px 16px 12px', background: t.surface, borderBottom: `1px solid ${t.hairline}` }}>
          <Input tk={tk} placeholder="Search conversations" icon="magnifyingGlass"/>
        </div>
        <div style={{ overflowY: 'auto', height: 'calc(100% - 156px)' }}>
          {threads.map((th,i) => (
            <div key={i} style={{ padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'flex-start', background: th.unread ? t.surface : 'transparent', borderBottom: `1px solid ${t.hairline}` }}>
              <Avatar tk={tk} name={th.n[0]} size={44} color={t.primary}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ flex: 1, fontFamily: typ.body, fontSize: 14, fontWeight: th.unread?700:500, color: t.ink }}>{th.n}</div>
                  <div style={{ fontFamily: typ.mono, fontSize: 10, color: th.unread?t.primary:t.inkMuted }}>{th.time}</div>
                </div>
                <div style={{ marginTop: 2 }}><Tag tone={th.tag==='Booking'?'success':th.tag==='Inquiry'?'warning':'default'} subtle tk={tk}>{th.tag}</Tag></div>
                <div style={{ fontFamily: typ.body, fontSize: 12, color: th.unread?t.ink:t.inkMuted, marginTop: 6, lineHeight: 1.4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{th.m}</div>
              </div>
              {th.unread && <div style={{ width: 8, height: 8, borderRadius: 999, background: t.primary, marginTop: 8 }}/>}
            </div>
          ))}
        </div>
      </Shell>
    </Phone>
  );
};

// H6 — Studio · Single booking detail (creator view)
const S_StudioBooking = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="H6 · Studio · booking detail" sublabel="STUDIO-FR-028">
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} back title="Booking · CH-8821"/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 80px)' }}>
          <Card tk={tk} pad={16}>
            <Tag tone="success" subtle tk={tk} icon="checkCircle">Confirmed · paid</Tag>
            <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, marginTop: 10, lineHeight: 1.1 }}>Coorg Coffee Trail</div>
            <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>Sat 12 Apr · 7:00 AM · Madikeri</div>
            <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontFamily: typ.body }}>
              {[['Guests','6 of 8'],['Price per','₹2,400'],['Subtotal','₹14,400'],['Platform fee','−₹1,440']].map(([k,v]) => (
                <div key={k}>
                  <div style={{ fontSize: 10, color: t.inkMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontFamily: typ.mono }}>{k}</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.ink, marginTop: 2 }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '10px 12px', background: t.primaryTint, borderRadius: 8, display: 'flex', alignItems: 'center' }}>
              <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.primaryDeep, fontWeight: 600 }}>Your earnings</div>
              <div style={{ fontFamily: typ.display, fontSize: 18, fontWeight: 600, color: t.primaryDeep }}>₹12,960</div>
            </div>
          </Card>

          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '18px 0 8px' }}>Guests · 6</div>
          <Card tk={tk} pad={0}>
            {[
              { n:'Rohan Das', t:'2 seats · +1 guest', q:'Parking?', tone:'warning' },
              { n:'Tara Khan', t:'1 seat', q:null },
              { n:'Vikas Mehra', t:'2 seats · veg', q:null },
              { n:'Priya S.', t:'1 seat', q:null },
            ].map((g,i,arr) => (
              <div key={i} style={{ padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: i<arr.length-1?`1px solid ${t.hairline}`:'none' }}>
                <Avatar tk={tk} name={g.n[0]} size={34} color={t.primary}/>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>{g.n}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 1 }}>{g.t}</div>
                </div>
                {g.q && <Tag tone="warning" subtle tk={tk}>Question</Tag>}
                <Icon name="chat" size={16} color={t.inkSoft}/>
              </div>
            ))}
          </Card>

          <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
            <Btn tk={tk} variant="outline" size="md" full icon="chat">Message group</Btn>
            <Btn tk={tk} variant="dark" size="md" full icon="mapPin">Share location</Btn>
          </div>
        </div>
      </Shell>
    </Phone>
  );
};

Object.assign(window, { S_CreatorPublic, S_StudioHome, S_StudioInsights, S_StudioPayouts, S_StudioMessages, S_StudioBooking });
