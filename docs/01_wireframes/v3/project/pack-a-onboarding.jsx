// Pack A — Onboarding (6 screens) + Auth wall
// SRS: IAM-FR-001..011

// Shared phone content shell
const Shell = ({ children, tk, bg }) => {
  const { t } = tk;
  return (
    <div style={{
      position: 'absolute', inset: 0,
      background: bg || t.surface,
      overflow: 'hidden',
    }}>{children}</div>
  );
};

// ── A1 Welcome ───────────────────────────────────────────────────────────────
const S_Welcome = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="A1 · Welcome" sublabel="IAM-FR-001 · first run">
      <Shell tk={tk}>
        <Photo h={420} w="100%" tk={tk} tone="dusk" r={0}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, transparent 40%, rgba(0,0,0,0.55) 100%)' }}/>
        </Photo>
        <div style={{ padding: '24px 24px 20px', marginTop: -80, position: 'relative', background: 'linear-gradient(180deg, transparent 0%, '+t.surface+' 30%)', height: 'calc(100% - 340px)' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 600, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>CreatorHub</div>
          <h1 style={{ margin: 0, fontFamily: typ.display, fontSize: 40, lineHeight: 0.98, color: t.ink, fontWeight: typ.displayWeight, letterSpacing: typ.displayTrack }}>
            Every journey<br/><em style={{ fontStyle: 'italic', color: t.primary }}>is a chapter.</em>
          </h1>
          <p style={{ margin: '14px 0 22px', fontFamily: typ.body, fontSize: 14, lineHeight: 1.55, color: t.inkSoft }}>
            Follow Indian creators on the road, save stories as postcards, book their experiences.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Btn tk={tk} variant="primary" size="lg" full>Get started</Btn>
            <Btn tk={tk} variant="ghost" size="lg" full>I already have an account</Btn>
          </div>
          <div style={{ marginTop: 16, fontFamily: typ.body, fontSize: 11, color: t.inkMuted, textAlign: 'center', lineHeight: 1.5 }}>
            By continuing you agree to Terms & Privacy.<br/>हिंदी · मराठी · தமிழ் · বাংলা coming soon
          </div>
        </div>
      </Shell>
    </Phone>
  );
};

// ── A2 Phone sign-in ─────────────────────────────────────────────────────────
const S_Phone = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="A2 · Phone" sublabel="IAM-FR-002/003 · phone + OTP">
      <Shell tk={tk}>
        <AppHeader tk={tk} back onBack={() => {}} title="Sign in"/>
        <div style={{ padding: '20px 24px' }}>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 28, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1.05 }}>
            What's your number?
          </h2>
          <p style={{ margin: '8px 0 22px', fontFamily: typ.body, fontSize: 13, color: t.inkMuted, lineHeight: 1.5 }}>
            We'll text you a 6-digit code. No passwords, ever.
          </p>
          <Field tk={tk} label="Mobile number" required>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '0 12px', height: 44,
                borderRadius: 8, border: `1px solid ${t.hairlineStrong}`, background: t.surface,
                fontFamily: typ.body, fontSize: 14, color: t.ink, fontWeight: 500,
              }}>🇮🇳 +91 <Icon name="caretDown" size={14} color={t.inkMuted}/></div>
              <div style={{ flex: 1 }}>
                <Input tk={tk} placeholder="98765 43210" value="98765 43210" state="valid"/>
              </div>
            </div>
          </Field>
          <div style={{ marginTop: 20 }}>
            <Btn tk={tk} variant="primary" size="lg" full iconRight="arrowRight">Send code</Btn>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '24px 0 18px' }}>
            <div style={{ flex: 1, height: 1, background: t.hairline }}/>
            <span style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, letterSpacing: '0.05em', textTransform: 'uppercase' }}>or</span>
            <div style={{ flex: 1, height: 1, background: t.hairline }}/>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn tk={tk} variant="outline" size="lg" full icon="google">Continue with Google</Btn>
            <Btn tk={tk} variant="outline" size="lg" full icon="apple">Continue with Apple</Btn>
          </div>
        </div>
      </Shell>
    </Phone>
  );
};

// ── A2b OTP ──────────────────────────────────────────────────────────────────
const S_Otp = ({ tk }) => {
  const { t, typ } = tk;
  const digits = ['4','2','1','8',' ',' '];
  return (
    <Phone tk={tk} label="A2b · Verify" sublabel="IAM-FR-004 · OTP">
      <Shell tk={tk}>
        <AppHeader tk={tk} back onBack={() => {}} title="Verify"/>
        <div style={{ padding: '20px 24px' }}>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 28, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1.05 }}>
            Enter the code
          </h2>
          <p style={{ margin: '8px 0 22px', fontFamily: typ.body, fontSize: 13, color: t.inkMuted, lineHeight: 1.5 }}>
            Sent to +91 98765 43210 · <span style={{ color: t.primary, fontWeight: 600 }}>Change</span>
          </p>
          <div style={{ display: 'flex', gap: 8 }}>
            {digits.map((d, i) => (
              <div key={i} style={{
                flex: 1, height: 56, borderRadius: 10,
                border: `1.5px solid ${d !== ' ' ? t.ink : (i === 4 ? t.ink : t.hairlineStrong)}`,
                background: t.surface,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: typ.mono, fontSize: 24, fontWeight: 600, color: t.ink,
              }}>
                {d !== ' ' ? d : (i === 4 ? <span style={{ width: 2, height: 24, background: t.ink, animation: 'blink 1s infinite' }}/> : '')}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>Resend in 0:42</span>
            <Btn tk={tk} variant="text" size="sm">Get code via WhatsApp</Btn>
          </div>
          <div style={{ marginTop: 24 }}>
            <Btn tk={tk} variant="primary" size="lg" full>Verify</Btn>
          </div>
          <div style={{
            marginTop: 18, padding: 12, borderRadius: 10,
            background: t.surfaceAlt, display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Icon name="info" size={16} color={t.inkMuted}/>
            <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkSoft, lineHeight: 1.5 }}>
              3 failed attempts locks this number for 15 min. <span style={{ color: t.primary, fontWeight: 600 }}>Need help?</span>
            </div>
          </div>
        </div>
      </Shell>
    </Phone>
  );
};

// ── A3 Location ──────────────────────────────────────────────────────────────
const S_OnbLocation = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="A3 · Home base" sublabel="IAM-FR-006 · location hint">
      <Shell tk={tk}>
        <div style={{ padding: '52px 16px 8px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Steps current={2} total={5} tk={tk}/>
        </div>
        <div style={{ padding: '24px 24px' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Step 2 of 5</div>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 30, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1.0 }}>
            Where do you call home?
          </h2>
          <p style={{ margin: '8px 0 22px', fontFamily: typ.body, fontSize: 13, color: t.inkMuted, lineHeight: 1.5 }}>
            We'll surface creators closer to you first. You can still follow anyone from anywhere.
          </p>
          <Field tk={tk}>
            <Input tk={tk} icon="magnifyingGlass" placeholder="City or state" value="Bengaluru, Karnataka" state="valid"/>
          </Field>
          <div style={{ marginTop: 18, display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['Mumbai', 'Delhi', 'Bengaluru', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Goa'].map(c => (
              <div key={c} style={{
                padding: '8px 14px', borderRadius: 999,
                border: `1px solid ${c==='Bengaluru'?t.ink:t.hairlineStrong}`,
                background: c==='Bengaluru' ? t.ink : t.surface,
                color: c==='Bengaluru' ? t.surface : t.ink,
                fontFamily: typ.body, fontSize: 13, fontWeight: 500,
              }}>{c}</div>
            ))}
          </div>
          <div style={{ marginTop: 28, padding: 14, borderRadius: 12, background: t.surfaceAlt, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Icon name="mapPin" size={18} color={t.inkSoft}/>
            <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.inkSoft, lineHeight: 1.5 }}>
              <strong style={{ color: t.ink }}>Use precise location?</strong><br/>Better recommendations, optional anytime.
            </div>
            <Toggle on={false} tk={tk}/>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}`, display: 'flex', gap: 10 }}>
          <Btn tk={tk} variant="outline" size="md">Back</Btn>
          <div style={{ flex: 1 }}><Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">Continue</Btn></div>
        </div>
      </Shell>
    </Phone>
  );
};

// ── A4 Verticals ─────────────────────────────────────────────────────────────
const S_OnbVerticals = ({ tk }) => {
  const { t, typ } = tk;
  const cats = [
    { label: 'Travel', icon: 'mountains', on: true },
    { label: 'Food', icon: 'forkKnife', on: true },
    { label: 'Culture', icon: 'bookOpen', on: true },
    { label: 'Adventure', icon: 'barbell', on: false },
    { label: 'Wildlife', icon: 'sun', on: false },
    { label: 'Music', icon: 'musicNotes', on: false },
    { label: 'Photography', icon: 'camera', on: false },
    { label: 'Learning', icon: 'graduationCap', on: false },
  ];
  return (
    <Phone tk={tk} label="A4 · Interests" sublabel="IAM-FR-007 · verticals">
      <Shell tk={tk}>
        <div style={{ padding: '52px 16px 8px' }}>
          <Steps current={3} total={5} tk={tk}/>
        </div>
        <div style={{ padding: '24px 24px' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Step 3 of 5</div>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 30, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1.0 }}>
            What pulls you in?
          </h2>
          <p style={{ margin: '8px 0 20px', fontFamily: typ.body, fontSize: 13, color: t.inkMuted, lineHeight: 1.5 }}>
            Pick at least 3. We'll keep learning.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {cats.map(c => (
              <div key={c.label} style={{
                padding: 14, borderRadius: 12,
                border: `1.5px solid ${c.on ? t.primary : t.hairlineStrong}`,
                background: t.surface,
                color: t.ink,
                boxShadow: c.on
                  ? `0 0 0 3px ${t.primaryTint}, 0 1px 2px rgba(16,24,40,0.04), 0 4px 10px rgba(16,24,40,0.05)`
                  : '0 1px 2px rgba(16,24,40,0.04), 0 1px 4px rgba(16,24,40,0.03)',
                display: 'flex', flexDirection: 'column', gap: 10, height: 88,
                justifyContent: 'space-between',
                position: 'relative',
                transition: 'box-shadow 120ms ease',
              }}>
                <Icon name={c.icon} size={22} color={c.on ? t.primary : t.inkSoft}/>
                <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, letterSpacing: '-0.005em' }}>{c.label}</div>
                {c.on && (
                  <div style={{ position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 999, background: t.primary, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="check" size={11} color="#fff"/>
                  </div>
                )}
              </div>
            ))}
          </div>
          <div style={{ marginTop: 18, fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>
            3 of 8 selected · minimum 3
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}`, display: 'flex', gap: 10 }}>
          <Btn tk={tk} variant="outline" size="md">Back</Btn>
          <div style={{ flex: 1 }}><Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">Continue</Btn></div>
        </div>
      </Shell>
    </Phone>
  );
};

// ── A5 Follow creators ───────────────────────────────────────────────────────
const S_OnbCreators = ({ tk }) => {
  const { t, typ } = tk;
  const creators = [
    { name: 'Ananya Rao', city: 'Bengaluru', cat: 'Cities · Food', followers: '42.1k', following: true, color: '#D17A5E' },
    { name: 'Karan Mehta', city: 'Mumbai', cat: 'Adventure', followers: '18.3k', following: true, color: '#6B8CAE' },
    { name: 'Nila Iyer', city: 'Chennai', cat: 'Temples · Culture', followers: '27.9k', following: false, color: '#7A9B7E' },
    { name: 'Faraz Ahmed', city: 'Delhi', cat: 'Street food', followers: '61.4k', following: true, color: '#B8946E' },
    { name: 'Sneha Kaur', city: 'Goa', cat: 'Coast · Music', followers: '12.8k', following: false, color: '#C47A5E' },
  ];
  return (
    <Phone tk={tk} label="A5 · Creators" sublabel="IAM-FR-008 · bootstrap follow">
      <Shell tk={tk}>
        <div style={{ padding: '52px 16px 8px' }}><Steps current={4} total={5} tk={tk}/></div>
        <div style={{ padding: '24px 24px 10px' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 8 }}>Step 4 of 5</div>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 30, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1.0 }}>
            Follow 3 to begin.
          </h2>
          <p style={{ margin: '8px 0 4px', fontFamily: typ.body, fontSize: 13, color: t.inkMuted, lineHeight: 1.5 }}>
            Handpicked from your cities & interests.
          </p>
        </div>
        <div style={{ padding: '0 16px', overflowY: 'auto', maxHeight: 390 }}>
          {creators.map(c => (
            <div key={c.name} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '12px 8px',
              borderBottom: `1px solid ${t.hairline}`,
            }}>
              <Avatar name={c.name} color={c.color} size={44} tk={tk}/>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink, letterSpacing: '-0.005em' }}>{c.name}</div>
                <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 1 }}>
                  {c.city} · {c.cat} · {c.followers}
                </div>
              </div>
              <Btn tk={tk} variant={c.following ? 'ghost' : 'dark'} size="sm">{c.following ? 'Following' : 'Follow'}</Btn>
            </div>
          ))}
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}`, display: 'flex', gap: 10 }}>
          <Btn tk={tk} variant="outline" size="md">Skip</Btn>
          <div style={{ flex: 1 }}>
            <Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">Follow 3 & continue</Btn>
          </div>
        </div>
      </Shell>
    </Phone>
  );
};

// ── A6 Celebrate ─────────────────────────────────────────────────────────────
const S_OnbCelebrate = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="A6 · Welcome" sublabel="IAM-FR-010 · first run done">
      <Shell tk={tk} bg={t.bg}>
        <div style={{ padding: '52px 16px 8px' }}><Steps current={5} total={5} tk={tk}/></div>
        <div style={{ padding: '40px 28px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 18 }}>
          <div style={{
            padding: '6px 12px', borderRadius: 999, background: t.primaryTint,
            color: t.primaryDeep, fontFamily: typ.mono, fontSize: 10, fontWeight: 700,
            letterSpacing: '0.12em', textTransform: 'uppercase',
          }}>Chapter 1 · You</div>
          <h1 style={{
            margin: 0, fontFamily: typ.display, fontSize: 44, lineHeight: 0.96,
            fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack,
          }}>
            Welcome aboard,<br/><em style={{ fontStyle: 'italic', color: t.primary }}>Aarav.</em>
          </h1>
          <p style={{ margin: 0, fontFamily: typ.body, fontSize: 14, lineHeight: 1.55, color: t.inkSoft }}>
            Your home base is Bengaluru. You're following 3 creators across Travel, Food and Culture. Let's go read.
          </p>
          <Card tk={tk} pad={14} style={{ width: '100%', display: 'flex', gap: 12, alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 10, background: t.primaryTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="compass" size={20} color={t.primary}/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>Today's read</div>
              <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>Ananya's 3-day Coorg chapter is waiting.</div>
            </div>
            <Icon name="caretRight" size={16} color={t.inkMuted}/>
          </Card>
          <Btn tk={tk} variant="primary" size="lg" full iconRight="arrowRight">Open my feed</Btn>
        </div>
      </Shell>
    </Phone>
  );
};

// ── A7 Soft Auth Wall ─────────────────────────────────────────────────────────
// IAM-FR-011 — sheet over current screen when guest hits a gated action
const S_AuthWall = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="A7 · Auth wall" sublabel="IAM-FR-011 · soft sign-in sheet">
      <Shell tk={tk}>
        {/* Background: a discover screen dimmed */}
        <div style={{ padding: '52px 16px 12px', opacity: 0.35 }}>
          <div style={{ fontFamily: typ.display, fontSize: 28, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>Coorg in 3 acts</div>
          <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 4 }}>by Ananya Rao · 8 min read</div>
          <div style={{ marginTop: 12, height: 200, background: t.surfaceAlt, borderRadius: 12 }}/>
          <div style={{ marginTop: 12, height: 10, width: '70%', background: t.surfaceAlt, borderRadius: 4 }}/>
          <div style={{ marginTop: 8, height: 10, width: '90%', background: t.surfaceAlt, borderRadius: 4 }}/>
        </div>
        <Sheet tk={tk} title="Save this postcard?">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '4px 0 16px', borderBottom: `1px solid ${t.hairline}`, marginBottom: 16 }}>
            <div style={{ width: 52, height: 52, borderRadius: 10, background: t.primaryTint, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="bookmark" size={22} color={t.primary} weight="fill"/>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink }}>“Abbi Falls at dawn”</div>
              <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>from Coorg in 3 acts · Ananya</div>
            </div>
          </div>
          <div style={{ fontFamily: typ.body, fontSize: 13, color: t.inkSoft, lineHeight: 1.55, marginBottom: 16 }}>
            You need an account to save postcards, follow creators, and book experiences. <strong style={{ color: t.ink }}>30 seconds.</strong>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn tk={tk} variant="primary" size="lg" full icon="phone">Continue with phone</Btn>
            <Btn tk={tk} variant="outline" size="lg" full icon="google">Continue with Google</Btn>
            <Btn tk={tk} variant="outline" size="lg" full icon="apple">Continue with Apple</Btn>
            <Btn tk={tk} variant="text" size="md" full>Keep browsing as guest</Btn>
          </div>
        </Sheet>
      </Shell>
    </Phone>
  );
};

Object.assign(window, { S_Welcome, S_Phone, S_Otp, S_OnbLocation, S_OnbVerticals, S_OnbCreators, S_OnbCelebrate, S_AuthWall, Shell });
