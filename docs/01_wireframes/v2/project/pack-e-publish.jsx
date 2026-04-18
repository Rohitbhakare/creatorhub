// Pack E — Publishing wizard (5 steps) · CRT-FR-015..020

const WizHeader = ({ step, total, title, tk, onBack }) => {
  const { t, typ } = tk;
  return (
    <>
      <div style={{ padding: '52px 16px 8px', background: t.surface, display: 'flex', alignItems: 'center', gap: 10 }}>
        <button onClick={onBack} style={{ width: 32, height: 32, border: 'none', background: t.surfaceAlt, borderRadius: 999, cursor: 'pointer' }}><Icon name="x" size={16} color={t.ink}/></button>
        <div style={{ flex: 1, fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink, textAlign: 'center' }}>{title}</div>
        <Btn tk={tk} variant="text" size="sm">Save draft</Btn>
      </div>
      <div style={{ padding: '8px 16px 10px', background: t.surface, borderBottom: `1px solid ${t.hairline}` }}>
        <Steps current={step} total={total} tk={tk}/>
        <div style={{ marginTop: 6, fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Step {step} of {total}</div>
      </div>
    </>
  );
};

// E1 · Kind already picked (Itinerary). Outline step.
const S_PubOutline = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="E1 · Publish · Outline" sublabel="CRT-FR-015 · chapters">
      <Shell tk={tk} bg={t.bg}>
        <WizHeader step={1} total={5} title="New itinerary" tk={tk}/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 192px)' }}>
          <Field tk={tk} label="Title" required>
            <Input tk={tk} value="Three days in the Coorg mist" state="valid"/>
          </Field>
          <div style={{ marginTop: 14 }}>
            <Field tk={tk} label="Where" required>
              <Input tk={tk} icon="mapPin" value="Coorg, Karnataka"/>
            </Field>
          </div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '20px 0 10px' }}>Chapters (days)</div>
          {['Day 1 · Arrive in the mist', 'Day 2 · Coffee with Devaiah', 'Day 3 · Abbi Falls at dawn'].map((c,i) => (
            <Card key={i} tk={tk} pad={12} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 26, height: 26, borderRadius: 999, background: t.ink, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: typ.mono, fontSize: 11, fontWeight: 700 }}>{i+1}</div>
              <div style={{ flex: 1, fontFamily: typ.body, fontSize: 13, color: t.ink }}>{c}</div>
              <Icon name="dotsThree" size={16} color={t.inkMuted}/>
            </Card>
          ))}
          <Btn tk={tk} variant="outline" size="md" full icon="plus">Add chapter</Btn>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}` }}>
          <Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">Continue</Btn>
        </div>
      </Shell>
    </Phone>
  );
};

// E2 Stops within a chapter
const S_PubStops = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="E2 · Publish · Stops" sublabel="add places per chapter">
      <Shell tk={tk} bg={t.bg}>
        <WizHeader step={2} total={5} title="Day 1 · Stops" tk={tk}/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 192px)' }}>
          {[
            { t:'Abbi Falls viewpoint', s:'9:30 · 45 min · free', icon:'mountains' },
            { t:'Raja\'s Seat', s:'11:00 · 30 min · ₹40', icon:'mapPin' },
            { t:'Lunch at Coorg Cuisinette', s:'13:00 · 90 min · ~₹600', icon:'forkKnife' },
            { t:'Estate walk with host', s:'16:00 · 2h · ₹300', icon:'route' },
          ].map((s,i) => (
            <Card key={i} tk={tk} pad={12} style={{ marginBottom: 8, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 8, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name={s.icon} size={16} color={t.ink}/></div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>{s.t}</div>
                <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>{s.s}</div>
              </div>
              <Icon name="dotsThree" size={16} color={t.inkMuted}/>
            </Card>
          ))}
          <Btn tk={tk} variant="outline" size="md" full icon="plus">Add stop</Btn>
          <Card tk={tk} pad={12} style={{ marginTop: 14, background: t.surfaceAlt, borderColor: 'transparent', display: 'flex', gap: 10 }}>
            <Icon name="info" size={16} color={t.inkSoft}/>
            <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.inkSoft, lineHeight: 1.5 }}>
              Each stop becomes a map pin. Add a photo to make it saveable as a postcard.
            </div>
          </Card>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}`, display: 'flex', gap: 10 }}>
          <Btn tk={tk} variant="outline" size="md">Back</Btn>
          <div style={{ flex: 1 }}><Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">Continue</Btn></div>
        </div>
      </Shell>
    </Phone>
  );
};

// E3 Media + cover
const S_PubMedia = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="E3 · Publish · Media" sublabel="cover + gallery">
      <Shell tk={tk} bg={t.bg}>
        <WizHeader step={3} total={5} title="Media" tk={tk}/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 192px)' }}>
          <Field tk={tk} label="Cover photo" required/>
          <div style={{ marginTop: 6, position: 'relative' }}>
            <Photo h={170} tk={tk} tone="dusk" r={12}/>
            <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6 }}>
              <button style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer' }}><Icon name="pencilSimple" size={14} color={t.ink}/></button>
              <button style={{ width: 32, height: 32, borderRadius: 999, border: 'none', background: 'rgba(255,255,255,0.95)', cursor: 'pointer' }}><Icon name="x" size={14} color={t.ink}/></button>
            </div>
          </div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '20px 0 10px' }}>Gallery · 7 photos</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6 }}>
            {['dusk','warm','forest','coast','sand','ember'].map((tone,i) => (
              <Photo key={i} h={90} tk={tk} tone={tone} r={6}/>
            ))}
            <div style={{ height: 90, borderRadius: 6, border: `1.5px dashed ${t.hairlineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="plus" size={20} color={t.inkMuted}/>
            </div>
          </div>
          <Btn tk={tk} variant="outline" size="md" full icon="upload" style={{ marginTop: 12 }}>Add more</Btn>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}`, display: 'flex', gap: 10 }}>
          <Btn tk={tk} variant="outline" size="md">Back</Btn>
          <div style={{ flex: 1 }}><Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">Continue</Btn></div>
        </div>
      </Shell>
    </Phone>
  );
};

// E4 Tags, vertical, difficulty, budget
const S_PubMeta = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="E4 · Publish · Tags" sublabel="vertical + meta">
      <Shell tk={tk} bg={t.bg}>
        <WizHeader step={4} total={5} title="Tag it" tk={tk}/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 192px)' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Verticals (max 3)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
            {[['Travel',true],['Food',true],['Culture',false],['Adventure',false],['Wildlife',false]].map(([l,on])=>(
              <div key={l} style={{ padding:'8px 14px', borderRadius:999, border:`1px solid ${on?t.ink:t.hairlineStrong}`, background: on?t.ink:t.surface, color: on?t.surface:t.ink, fontFamily:typ.body, fontSize:12, fontWeight:600 }}>{l}</div>
            ))}
          </div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Difficulty</div>
          <Segmented tk={tk} full value="easy" options={[{label:'Easy',value:'easy'},{label:'Moderate',value:'m'},{label:'Tough',value:'h'}]}/>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin:'20px 0 8px' }}>Budget per person</div>
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 1 }}><Input tk={tk} value="4000" suffix="₹" icon="currencyInr"/></div>
            <div style={{ flex: 1 }}><Input tk={tk} value="8000" suffix="₹"/></div>
          </div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin:'20px 0 8px' }}>Duration</div>
          <Input tk={tk} value="3 days · 2 nights"/>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin:'20px 0 8px' }}>Search tags</div>
          <div style={{ display:'flex', flexWrap:'wrap', gap: 6 }}>
            {['coffee','monsoon','offbeat','solo','weekend','hillstation','homestay'].map(t2 => (
              <Tag key={t2} tone="default" tk={tk}>#{t2}</Tag>
            ))}
            <Tag tone="outline" tk={tk} icon="plus">add</Tag>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}`, display: 'flex', gap: 10 }}>
          <Btn tk={tk} variant="outline" size="md">Back</Btn>
          <div style={{ flex: 1 }}><Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">Review</Btn></div>
        </div>
      </Shell>
    </Phone>
  );
};

// E5 Review + publish
const S_PubReview = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="E5 · Publish · Review" sublabel="CRT-FR-020 · ship it">
      <Shell tk={tk} bg={t.bg}>
        <WizHeader step={5} total={5} title="Ready to publish" tk={tk}/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 192px)' }}>
          <Card tk={tk} pad={0} style={{ overflow: 'hidden' }}>
            <Photo h={130} tk={tk} tone="dusk" r={0}/>
            <div style={{ padding: 12 }}>
              <div style={{ fontFamily: typ.mono, fontSize:10, color: t.inkMuted, letterSpacing:'0.12em', textTransform:'uppercase' }}>Itinerary · 3 days</div>
              <div style={{ fontFamily: typ.display, fontSize: 19, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, marginTop: 3 }}>Three days in the Coorg mist</div>
              <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                <Tag tone="default" tk={tk} subtle>Travel</Tag>
                <Tag tone="default" tk={tk} subtle>Food</Tag>
                <Tag tone="default" tk={tk} subtle>Easy</Tag>
                <Tag tone="default" tk={tk} subtle>₹4k–8k</Tag>
              </div>
            </div>
          </Card>
          <div style={{ margin: '14px 0 8px', fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Checks</div>
          <Card tk={tk} pad={14}>
            {[
              { l:'3 chapters · 12 stops', ok: true },
              { l:'7 photos uploaded', ok: true },
              { l:'Cover photo set', ok: true },
              { l:'Creator disclosure: paid stay by host', ok: true, note:'marked' },
            ].map((c,i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0', borderBottom: i<3?`1px solid ${t.hairline}`:'none' }}>
                <Icon name="checkCircle" size={16} color={t.success}/>
                <div style={{ flex: 1, fontFamily: typ.body, fontSize: 13, color: t.ink }}>{c.l}</div>
                {c.note && <Tag tone="info" tk={tk} subtle>{c.note}</Tag>}
              </div>
            ))}
          </Card>
          <Card tk={tk} pad={14} style={{ marginTop: 14, background: t.primaryTint, borderColor: 'transparent', display: 'flex', gap: 10 }}>
            <Icon name="star" size={18} color={t.primaryDeep} weight="fill"/>
            <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.primaryDeep, lineHeight: 1.5 }}>
              Publishing earns <strong>+50 XP</strong> and the <strong>First Chapter</strong> stamp.
            </div>
          </Card>
          <div style={{ marginTop: 14, display: 'flex', gap: 10 }}>
            <Btn tk={tk} variant="outline" size="md">Schedule</Btn>
            <div style={{ flex: 1 }}><Btn tk={tk} variant="primary" size="md" full>Publish now</Btn></div>
          </div>
        </div>
      </Shell>
    </Phone>
  );
};

Object.assign(window, { S_PubOutline, S_PubStops, S_PubMedia, S_PubMeta, S_PubReview });
