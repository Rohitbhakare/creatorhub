// Pack DS — Design system reference
// Living swatch book shown at the end of the canvas.

const DS_Block = ({ title, subtitle, children, tk, w = 720 }) => {
  const { t, typ } = tk;
  return (
    <div style={{ width: w, background: t.surface, borderRadius: 4, padding: '28px 32px', border: `1px solid ${t.hairline}`, marginBottom: 20 }}>
      <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase' }}>{subtitle}</div>
      <div style={{ fontFamily: typ.display, fontSize: 28, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, marginTop: 6, marginBottom: 22, lineHeight: 1 }}>{title}</div>
      {children}
    </div>
  );
};

const S_DS_Color = ({ tk }) => {
  const { t, typ } = tk;
  const roles = [
    ['bg','Page'], ['surface','Card'], ['surfaceAlt','Sunken'], ['surfaceSunk','Info block'],
    ['ink','Ink'], ['inkSoft','Ink · soft'], ['inkMuted','Ink · muted'], ['inkFaint','Ink · faint'],
    ['hairline','Hairline'], ['hairlineStrong','Hairline · strong'],
    ['primary','Coral · primary'], ['primaryDeep','Coral · deep'], ['primaryTint','Coral · 10% tint'],
    ['success','Success'], ['warning','Warning'], ['danger','Danger'], ['info','Info'],
  ];
  return (
    <DS_Block tk={tk} title="Palette" subtitle="Pure white + coral · SRS C-17">
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {roles.map(([k,l]) => (
          <div key={k} style={{ border: `1px solid ${t.hairline}`, borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ height: 56, background: t[k], borderBottom: k==='surface'?`1px solid ${t.hairline}`:'none' }}/>
            <div style={{ padding: '8px 10px' }}>
              <div style={{ fontFamily: typ.body, fontSize: 11, fontWeight: 600, color: t.ink }}>{l}</div>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, marginTop: 1 }}>{t[k]}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ marginTop: 18, padding: 12, background: t.surfaceAlt, borderRadius: 4, fontFamily: typ.body, fontSize: 12, color: t.inkSoft, lineHeight: 1.55 }}>
        <strong style={{ color: t.ink }}>Rule.</strong> Coral is the <em>only</em> decorative accent. Semantic colors (success/warning/danger/info) appear <em>only</em> on functional states — never as surface decoration.
      </div>
    </DS_Block>
  );
};

const S_DS_Type = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <DS_Block tk={tk} title="Type · editorial" subtitle={typ.subtitle || typ.name}>
      <div style={{ padding: '18px 0', borderBottom: `1px solid ${t.hairline}` }}>
        <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>H1 · 56 / display</div>
        <div style={{ fontFamily: typ.display, fontSize: 56, lineHeight: 1, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, marginTop: 8 }}>
          Every journey<em style={{ fontStyle: 'italic', color: t.primary }}> is a chapter.</em>
        </div>
      </div>
      <div style={{ padding: '18px 0', borderBottom: `1px solid ${t.hairline}` }}>
        <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>H2 · 32</div>
        <div style={{ fontFamily: typ.display, fontSize: 32, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, marginTop: 6 }}>Section header</div>
      </div>
      <div style={{ padding: '18px 0', borderBottom: `1px solid ${t.hairline}` }}>
        <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Body · 14–16</div>
        <div style={{ fontFamily: typ.body, fontSize: 15, color: t.inkSoft, lineHeight: 1.55, marginTop: 6, maxWidth: 560 }}>
          The field journal for Indian creators — Instagram plus Substack plus Eventbrite plus Patreon, stitched together by storytelling and gamified just enough to build habit.
        </div>
      </div>
      <div style={{ padding: '18px 0' }}>
        <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Mono · 11 · labels, counters, timestamps</div>
        <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.ink, marginTop: 6, letterSpacing: '0.06em' }}>BKG-FR-012 · 4h 32m · ₹2,400 · @meera</div>
      </div>
    </DS_Block>
  );
};

const S_DS_Buttons = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <DS_Block tk={tk} title="Buttons" subtitle="Coral primary · 4 variants · 3 sizes">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {[
          ['Primary · coral', <><Btn tk={tk} variant="primary" size="lg">Book this walk</Btn><Btn tk={tk} variant="primary" size="md">Continue</Btn><Btn tk={tk} variant="primary" size="sm">Follow</Btn></>],
          ['Dark · solid ink', <><Btn tk={tk} variant="dark" size="lg">Confirm</Btn><Btn tk={tk} variant="dark" size="md">Edit profile</Btn><Btn tk={tk} variant="dark" size="sm" iconRight="caretRight">Next</Btn></>],
          ['Outline', <><Btn tk={tk} variant="outline" size="lg">Secondary</Btn><Btn tk={tk} variant="outline" size="md" icon="share">Share</Btn><Btn tk={tk} variant="outline" size="sm">Edit</Btn></>],
          ['Text', <><Btn tk={tk} variant="text" size="md" iconRight="caretRight">See all</Btn><Btn tk={tk} variant="text" size="sm">Skip</Btn></>],
        ].map(([l,el],i) => (
          <div key={i}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 10 }}>{l}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>{el}</div>
          </div>
        ))}
      </div>
    </DS_Block>
  );
};

const S_DS_Tags = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <DS_Block tk={tk} title="Tags & status" subtitle="Semantic tones only">
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
        {[
          ['default','Itinerary'],['default','Story'],['default','Experience'],
        ].map(([tone,l]) => <Tag key={l} tone={tone} tk={tk}>{l}</Tag>)}
      </div>
      <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Subtle · state</div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <Tag tone="success" subtle tk={tk} icon="checkCircle">Verified</Tag>
        <Tag tone="warning" subtle tk={tk}>Pay pending</Tag>
        <Tag tone="danger" subtle tk={tk}>Resubmit</Tag>
        <Tag tone="info" subtle tk={tk}>Submitted</Tag>
        <Tag tone="default" subtle tk={tk}>Draft</Tag>
      </div>
    </DS_Block>
  );
};

const S_DS_Motion = ({ tk }) => {
  const { t, typ } = tk;
  const tokens = [
    ['fast · 120ms','Micro-interactions, hover'],
    ['base · 200ms','Sheets, modals in'],
    ['slow · 320ms','Page transitions, big reveals'],
    ['spring','s(0.6, 26, 220) · bouncy confirm'],
  ];
  return (
    <DS_Block tk={tk} title="Motion & spacing" subtitle="Calm, editorial; spring only on success">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        <div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Duration tokens</div>
          {tokens.map(([k,v]) => (
            <div key={k} style={{ padding: '8px 0', borderBottom: `1px solid ${t.hairline}`, display: 'flex', gap: 12 }}>
              <div style={{ width: 120, fontFamily: typ.mono, fontSize: 12, color: t.ink, fontWeight: 600 }}>{k}</div>
              <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.inkSoft }}>{v}</div>
            </div>
          ))}
        </div>
        <div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Space scale · 4pt</div>
          {[4,8,12,16,24,32].map(n => (
            <div key={n} style={{ padding: '6px 0', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, fontFamily: typ.mono, fontSize: 12, color: t.ink, fontWeight: 600 }}>s{n/4}</div>
              <div style={{ width: n, height: 12, background: t.primary, borderRadius: 2 }}/>
              <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted }}>{n}px</div>
            </div>
          ))}
        </div>
      </div>
    </DS_Block>
  );
};

const S_DS_Voice = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <DS_Block tk={tk} title="Voice · copy rules" subtitle="Warm, concrete, never AI-slop">
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {[
          { h:'Do', items:['"Three days in the Coorg mist"','"Confirmed · clears Mon 14 Apr"','"Your first payout clears every Monday"'], tone: t.success },
          { h:"Don't", items:['"Unlock your creator journey today!"','"Seamless monetisation experience"','"Submitted ✨ Amazing!"'], tone: t.danger },
        ].map(col => (
          <div key={col.h}>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: col.tone, letterSpacing: '0.1em', textTransform: 'uppercase', fontWeight: 700, marginBottom: 10 }}>{col.h}</div>
            {col.items.map((x,i) => (
              <div key={i} style={{ padding: '10px 12px', background: t.surfaceAlt, borderRadius: 4, fontFamily: typ.body, fontSize: 13, color: t.ink, lineHeight: 1.45, marginBottom: 6, borderLeft: `3px solid ${col.tone}` }}>
                {x}
              </div>
            ))}
          </div>
        ))}
      </div>
    </DS_Block>
  );
};

Object.assign(window, { S_DS_Color, S_DS_Type, S_DS_Buttons, S_DS_Tags, S_DS_Motion, S_DS_Voice });
