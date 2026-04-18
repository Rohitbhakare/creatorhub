// Pack F — KYC flow · KYC-FR-005..030
// Intro + 5 steps + 4 status states (Submitted, Pending, Approved, Needs fixes)

const KycHeader = ({ step, total, title, tk }) => {
  const { t, typ } = tk;
  return (
    <>
      <AppHeader tk={tk} back title={title} subtitle={`KYC · Step ${step} of ${total}`}/>
      <div style={{ padding: '0 16px 10px', background: t.surface, borderBottom: `1px solid ${t.hairline}` }}>
        <Steps current={step} total={total} tk={tk}/>
      </div>
    </>
  );
};

// F0 Intro
const S_KycIntro = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="F0 · KYC intro" sublabel="KYC-FR-005 · before monetisation">
      <Shell tk={tk}>
        <AppHeader tk={tk} back title="Become a verified creator"/>
        <div style={{ padding: 20, overflowY: 'auto', height: 'calc(100% - 80px)' }}>
          <div style={{ padding: '4px 12px', borderRadius: 999, background: t.primaryTint, color: t.primaryDeep, fontFamily: typ.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', display: 'inline-block' }}>Required to earn</div>
          <h1 style={{ margin: '14px 0 10px', fontFamily: typ.display, fontSize: 30, lineHeight: 1.0, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>
            Five minutes.<br/><em style={{ fontStyle: 'italic', color: t.primary }}>Then you can sell.</em>
          </h1>
          <p style={{ fontFamily: typ.body, fontSize: 14, lineHeight: 1.55, color: t.inkSoft }}>
            We verify every creator who books paid experiences, runs sponsorships, or accepts tips. Required by Indian payment regulations.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 18 }}>
            {[
              { i:'identification', t:'PAN card', s:'Number + clear photo' },
              { i:'shield', t:'Aadhaar', s:'OTP-based eKYC · no photo stored' },
              { i:'bank', t:'Bank account', s:'Account number + IFSC for payouts' },
              { i:'camera', t:'Live selfie', s:'Match against your ID' },
            ].map(x => (
              <Card key={x.t} tk={tk} pad={12} style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                <div style={{ width: 38, height: 38, borderRadius: 8, background: t.surfaceAlt, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={x.i} size={18} color={t.ink}/>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>{x.t}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 1 }}>{x.s}</div>
                </div>
              </Card>
            ))}
          </div>
          <div style={{ marginTop: 18, padding: 12, borderRadius: 10, background: t.surfaceAlt, display: 'flex', gap: 10 }}>
            <Icon name="lock" size={16} color={t.inkSoft}/>
            <div style={{ flex: 1, fontFamily: typ.body, fontSize: 11, color: t.inkSoft, lineHeight: 1.5 }}>
              Docs are stored encrypted and only used for verification. <strong style={{ color: t.ink }}>Privacy policy</strong>
            </div>
          </div>
          <div style={{ marginTop: 18 }}>
            <Btn tk={tk} variant="primary" size="lg" full iconRight="arrowRight">Start verification</Btn>
          </div>
        </div>
      </Shell>
    </Phone>
  );
};

// F1 PAN
const S_KycPan = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="F1 · KYC · PAN" sublabel="KYC-FR-010">
      <Shell tk={tk} bg={t.bg}>
        <KycHeader step={1} total={5} title="PAN" tk={tk}/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 198px)' }}>
          <Field tk={tk} label="PAN number" required inline="10 chars"><Input tk={tk} value="ABCPX1234F" state="valid"/></Field>
          <div style={{ marginTop: 14 }}>
            <Field tk={tk} label="Full name (as on PAN)" required><Input tk={tk} value="AARAV SHARMA" state="valid"/></Field>
          </div>
          <div style={{ marginTop: 14 }}>
            <Field tk={tk} label="Date of birth" required><Input tk={tk} value="12 Jun 1997" icon="calendar"/></Field>
          </div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', margin: '20px 0 8px' }}>Photo of PAN</div>
          <div style={{
            height: 160, borderRadius: 12, border: `1.5px dashed ${t.hairlineStrong}`,
            background: t.surface, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}>
            <Icon name="cameraPlus" size={28} color={t.inkMuted}/>
            <div style={{ fontFamily: typ.body, fontSize: 13, color: t.inkSoft, fontWeight: 500 }}>Take a photo or upload</div>
            <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted }}>JPG, PNG · max 5MB · all 4 corners visible</div>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}` }}>
          <Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">Continue</Btn>
        </div>
      </Shell>
    </Phone>
  );
};

// F2 Aadhaar OTP
const S_KycAadhaar = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="F2 · KYC · Aadhaar" sublabel="KYC-FR-015 · eKYC OTP">
      <Shell tk={tk} bg={t.bg}>
        <KycHeader step={2} total={5} title="Aadhaar" tk={tk}/>
        <div style={{ padding: 16 }}>
          <Card tk={tk} pad={14} style={{ background: t.primaryTint, borderColor: 'transparent', display: 'flex', gap: 10, marginBottom: 14 }}>
            <Icon name="shield" size={18} color={t.primaryDeep}/>
            <div style={{ fontFamily: typ.body, fontSize: 12, color: t.primaryDeep, lineHeight: 1.5 }}>
              <strong>eKYC only.</strong> We don't store your Aadhaar number or image — just the UIDAI-returned hash.
            </div>
          </Card>
          <Field tk={tk} label="Aadhaar-linked mobile" required inline="OTP will come here">
            <Input tk={tk} value="+91 98765 43210" icon="phone"/>
          </Field>
          <div style={{ marginTop: 14 }}>
            <Field tk={tk} label="Last 4 digits of Aadhaar" required><Input tk={tk} value="4218" state="valid"/></Field>
          </div>
          <div style={{ marginTop: 14 }}>
            <Btn tk={tk} variant="dark" size="md" full>Send OTP</Btn>
          </div>
          <div style={{ marginTop: 18, fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase' }}>Enter OTP</div>
          <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
            {['8','2','1','4',' ',' '].map((d,i) => (
              <div key={i} style={{
                flex: 1, height: 54, borderRadius: 10,
                border: `1.5px solid ${d !== ' ' ? t.ink : t.hairlineStrong}`,
                background: t.surface, display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontFamily: typ.mono, fontSize: 22, fontWeight: 600, color: t.ink,
              }}>{d.trim()}</div>
            ))}
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}` }}>
          <Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">Verify & continue</Btn>
        </div>
      </Shell>
    </Phone>
  );
};

// F3 Selfie
const S_KycSelfie = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="F3 · KYC · Selfie" sublabel="KYC-FR-020 · liveness">
      <Shell tk={tk} bg="#0a0a0c">
        <KycHeader step={3} total={5} title="Live selfie" tk={tk}/>
        <div style={{ padding: 16, color: '#fff' }}>
          <div style={{ position: 'relative', margin: '10px auto 0', width: 280, height: 360 }}>
            <Photo h={360} w={280} tk={tk} tone="dusk" r={140}/>
            <svg width="280" height="360" viewBox="0 0 280 360" style={{ position: 'absolute', top: 0, left: 0 }}>
              <ellipse cx="140" cy="180" rx="120" ry="160" fill="none" stroke={t.primary} strokeWidth="3" strokeDasharray="8 6"/>
            </svg>
            <div style={{ position: 'absolute', top: 16, left: 16, padding: '4px 10px', borderRadius: 999, background: 'rgba(0,0,0,0.55)', fontFamily: 'monospace', fontSize: 11, color: '#fff' }}>● REC</div>
          </div>
          <div style={{ marginTop: 16, fontFamily: typ.body, fontSize: 14, color: '#fff', fontWeight: 500, textAlign: 'center' }}>
            Turn your head slowly from side to side
          </div>
          <div style={{ marginTop: 8, fontFamily: typ.body, fontSize: 11, color: 'rgba(255,255,255,0.6)', textAlign: 'center' }}>
            Face the camera · remove hats & glasses · good light
          </div>
          <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center', gap: 10 }}>
            {[1,2,3].map(i => (
              <div key={i} style={{ width: 32, height: 4, borderRadius: 999, background: i<=1 ? t.primary : 'rgba(255,255,255,0.2)' }}/>
            ))}
          </div>
        </div>
      </Shell>
    </Phone>
  );
};

// F4 Bank
const S_KycBank = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="F4 · KYC · Bank" sublabel="KYC-FR-025 · payout details">
      <Shell tk={tk} bg={t.bg}>
        <KycHeader step={4} total={5} title="Payout bank" tk={tk}/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 198px)' }}>
          <Field tk={tk} label="Account holder name" required><Input tk={tk} value="Aarav Sharma" state="valid"/></Field>
          <div style={{ marginTop: 14 }}>
            <Field tk={tk} label="Account number" required inline="confirm on next line">
              <Input tk={tk} value="50100123456789"/>
            </Field>
          </div>
          <div style={{ marginTop: 10 }}>
            <Field tk={tk} label="Re-enter account number" required success="Accounts match"><Input tk={tk} value="50100123456789" state="valid"/></Field>
          </div>
          <div style={{ marginTop: 14 }}>
            <Field tk={tk} label="IFSC code" required success="HDFC Bank · MG Road, Bangalore">
              <Input tk={tk} value="HDFC0001234" state="valid" suffix="11 chars"/>
            </Field>
          </div>
          <div style={{ marginTop: 14 }}>
            <Field tk={tk} label="Account type" required>
              <Segmented tk={tk} full value="savings" options={[{label:'Savings',value:'savings'},{label:'Current',value:'current'}]}/>
            </Field>
          </div>
          <Card tk={tk} pad={12} style={{ marginTop: 18, background: t.surfaceAlt, borderColor: 'transparent', display: 'flex', gap: 10 }}>
            <Icon name="info" size={16} color={t.inkSoft}/>
            <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.inkSoft, lineHeight: 1.5 }}>
              We'll send ₹1 to verify the account — refunded in 48h. Name on account must match PAN.
            </div>
          </Card>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}` }}>
          <Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">Continue</Btn>
        </div>
      </Shell>
    </Phone>
  );
};

// F5 Review & submit
const S_KycReview = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <Phone tk={tk} label="F5 · KYC · Review" sublabel="KYC-FR-030 · submit">
      <Shell tk={tk} bg={t.bg}>
        <KycHeader step={5} total={5} title="Review & submit" tk={tk}/>
        <div style={{ padding: 16, overflowY: 'auto', height: 'calc(100% - 198px)' }}>
          {[
            { l:'PAN · ABCPX1234F', ok: true, edit: true },
            { l:'Aadhaar · ****4218 (eKYC verified)', ok: true },
            { l:'Live selfie · liveness pass', ok: true },
            { l:'HDFC ****6789 · Savings', ok: true, edit: true },
          ].map((r,i) => (
            <Card key={i} tk={tk} pad={12} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name="checkCircle" size={18} color={t.success} weight="fill"/>
              <div style={{ flex: 1, fontFamily: typ.body, fontSize: 13, color: t.ink }}>{r.l}</div>
              {r.edit && <Btn tk={tk} variant="text" size="sm">Edit</Btn>}
            </Card>
          ))}
          <Card tk={tk} pad={14} style={{ marginTop: 14, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div style={{ width: 22, height: 22, borderRadius: 6, border: `1.5px solid ${t.ink}`, background: t.ink, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="check" size={14} color="#fff"/>
            </div>
            <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkSoft, lineHeight: 1.5 }}>
              I confirm details are accurate and agree to CreatorHub's <strong style={{ color: t.ink }}>Creator terms</strong> and <strong style={{ color: t.ink }}>payout policy</strong>.
            </div>
          </Card>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}` }}>
          <Btn tk={tk} variant="primary" size="lg" full>Submit for review</Btn>
          <div style={{ textAlign: 'center', marginTop: 6, fontFamily: typ.body, fontSize: 11, color: t.inkMuted }}>Reviewed within 24–72 hours</div>
        </div>
      </Shell>
    </Phone>
  );
};

// F6 Status states — 4 flavours in one component, each an artboard
const S_KycStatus = ({ tk, state }) => {
  const { t, typ } = tk;
  const states = {
    submitted: {
      label: 'F6a · Submitted', sub: 'KYC-FR-028a',
      icon: 'clock', color: t.info, tint: 'rgba(24,95,165,0.1)',
      title: 'Under review',
      body: 'We\'ve got your details. Most decisions arrive within 24 hours, maximum 72.',
      tag: 'Submitted', cta: 'Keep creating drafts',
    },
    pending: {
      label: 'F6b · Pending', sub: 'KYC-FR-028b · bank penny',
      icon: 'bank', color: t.warning, tint: 'rgba(186,117,23,0.12)',
      title: 'Confirm ₹1 deposit',
      body: 'We sent ₹1 to HDFC ****6789. Enter the remark you see on your statement.',
      tag: 'Action needed', cta: 'Enter remark',
    },
    approved: {
      label: 'F6c · Approved', sub: 'KYC-FR-028c · you\'re in',
      icon: 'checkCircle', color: t.success, tint: 'rgba(29,158,117,0.12)',
      title: 'You\'re a verified creator.',
      body: 'Paid experiences, tips and sponsorships are unlocked. Your first payout clears every Monday.',
      tag: 'Approved', cta: 'Open Studio',
    },
    needs: {
      label: 'F6d · Needs fixes', sub: 'KYC-FR-028d · resubmit',
      icon: 'warning', color: t.danger, tint: 'rgba(194,54,47,0.1)',
      title: '2 things need fixing',
      body: 'Your PAN photo is blurry on the bottom edge and the name on your bank account doesn\'t match PAN.',
      tag: 'Resubmit', cta: 'Fix & resubmit',
    },
  };
  const s = states[state];
  return (
    <Phone tk={tk} label={s.label} sublabel={s.sub}>
      <Shell tk={tk} bg={t.bg}>
        <AppHeader tk={tk} back title="Creator verification"/>
        <div style={{ padding: '28px 20px 20px', textAlign: 'center' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 999, background: s.tint,
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Icon name={s.icon} size={32} color={s.color} weight="fill"/>
          </div>
          <Tag tone={state==='approved'?'success':state==='needs'?'danger':state==='pending'?'warning':'info'} tk={tk} subtle>{s.tag}</Tag>
          <h1 style={{ margin: '10px 0 8px', fontFamily: typ.display, fontSize: 26, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1.1 }}>
            {s.title}
          </h1>
          <p style={{ margin: 0, fontFamily: typ.body, fontSize: 14, lineHeight: 1.55, color: t.inkSoft, maxWidth: 300, marginLeft: 'auto', marginRight: 'auto' }}>
            {s.body}
          </p>
        </div>

        {state === 'needs' && (
          <div style={{ padding: '0 16px 14px' }}>
            {[
              { t:'PAN image · blurry edge', a:'Retake photo' },
              { t:'Bank name mismatch', a:'Re-enter' },
            ].map((x,i) => (
              <Card key={i} tk={tk} pad={12} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 10, borderColor: t.danger+'44' }}>
                <Icon name="warning" size={18} color={t.danger}/>
                <div style={{ flex: 1, fontFamily: typ.body, fontSize: 13, color: t.ink }}>{x.t}</div>
                <Btn tk={tk} variant="outline" size="sm">{x.a}</Btn>
              </Card>
            ))}
          </div>
        )}

        {state === 'submitted' && (
          <div style={{ padding: '0 16px 14px' }}>
            <Card tk={tk} pad={12}>
              <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 8 }}>Timeline</div>
              {[['Submitted',true],['Auto checks',true],['Human review',false],['Decision',false]].map(([l,done],i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0' }}>
                  <div style={{ width: 14, height: 14, borderRadius: 999, background: done?t.ink:t.surfaceAlt, border: done?'none':`1.5px solid ${t.hairlineStrong}` }}/>
                  <div style={{ fontFamily: typ.body, fontSize: 13, color: done?t.ink:t.inkMuted, fontWeight: done?600:400 }}>{l}</div>
                </div>
              ))}
            </Card>
          </div>
        )}

        {state === 'approved' && (
          <div style={{ padding: '0 16px' }}>
            <Card tk={tk} pad={14} style={{ background: t.primaryTint, borderColor: 'transparent', display: 'flex', gap: 10 }}>
              <Icon name="star" size={18} color={t.primaryDeep} weight="fill"/>
              <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.primaryDeep, lineHeight: 1.5 }}>
                Verified Creator badge unlocked · shows on your profile and mini-site.
              </div>
            </Card>
          </div>
        )}

        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '12px 16px 28px', background: t.surface, borderTop: `1px solid ${t.hairline}` }}>
          <Btn tk={tk} variant="primary" size="md" full iconRight="arrowRight">{s.cta}</Btn>
        </div>
      </Shell>
    </Phone>
  );
};

Object.assign(window, { S_KycIntro, S_KycPan, S_KycAadhaar, S_KycSelfie, S_KycBank, S_KycReview, S_KycStatus });
