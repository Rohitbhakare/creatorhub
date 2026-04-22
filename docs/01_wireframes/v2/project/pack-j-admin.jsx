// Pack J — Custom Admin Panel (desktop) · E4.1 / ADM-FR-001..011
// 10 screens: login, change-password, dashboard, users, kyc, moderation,
// payouts, refunds, editorial collections, analytics + audit log.
// Admin is desktop-first, compact density, dense tabular layouts.
// Auth: Firebase email+password → 4h JWT session cookie (E4.1 spec).

// ══════════════════════════════════════════════════════════════════════
// Browser chrome — 1280 × 800 desktop viewport
// ══════════════════════════════════════════════════════════════════════
const AdminBrowser = ({ children, tk, url = 'admin.creatorhub.in' }) => {
  const { t, typ } = tk;
  return (
    <div style={{ width: 1280, background: '#E7E4DC', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 4px 16px rgba(0,0,0,0.06)', border: `1px solid ${t.hairline}` }}>
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

// ══════════════════════════════════════════════════════════════════════
// Admin shell — sidebar (240) + topbar (56) + main
// ══════════════════════════════════════════════════════════════════════
const NAV_GROUPS = [
  {
    key: 'overview',
    label: 'Overview',
    items: [
      { key: 'dashboard', label: 'Dashboard', icon: 'house', roles: ['super_admin','content_moderator','support','finance','operations'] },
    ],
  },
  {
    key: 'trust',
    label: 'Trust & Safety',
    items: [
      { key: 'users', label: 'Users', icon: 'users', roles: ['super_admin','content_moderator','support'] },
      { key: 'kyc', label: 'KYC queue', icon: 'identification', roles: ['super_admin','support'], badge: 7 },
      { key: 'moderation', label: 'Moderation', icon: 'shield', roles: ['super_admin','content_moderator'], badge: 12 },
    ],
  },
  {
    key: 'money',
    label: 'Money',
    items: [
      { key: 'payouts', label: 'Payouts', icon: 'bank', roles: ['super_admin','finance'] },
      { key: 'refunds', label: 'Refunds', icon: 'receipt', roles: ['super_admin','finance','support'] },
    ],
  },
  {
    key: 'growth',
    label: 'Growth',
    items: [
      { key: 'collections', label: 'Editorial', icon: 'route', roles: ['super_admin','content_moderator'] },
      { key: 'analytics', label: 'Analytics', icon: 'trendUp', roles: ['super_admin','operations'] },
    ],
  },
  {
    key: 'system',
    label: 'System',
    items: [
      { key: 'audit', label: 'Audit log', icon: 'receipt', roles: ['super_admin','content_moderator','support','finance','operations'] },
      { key: 'admins', label: 'Admin users', icon: 'gear', roles: ['super_admin'] },
    ],
  },
];

const RolePill = ({ role, tk }) => {
  const { t, typ } = tk;
  const m = {
    super_admin: { l: 'Super admin', bg: t.primaryTint, fg: t.primaryDeep },
    content_moderator: { l: 'Moderator', bg: 'rgba(24,95,165,0.10)', fg: t.info },
    support: { l: 'Support', bg: 'rgba(29,158,117,0.10)', fg: t.success },
    finance: { l: 'Finance', bg: 'rgba(186,117,23,0.12)', fg: t.warning },
    operations: { l: 'Ops', bg: t.surfaceAlt, fg: t.inkSoft },
  }[role] || { l: role, bg: t.surfaceAlt, fg: t.inkSoft };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', borderRadius: 999, background: m.bg, color: m.fg, fontFamily: typ.body, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
      {m.l}
    </span>
  );
};

const AdminShell = ({ tk, active, role = 'super_admin', children }) => {
  const { t, typ } = tk;
  const visibleGroups = NAV_GROUPS
    .map(g => ({ ...g, items: g.items.filter(n => n.roles.includes(role)) }))
    .filter(g => g.items.length > 0);
  return (
    <div style={{ display: 'flex', background: t.bg, height: 800 }}>
      {/* ── Sidebar ── */}
      <div style={{ width: 240, flexShrink: 0, background: t.surface, borderRight: `1px solid ${t.hairline}`, display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '18px 20px', borderBottom: `1px solid ${t.hairline}` }}>
          <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1 }}>
            CreatorHub<span style={{ color: t.primary }}>.</span>
          </div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, marginTop: 4, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Admin console</div>
        </div>
        <div style={{ flex: 1, padding: '8px 10px 12px', overflowY: 'auto' }}>
          {visibleGroups.map((g, gi) => (
            <div key={g.key} style={{ marginTop: gi === 0 ? 6 : 14 }}>
              <div style={{
                padding: '0 10px 6px', fontFamily: typ.mono, fontSize: 9.5,
                color: t.inkMuted, letterSpacing: '0.16em', textTransform: 'uppercase',
                fontWeight: 700,
              }}>{g.label}</div>
              {g.items.map(n => {
                const on = n.key === active;
                return (
                  <div key={n.key} style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '7px 10px', borderRadius: 6,
                    background: on ? t.surfaceAlt : 'transparent',
                    color: on ? t.ink : t.inkSoft,
                    cursor: 'pointer', marginBottom: 1,
                    position: 'relative',
                  }}>
                    {on && <div style={{ position: 'absolute', left: -10, top: 7, bottom: 7, width: 2, background: t.primary, borderRadius: 1 }}/>}
                    <Icon name={n.icon} size={16} color={on ? t.ink : t.inkMuted}/>
                    <span style={{ flex: 1, fontFamily: typ.body, fontSize: 13, fontWeight: on ? 600 : 500 }}>{n.label}</span>
                    {n.badge && (
                      <span style={{ padding: '1px 7px', borderRadius: 999, background: t.primary, color: '#fff', fontFamily: typ.mono, fontSize: 10, fontWeight: 700 }}>{n.badge}</span>
                    )}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ padding: '12px 14px', borderTop: `1px solid ${t.hairline}`, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Avatar tk={tk} name="RB" size={32} color={t.ink}/>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: typ.body, fontSize: 12, fontWeight: 600, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>Rohit Bhakare</div>
            <div style={{ marginTop: 2 }}><RolePill role={role} tk={tk}/></div>
          </div>
          <Icon name="caretDown" size={14} color={t.inkMuted}/>
        </div>
      </div>
      {/* ── Main ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {children}
      </div>
    </div>
  );
};

const TopBar = ({ tk, title, crumbs = [], right }) => {
  const { t, typ } = tk;
  return (
    <div style={{ height: 56, padding: '0 28px', borderBottom: `1px solid ${t.hairline}`, background: t.surface, display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            <span style={{ fontFamily: typ.body, fontSize: 13, color: t.inkMuted }}>{c}</span>
            <Icon name="caretRight" size={12} color={t.inkFaint}/>
          </React.Fragment>
        ))}
        <span style={{ fontFamily: typ.display, fontSize: 18, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>{title}</span>
      </div>
      {right}
    </div>
  );
};

const Label = ({ tk, children }) => {
  const { typ, t } = tk;
  return <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>{children}</div>;
};

const JLabel = ({ id, sub }) => (
  <div style={{ position: 'absolute', bottom: '100%', left: 0, paddingBottom: 8, fontSize: 12, fontWeight: 500, color: 'rgba(60,50,40,0.7)', whiteSpace: 'nowrap' }}>
    {id}{sub ? <span style={{ color: 'rgba(60,50,40,0.45)', marginLeft: 8 }}>· {sub}</span> : null}
  </div>
);

// ══════════════════════════════════════════════════════════════════════
// J1 — Login (email + password)
// ══════════════════════════════════════════════════════════════════════
const S_AdminLogin = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <div style={{ position: 'relative' }}>
      <JLabel id="J1 · admin.creatorhub.in/login" sub="Firebase email+password · no self-registration"/>
      <AdminBrowser tk={tk} url="admin.creatorhub.in/login">
        <div style={{ background: t.bg, height: 760, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 420, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 36 }}>
            <div style={{ fontFamily: typ.display, fontSize: 26, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1 }}>
              CreatorHub<span style={{ color: t.primary }}>.</span>
            </div>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, marginTop: 6, letterSpacing: '0.12em', textTransform: 'uppercase', fontWeight: 600 }}>Admin console · internal only</div>
            <div style={{ height: 24 }}/>
            <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>Sign in</div>
            <p style={{ margin: '8px 0 22px', fontFamily: typ.body, fontSize: 13, color: t.inkSoft, lineHeight: 1.5 }}>
              Use the credentials your super admin provisioned for you. If you've just been added, you'll be asked to change your temporary password after login.
            </p>
            <Field tk={tk} label="Email">
              <Input tk={tk} placeholder="you@creatorhub.in" value="rohit@creatorhub.in" icon="user"/>
            </Field>
            <div style={{ height: 12 }}/>
            <Field tk={tk} label="Password">
              <Input tk={tk} placeholder="••••••••••••" value="••••••••••••" icon="lock" type="password" suffix={<Icon name="eye" size={16} color={t.inkMuted}/>}/>
            </Field>
            <div style={{ height: 20 }}/>
            <Btn tk={tk} variant="primary" size="md" full>Sign in</Btn>
            <div style={{ marginTop: 16, padding: 10, background: t.surfaceSunk, borderRadius: 6, fontFamily: typ.body, fontSize: 12, color: t.inkSoft, lineHeight: 1.5, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <Icon name="info" size={14} color={t.inkMuted}/>
              <span>Lost access? Ask a super admin to issue a password reset. We don't send reset emails.</span>
            </div>
          </div>
        </div>
      </AdminBrowser>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// J2 — Change password (forced when must_change_password=true)
// ══════════════════════════════════════════════════════════════════════
const S_AdminChangePw = ({ tk }) => {
  const { t, typ } = tk;
  const strengthSegs = [t.success, t.success, t.success, t.hairline]; // 3/4 = strong
  return (
    <div style={{ position: 'relative' }}>
      <JLabel id="J2 · admin.creatorhub.in/change-password" sub="Forced route when must_change_password=true"/>
      <AdminBrowser tk={tk} url="admin.creatorhub.in/change-password">
        <div style={{ background: t.bg, height: 760, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: 460, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 36 }}>
            <Tag tone="warning" subtle tk={tk} icon="warning">Required</Tag>
            <div style={{ height: 12 }}/>
            <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1.1 }}>Change your temporary password</div>
            <p style={{ margin: '10px 0 22px', fontFamily: typ.body, fontSize: 13, color: t.inkSoft, lineHeight: 1.5 }}>
              You can't access the admin console until you set a password you'll remember. Twelve characters minimum — mix case, number, symbol.
            </p>
            <Field tk={tk} label="Current (temporary) password">
              <Input tk={tk} placeholder="" value="••••••••••••••••" type="password"/>
            </Field>
            <div style={{ height: 12 }}/>
            <Field tk={tk} label="New password">
              <Input tk={tk} placeholder="" value="••••••••••••••" type="password" state="valid"/>
            </Field>
            <div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
              {strengthSegs.map((c, i) => <div key={i} style={{ flex: 1, height: 3, borderRadius: 2, background: c }}/>)}
            </div>
            <div style={{ fontFamily: typ.body, fontSize: 11, color: t.success, marginTop: 6 }}>Strong — meets all requirements</div>
            <div style={{ height: 14 }}/>
            <Field tk={tk} label="Confirm new password">
              <Input tk={tk} placeholder="" value="••••••••••••••" type="password" state="valid"/>
            </Field>
            <div style={{ marginTop: 16, fontFamily: typ.body, fontSize: 11, color: t.inkMuted, lineHeight: 1.6 }}>
              {[
                ['check', '12 or more characters'],
                ['check', 'Upper and lower case'],
                ['check', 'At least one number'],
                ['check', 'At least one symbol'],
              ].map(([ic, tx]) => (
                <div key={tx} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Icon name={ic} size={11} color={t.success}/><span>{tx}</span>
                </div>
              ))}
            </div>
            <div style={{ height: 22 }}/>
            <div style={{ display: 'flex', gap: 10 }}>
              <Btn tk={tk} variant="primary" size="md" full>Change password & continue</Btn>
            </div>
          </div>
        </div>
      </AdminBrowser>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// J3 — Dashboard
// ══════════════════════════════════════════════════════════════════════
const StatCard = ({ tk, label, value, sub, tone = 'default', icon }) => {
  const { t, typ } = tk;
  const accent = { coral: t.primary, success: t.success, warning: t.warning, danger: t.danger, info: t.info }[tone] || t.inkSoft;
  return (
    <div style={{ flex: 1, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 18 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon name={icon} size={14} color={accent}/>
        <Label tk={tk}>{label}</Label>
      </div>
      <div style={{ fontFamily: typ.display, fontSize: 36, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1, marginTop: 10 }}>{value}</div>
      <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 6 }}>{sub}</div>
    </div>
  );
};

const AuditRow = ({ tk, time, actor, action, target, tone }) => {
  const { t, typ } = tk;
  const dotColor = { danger: t.danger, success: t.success, warning: t.warning, info: t.info }[tone] || t.inkMuted;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: `1px solid ${t.hairline}` }}>
      <div style={{ width: 6, height: 6, borderRadius: 999, background: dotColor, flexShrink: 0 }}/>
      <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, width: 52, flexShrink: 0 }}>{time}</div>
      <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkSoft, width: 110, flexShrink: 0 }}>{actor}</div>
      <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.ink }}>
        <strong style={{ fontWeight: 600 }}>{action}</strong>
        {target && <span style={{ color: t.inkMuted, marginLeft: 6 }}>· {target}</span>}
      </div>
    </div>
  );
};

const S_AdminDashboard = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <div style={{ position: 'relative' }}>
      <JLabel id="J3 · admin.creatorhub.in/" sub="Dashboard · super_admin view"/>
      <AdminBrowser tk={tk} url="admin.creatorhub.in/">
        <AdminShell tk={tk} active="dashboard" role="super_admin">
          <TopBar tk={tk} title="Dashboard" right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted }}>Wed, 22 Apr · 10:42</span>
              <Btn tk={tk} variant="outline" size="sm" icon="download">Export</Btn>
            </div>
          }/>
          <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <StatCard tk={tk} label="Pending KYC" value="7" sub="2 over 48h · needs attention" tone="warning" icon="identification"/>
              <StatCard tk={tk} label="Open reports" value="12" sub="+4 since yesterday" tone="danger" icon="shield"/>
              <StatCard tk={tk} label="Takedowns today" value="2" sub="Both content_moderator · Priya" tone="info" icon="x"/>
              <StatCard tk={tk} label="Queued payouts" value="₹84,200" sub="11 creators · releases Mon" tone="success" icon="bank"/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.7fr 1fr', gap: 16 }}>
              {/* Audit feed */}
              <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
                  <Label tk={tk}>Recent activity</Label>
                  <div style={{ flex: 1 }}/>
                  <span style={{ fontFamily: typ.body, fontSize: 12, color: t.primary, fontWeight: 600, cursor: 'pointer' }}>View all →</span>
                </div>
                {[
                  ['10:38', 'Priya S. (mod)', 'Took down content', 'post #c_8f21 · "Beach party Goa"', 'danger'],
                  ['10:22', 'Rohit B. (super)', 'Approved KYC', 'user @arjun_trek', 'success'],
                  ['09:54', 'Neha R. (finance)', 'Released payout', '₹12,400 · @meera', 'success'],
                  ['09:31', 'Priya S. (mod)', 'Dismissed 3 reports', 'content #c_7a1d · "false positive"', 'info'],
                  ['09:02', 'Rohit B. (super)', 'Provisioned admin', 'aisha@creatorhub.in · Moderator', 'info'],
                  ['08:48', 'System', 'Auto-deactivated admin', 'karan@creatorhub.in · 91-day idle', 'warning'],
                  ['08:15', 'Priya S. (mod)', 'Suspended user', '@fake_guide · spam pattern', 'danger'],
                  ['07:40', 'Neha R. (finance)', 'Processed refund', '₹2,400 · booking #bk_1092', 'warning'],
                ].map((r, i) => <AuditRow key={i} tk={tk} time={r[0]} actor={r[1]} action={r[2]} target={r[3]} tone={r[4]}/>)}
              </div>
              {/* At a glance */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 20 }}>
                  <Label tk={tk}>Moderation · last 7 days</Label>
                  <div style={{ fontFamily: typ.display, fontSize: 28, fontWeight: typ.displayWeight, color: t.ink, marginTop: 10, letterSpacing: typ.displayTrack, lineHeight: 1 }}>38 <span style={{ fontSize: 13, color: t.inkMuted, fontFamily: typ.body, fontWeight: 400 }}>takedowns</span></div>
                  <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, height: 60, marginTop: 16 }}>
                    {[4,6,3,8,5,7,5].map((v, i) => (
                      <div key={i} style={{ flex: 1, height: v * 7, background: i === 6 ? t.primary : t.hairlineStrong, borderRadius: 2 }}/>
                    ))}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, letterSpacing: '0.08em' }}>
                    {['T','F','S','S','M','T','W'].map((d, i) => <span key={i}>{d}</span>)}
                  </div>
                </div>
                <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 20 }}>
                  <Label tk={tk}>KYC median review time</Label>
                  <div style={{ fontFamily: typ.display, fontSize: 28, fontWeight: typ.displayWeight, color: t.ink, marginTop: 10, letterSpacing: typ.displayTrack, lineHeight: 1 }}>18h <span style={{ fontSize: 13, color: t.success, fontFamily: typ.body, fontWeight: 600 }}>↓ 4h</span></div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 6 }}>Rolling 30-day median · target ≤ 24h</div>
                </div>
                <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 20 }}>
                  <Label tk={tk}>Admins online</Label>
                  <div style={{ display: 'flex', gap: 4, marginTop: 12 }}>
                    {['RB','PS','NR','AK'].map((n, i) => (
                      <div key={i} style={{ position: 'relative' }}>
                        <Avatar tk={tk} name={n} size={28} color={[t.ink, t.info, t.warning, t.success][i]}/>
                        <div style={{ position: 'absolute', bottom: 0, right: 0, width: 8, height: 8, borderRadius: 999, background: t.success, border: `1.5px solid ${t.surface}` }}/>
                      </div>
                    ))}
                  </div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 10 }}>4 of 7 · active last 5 min</div>
                </div>
              </div>
            </div>
          </div>
        </AdminShell>
      </AdminBrowser>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// J4 — User Search + Detail (split view)
// ══════════════════════════════════════════════════════════════════════
const S_AdminUsers = ({ tk }) => {
  const { t, typ } = tk;
  const list = [
    { id: 1, name: 'Meera Iyer', u: '@meera', tag: 'Verified', tone: 'success', on: true },
    { id: 2, name: 'Arjun Trekker', u: '@arjun_trek', tag: 'KYC pending', tone: 'warning' },
    { id: 3, name: 'Priya Shah', u: '@priya_shah' },
    { id: 4, name: 'Kabir Natarajan', u: '@kabir.n', tag: 'Suspended', tone: 'danger' },
    { id: 5, name: 'Ananya Rao', u: '@ananya_travels', tag: 'Featured', tone: 'coral' },
    { id: 6, name: 'Samira Khan', u: '@samira.walks' },
    { id: 7, name: 'Vikram Sethi', u: '@vk.goa' },
    { id: 8, name: 'Devi Ramakrishnan', u: '@devi.ramk' },
  ];
  return (
    <div style={{ position: 'relative' }}>
      <JLabel id="J4 · admin.creatorhub.in/users" sub="ADM-FR-001 · split view · support role shown"/>
      <AdminBrowser tk={tk} url="admin.creatorhub.in/users">
        <AdminShell tk={tk} active="users" role="support">
          <TopBar tk={tk} title="Users" right={<Btn tk={tk} variant="outline" size="sm" icon="funnel">Filters</Btn>}/>
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            {/* List */}
            <div style={{ width: 340, flexShrink: 0, borderRight: `1px solid ${t.hairline}`, display: 'flex', flexDirection: 'column', background: t.surface }}>
              <div style={{ padding: 14, borderBottom: `1px solid ${t.hairline}` }}>
                <Input tk={tk} placeholder="Phone, email, or @username" value="meera" icon="magnifyingGlass"/>
                <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, marginTop: 8, letterSpacing: '0.08em' }}>8 results · sorted by last active</div>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {list.map(u => (
                  <div key={u.id} style={{
                    padding: '12px 14px', display: 'flex', gap: 10, alignItems: 'center',
                    borderBottom: `1px solid ${t.hairline}`,
                    background: u.on ? t.surfaceAlt : 'transparent',
                    borderLeft: u.on ? `2px solid ${t.primary}` : '2px solid transparent',
                  }}>
                    <Avatar tk={tk} name={u.name.split(' ').map(x=>x[0]).join('').slice(0,2)} size={32} color={t.inkSoft}/>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>{u.name}</div>
                      <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, marginTop: 1 }}>{u.u}</div>
                    </div>
                    {u.tag && <Tag tone={u.tone} subtle tk={tk}>{u.tag}</Tag>}
                  </div>
                ))}
              </div>
            </div>
            {/* Detail */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16 }}>
                <Avatar tk={tk} name="MI" size={64} color={t.primary}/>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, lineHeight: 1.1 }}>Meera Iyer</div>
                    <Tag tone="success" subtle tk={tk} icon="checkCircle">Verified</Tag>
                    <Tag tone="coral" subtle tk={tk}>Featured</Tag>
                  </div>
                  <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, marginTop: 4 }}>@meera · user_id c3f8-…a210 · Madikeri, Coorg</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn tk={tk} variant="outline" size="sm" icon="star">Unfeature</Btn>
                  <Btn tk={tk} variant="danger" size="sm">Suspend</Btn>
                </div>
              </div>
              {/* Facts */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 22 }}>
                {[
                  ['Phone', '+91 98••• ••342'],
                  ['Email', 'meera@example.com'],
                  ['Joined', '14 Mar 2024'],
                  ['Last login', '2 hours ago'],
                  ['Creator since', '18 Apr 2024'],
                  ['KYC status', 'Verified · 22 Apr'],
                  ['Total bookings', '1,204'],
                  ['Followers', '8.2K'],
                ].map(([l, v]) => (
                  <div key={l}>
                    <Label tk={tk}>{l}</Label>
                    <div style={{ fontFamily: typ.body, fontSize: 13, color: t.ink, marginTop: 4 }}>{v}</div>
                  </div>
                ))}
              </div>
              {/* Tabs */}
              <div style={{ marginTop: 28, borderBottom: `1px solid ${t.hairline}`, display: 'flex', gap: 24 }}>
                {['Activity', 'KYC', 'Bookings', 'Content', 'Reports'].map((x, i) => (
                  <div key={x} style={{
                    padding: '10px 0', fontFamily: typ.body, fontSize: 13, fontWeight: i === 0 ? 700 : 500,
                    color: i === 0 ? t.ink : t.inkMuted, borderBottom: i === 0 ? `2px solid ${t.primary}` : '2px solid transparent',
                    cursor: 'pointer',
                  }}>{x}{i === 4 ? <span style={{ marginLeft: 6, fontFamily: typ.mono, fontSize: 10, color: t.danger }}>3</span> : null}</div>
                ))}
              </div>
              <div style={{ padding: '16px 0' }}>
                {[
                  ['Published', '"Three days in the Coorg mist" · itinerary', '18 Apr, 14:22'],
                  ['Booking', 'Received booking from @sam.ramani · ₹2,400', '17 Apr, 09:10'],
                  ['Profile', 'Updated bio + cover photo', '12 Apr, 22:05'],
                  ['Payout', 'Released ₹12,400 via Razorpay Route', '8 Apr, 09:30'],
                ].map((r, i) => (
                  <div key={i} style={{ display: 'flex', gap: 16, padding: '10px 0', borderBottom: `1px solid ${t.hairline}` }}>
                    <div style={{ width: 80, fontFamily: typ.mono, fontSize: 11, color: t.inkMuted }}>{r[0]}</div>
                    <div style={{ flex: 1, fontFamily: typ.body, fontSize: 13, color: t.ink }}>{r[1]}</div>
                    <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted }}>{r[2]}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AdminShell>
      </AdminBrowser>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// J5 — KYC Queue + Detail
// ══════════════════════════════════════════════════════════════════════
const S_AdminKyc = ({ tk }) => {
  const { t, typ } = tk;
  const queue = [
    { n: 'Arjun Trekker', u: '@arjun_trek', age: '52h', over: true, on: true },
    { n: 'Samira Khan', u: '@samira.walks', age: '48h', over: true },
    { n: 'Vikram Sethi', u: '@vk.goa', age: '36h' },
    { n: 'Devi Ramakrishnan', u: '@devi.ramk', age: '22h' },
    { n: 'Harsh Patel', u: '@harsh.treks', age: '16h' },
    { n: 'Nisha Bose', u: '@nisha.kolkata', age: '9h' },
    { n: 'Zoya Ahmed', u: '@zoya.routes', age: '4h' },
  ];
  return (
    <div style={{ position: 'relative' }}>
      <JLabel id="J5 · admin.creatorhub.in/kyc" sub="ADM-FR-002 · KYC-FR-032 · support role only can see PII"/>
      <AdminBrowser tk={tk} url="admin.creatorhub.in/kyc">
        <AdminShell tk={tk} active="kyc" role="support">
          <TopBar tk={tk} title="KYC queue" crumbs={['Admin']} right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted }}>7 pending · 2 over 48h</span>
              <Btn tk={tk} variant="outline" size="sm" icon="funnel">All · Sort: age</Btn>
            </div>
          }/>
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <div style={{ width: 320, flexShrink: 0, borderRight: `1px solid ${t.hairline}`, background: t.surface, overflowY: 'auto' }}>
              {queue.map((q, i) => (
                <div key={i} style={{
                  padding: '12px 16px', borderBottom: `1px solid ${t.hairline}`,
                  background: q.on ? t.surfaceAlt : 'transparent',
                  borderLeft: q.on ? `2px solid ${t.primary}` : '2px solid transparent',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Avatar tk={tk} name={q.n.split(' ').map(x=>x[0]).join('').slice(0,2)} size={32} color={t.inkSoft}/>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{q.n}</div>
                    <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, marginTop: 2 }}>{q.u} · {q.age} waiting</div>
                  </div>
                  {q.over && <Tag tone="warning" subtle tk={tk}>&gt;48h</Tag>}
                </div>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <Avatar tk={tk} name="AT" size={48} color={t.warning}/>
                <div style={{ flex: 1 }}>
                  <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>Arjun Trekker</div>
                  <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>@arjun_trek · submitted 52h ago · KYC id kyc_c3f8b2a1</div>
                </div>
                <Tag tone="warning" subtle tk={tk} icon="warning">Over 48h</Tag>
              </div>
              {/* Reveal notice */}
              <div style={{ marginTop: 18, padding: 12, background: t.primaryTint, border: `1px solid ${t.hairlineStrong}`, borderRadius: 6, display: 'flex', gap: 10, alignItems: 'center' }}>
                <Icon name="lock" size={14} color={t.primaryDeep}/>
                <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.primaryDeep, fontWeight: 500 }}>
                  PII access is logged. Only you and super admins will see your <strong>admin_id</strong> next to the <strong>kyc_reveal</strong> entry in audit log.
                </div>
                <span style={{ fontFamily: typ.mono, fontSize: 10, color: t.primaryDeep, letterSpacing: '0.08em' }}>KYC-FR-032</span>
              </div>
              {/* PII grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16, marginTop: 18 }}>
                <div>
                  <Label tk={tk}>PAN card</Label>
                  <div style={{ marginTop: 8, border: `1px solid ${t.hairline}`, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                    <Photo w="100%" h={180} tk={tk} tone="amber" r={0}/>
                    <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4))', display: 'flex', alignItems: 'flex-end', padding: 12 }}>
                      <span style={{ fontFamily: typ.mono, fontSize: 11, color: '#fff' }}>pan_arjun.jpg · 1.2MB · uploaded 52h ago</span>
                    </div>
                  </div>
                </div>
                <div>
                  <Label tk={tk}>Extracted details</Label>
                  <div style={{ marginTop: 8 }}>
                    {[
                      ['PAN name', 'ARJUN RAMESH KHANNA'],
                      ['PAN number', 'AXXPK••••3F'],
                      ['Aadhaar', '•••• •••• 4382'],
                      ['Bank account', 'HDFC •••• 9120'],
                      ['IFSC', 'HDFC0000421'],
                      ['Beneficiary', 'Arjun R Khanna'],
                    ].map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', padding: '8px 0', borderBottom: `1px solid ${t.hairline}`, fontFamily: typ.body, fontSize: 12 }}>
                        <div style={{ width: 110, color: t.inkMuted }}>{k}</div>
                        <div style={{ flex: 1, color: t.ink, fontFamily: k === 'PAN number' || k === 'Aadhaar' || k === 'Bank account' ? typ.mono : typ.body }}>{v}</div>
                        <Icon name="eye" size={14} color={t.inkMuted}/>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {/* Selfie */}
              <div style={{ marginTop: 18 }}>
                <Label tk={tk}>Selfie match · match score 0.92</Label>
                <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
                  <div style={{ width: 140, height: 140, borderRadius: 6, overflow: 'hidden', border: `1px solid ${t.hairline}` }}><Photo w={140} h={140} tk={tk} tone="dusk" r={0}/></div>
                  <div style={{ width: 140, height: 140, borderRadius: 6, overflow: 'hidden', border: `1px solid ${t.hairline}` }}><Photo w={140} h={140} tk={tk} tone="warm" r={0}/></div>
                  <div style={{ flex: 1, padding: 14, background: t.surfaceAlt, borderRadius: 6 }}>
                    <Tag tone="success" subtle tk={tk} icon="checkCircle">Auto-match passed</Tag>
                    <p style={{ margin: '10px 0 0', fontFamily: typ.body, fontSize: 12, color: t.inkSoft, lineHeight: 1.5 }}>
                      Selfie and PAN photo match with score 0.92. No similar face found in rejected queue. Face not previously seen in the abuse register.
                    </p>
                  </div>
                </div>
              </div>
              {/* Actions */}
              <div style={{ marginTop: 24, padding: 18, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: typ.body, fontSize: 13, color: t.ink, fontWeight: 600 }}>Ready to decide</div>
                    <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>Approving promotes the user to a verified creator and unlocks paid publishing.</div>
                  </div>
                  <Btn tk={tk} variant="outline" size="md">Request re-submit</Btn>
                  <Btn tk={tk} variant="danger" size="md">Reject</Btn>
                  <Btn tk={tk} variant="primary" size="md" icon="check">Approve KYC</Btn>
                </div>
              </div>
            </div>
          </div>
        </AdminShell>
      </AdminBrowser>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// J6 — Moderation Queue + Content Detail
// ══════════════════════════════════════════════════════════════════════
const S_AdminModeration = ({ tk }) => {
  const { t, typ } = tk;
  const reports = [
    { id: 1, title: 'Beach party Goa', reason: 'Spam · 5 reports', age: '2h', creator: '@fake_guide', on: true, tone: 'danger' },
    { id: 2, title: '10 secret beaches (clickbait)', reason: 'Misleading · 3 reports', age: '4h', creator: '@quick.trips' },
    { id: 3, title: 'Untitled post', reason: 'Nudity · 2 reports', age: '7h', creator: '@anon29481', tone: 'danger' },
    { id: 4, title: 'Mumbai food walk', reason: 'Hate speech · 1 report', age: '1d', creator: '@food.mumbai', tone: 'warning' },
    { id: 5, title: 'Jaipur sunset', reason: 'Copyright · 1 report', age: '1d', creator: '@jaipur.lens' },
    { id: 6, title: 'Untitled itinerary draft', reason: 'Spam · 1 report', age: '2d', creator: '@bulk.poster' },
  ];
  return (
    <div style={{ position: 'relative' }}>
      <JLabel id="J6 · admin.creatorhub.in/moderation" sub="ADM-FR-003 · content_moderator role"/>
      <AdminBrowser tk={tk} url="admin.creatorhub.in/moderation">
        <AdminShell tk={tk} active="moderation" role="content_moderator">
          <TopBar tk={tk} title="Moderation" right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Segmented tk={tk} options={['Open','Resolved','Dismissed']} value="Open"/>
              <Btn tk={tk} variant="outline" size="sm" icon="funnel">Filters</Btn>
            </div>
          }/>
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <div style={{ width: 360, flexShrink: 0, borderRight: `1px solid ${t.hairline}`, background: t.surface, overflowY: 'auto' }}>
              <div style={{ padding: '10px 16px', borderBottom: `1px solid ${t.hairline}`, fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.1em', textTransform: 'uppercase' }}>12 open · sorted by report count</div>
              {reports.map(r => (
                <div key={r.id} style={{
                  padding: '12px 16px', borderBottom: `1px solid ${t.hairline}`,
                  background: r.on ? t.surfaceAlt : 'transparent',
                  borderLeft: r.on ? `2px solid ${t.primary}` : '2px solid transparent',
                  display: 'flex', gap: 10, alignItems: 'center',
                }}>
                  <div style={{ width: 40, height: 40, borderRadius: 4, overflow: 'hidden', flexShrink: 0 }}><Photo w={40} h={40} tk={tk} tone={['warm','dusk','forest','amber','sand','warm'][r.id % 6]} r={0}/></div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.title}</div>
                    <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, marginTop: 2 }}>{r.creator} · {r.age} ago</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <Tag tone={r.tone || 'default'} subtle tk={tk}>{r.reason.split(' · ')[1]}</Tag>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 120, height: 120, borderRadius: 6, overflow: 'hidden', flexShrink: 0 }}><Photo w={120} h={120} tk={tk} tone="warm" r={0}/></div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Tag tone="default" subtle tk={tk}>Post</Tag>
                    <Tag tone="danger" subtle tk={tk}>5 reports</Tag>
                    <span style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted }}>content_id c_8f21</span>
                  </div>
                  <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack, marginTop: 6, lineHeight: 1.2 }}>Beach party Goa — 🔥 DM for link</div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkSoft, marginTop: 6 }}>Posted 2h ago by @fake_guide · 3 followers · account 2 days old</div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Btn tk={tk} variant="outline" size="sm">Dismiss all</Btn>
                  <Btn tk={tk} variant="danger" size="md" icon="x">Take down</Btn>
                </div>
              </div>
              {/* Reports list */}
              <div style={{ marginTop: 22 }}>
                <Label tk={tk}>5 reports</Label>
                <div style={{ marginTop: 8, border: `1px solid ${t.hairline}`, borderRadius: 6, overflow: 'hidden' }}>
                  {[
                    ['spam', '@meera', 'Clickbait — DM link is an affiliate scam', '2h ago'],
                    ['spam', '@arjun_trek', 'Reposting content from another account', '2h ago'],
                    ['nsfw', '@priya', 'Image not safe for platform', '1h ago'],
                    ['spam', '@ananya', 'Account has posted same copy 4 times', '1h ago'],
                    ['spam', '@devi.ramk', 'Spam · fake account', '34m ago'],
                  ].map((r, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 14px', borderBottom: i < 4 ? `1px solid ${t.hairline}` : 'none', background: i % 2 === 0 ? t.surface : t.surfaceAlt }}>
                      <Tag tone={r[0] === 'nsfw' ? 'danger' : 'warning'} subtle tk={tk}>{r[0]}</Tag>
                      <div style={{ width: 96, fontFamily: typ.mono, fontSize: 11, color: t.inkSoft }}>{r[1]}</div>
                      <div style={{ flex: 1, fontFamily: typ.body, fontSize: 12, color: t.ink }}>{r[2]}</div>
                      <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted }}>{r[3]}</div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Takedown reason */}
              <div style={{ marginTop: 20, padding: 16, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8 }}>
                <Label tk={tk}>Takedown reason · required</Label>
                <div style={{ marginTop: 10 }}>
                  <Segmented tk={tk} options={['Spam','NSFW','Hate','Copyright','Off-platform','Other']} value="Spam"/>
                </div>
                <div style={{ marginTop: 10 }}>
                  <Input tk={tk} placeholder="Note (visible in creator notification)" value="Affiliate spam pattern. DM contains external link to scam listing." icon="pencilSimple"/>
                </div>
                <div style={{ marginTop: 12, fontFamily: typ.body, fontSize: 11, color: t.inkMuted }}>
                  Creator will be notified within 60 seconds. They can appeal within 24h via the Studio tab.
                </div>
              </div>
            </div>
          </div>
        </AdminShell>
      </AdminBrowser>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// J7 — Payout Run
// ══════════════════════════════════════════════════════════════════════
const S_AdminPayouts = ({ tk }) => {
  const { t, typ } = tk;
  const rows = [
    ['@meera', 'Meera Iyer', '₹12,400', '4 bookings', '22 Apr', 'Eligible', 'success'],
    ['@arjun_trek', 'Arjun Khanna', '₹8,200', '3 bookings', '22 Apr', 'Eligible', 'success'],
    ['@ananya_travels', 'Ananya Rao', '₹22,000', '8 bookings', '22 Apr', 'Eligible', 'success'],
    ['@samira.walks', 'Samira Khan', '₹4,600', '2 bookings', '22 Apr', 'KYC pending', 'warning'],
    ['@devi.ramk', 'Devi R.', '₹18,400', '6 bookings', '22 Apr', 'Eligible', 'success'],
    ['@vk.goa', 'Vikram Sethi', '₹6,200', '3 bookings', '22 Apr', 'Dispute window', 'info'],
    ['@nisha.kolkata', 'Nisha Bose', '₹2,400', '1 booking', '22 Apr', 'Eligible', 'success'],
    ['@harsh.treks', 'Harsh Patel', '₹10,000', '4 bookings', '22 Apr', 'Eligible', 'success'],
  ];
  return (
    <div style={{ position: 'relative' }}>
      <JLabel id="J7 · admin.creatorhub.in/payouts" sub="ADM-FR-004 · finance role · E2.12 integration"/>
      <AdminBrowser tk={tk} url="admin.creatorhub.in/payouts">
        <AdminShell tk={tk} active="payouts" role="finance">
          <TopBar tk={tk} title="Payouts" right={
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted }}>Next auto-release Mon 28 Apr · 09:00</span>
              <Btn tk={tk} variant="outline" size="sm" icon="download">Export CSV</Btn>
            </div>
          }/>
          <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
            {/* Summary */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <StatCard tk={tk} label="Pending payouts" value="₹84,200" sub="11 creators queued" tone="success" icon="bank"/>
              <StatCard tk={tk} label="Eligible now" value="₹68,600" sub="7 creators · past dispute window" tone="success" icon="check"/>
              <StatCard tk={tk} label="Held" value="₹15,600" sub="4 creators · KYC/dispute" tone="warning" icon="warning"/>
              <StatCard tk={tk} label="Last run" value="₹1.2L" sub="Mon 21 Apr · 21 creators · no failures" tone="info" icon="clock"/>
            </div>
            <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8 }}>
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: `1px solid ${t.hairline}` }}>
                <div style={{ flex: 1 }}>
                  <Label tk={tk}>Queue</Label>
                  <div style={{ fontFamily: typ.body, fontSize: 13, color: t.ink, fontWeight: 600, marginTop: 4 }}>11 pending · 7 eligible to force-release now</div>
                </div>
                <Segmented tk={tk} options={['All','Eligible','Held']} value="All"/>
                <Btn tk={tk} variant="outline" size="sm">Hold all</Btn>
                <Btn tk={tk} variant="primary" size="sm" icon="check">Release 7 eligible · ₹68,600</Btn>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr 1fr 1fr 120px', padding: '10px 20px', background: t.surfaceAlt, borderBottom: `1px solid ${t.hairline}`, fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                <div><input type="checkbox" readOnly/></div>
                <div>Creator</div>
                <div>Full name</div>
                <div>Amount</div>
                <div>Source</div>
                <div>Scheduled</div>
                <div>Status</div>
                <div style={{ textAlign: 'right' }}>Action</div>
              </div>
              {rows.map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '40px 2fr 1.5fr 1fr 1fr 1fr 1fr 120px', padding: '12px 20px', borderBottom: i < rows.length - 1 ? `1px solid ${t.hairline}` : 'none', fontFamily: typ.body, fontSize: 13, alignItems: 'center' }}>
                  <div><input type="checkbox" readOnly/></div>
                  <div style={{ fontFamily: typ.mono, fontSize: 12, color: t.ink, fontWeight: 600 }}>{r[0]}</div>
                  <div style={{ color: t.inkSoft }}>{r[1]}</div>
                  <div style={{ fontFamily: typ.mono, color: t.ink, fontWeight: 600 }}>{r[2]}</div>
                  <div style={{ color: t.inkMuted, fontFamily: typ.body, fontSize: 12 }}>{r[3]}</div>
                  <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkSoft }}>{r[4]}</div>
                  <div><Tag tone={r[6]} subtle tk={tk}>{r[5]}</Tag></div>
                  <div style={{ textAlign: 'right' }}>
                    <Btn tk={tk} variant={r[5] === 'Eligible' ? 'outline' : 'ghost'} size="sm" disabled={r[5] !== 'Eligible'}>Release</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </AdminShell>
      </AdminBrowser>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// J8 — Manual Refund
// ══════════════════════════════════════════════════════════════════════
const S_AdminRefunds = ({ tk }) => {
  const { t, typ } = tk;
  return (
    <div style={{ position: 'relative' }}>
      <JLabel id="J8 · admin.creatorhub.in/refunds" sub="ADM-FR-005 · finance or support role"/>
      <AdminBrowser tk={tk} url="admin.creatorhub.in/refunds">
        <AdminShell tk={tk} active="refunds" role="finance">
          <TopBar tk={tk} title="Manual refund" crumbs={['Admin', 'Payments']}/>
          <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: 20 }}>
            {/* Find booking */}
            <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 22 }}>
              <Label tk={tk}>1 · Find booking</Label>
              <div style={{ marginTop: 12 }}>
                <Input tk={tk} placeholder="bk_•••••• or booking reference" value="bk_1092" icon="magnifyingGlass"/>
              </div>
              <div style={{ marginTop: 20, padding: 16, background: t.surfaceSunk, borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 72, height: 72, borderRadius: 4, overflow: 'hidden' }}><Photo w={72} h={72} tk={tk} tone="forest" r={0}/></div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: typ.body, fontSize: 14, color: t.ink, fontWeight: 600 }}>Coorg Coffee Trail</div>
                    <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>bk_1092 · creator @meera · buyer @sam.ramani</div>
                  </div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 14 }}>
                  {[
                    ['Scheduled', 'Sat 27 Apr · 06:00 IST'],
                    ['Captured', '₹2,400 on 19 Apr'],
                    ['Platform fee', '₹408 · 17%'],
                    ['GST', '₹432 · 18%'],
                    ['Status', 'confirmed'],
                    ['Cancellable?', 'Yes · 72h before start'],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{k}</div>
                      <div style={{ fontFamily: typ.body, fontSize: 13, color: t.ink, marginTop: 4 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Refund form */}
            <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 22 }}>
              <Label tk={tk}>2 · Refund</Label>
              <div style={{ height: 14 }}/>
              <Field tk={tk} label="Amount to refund" hint="Max ₹2,400 captured · GST + fee returned to platform">
                <Input tk={tk} placeholder="" value="2400" icon="currencyInr" suffix={<span style={{ fontFamily: typ.mono, fontSize: 11, color: t.primary, fontWeight: 700, cursor: 'pointer' }}>FULL</span>}/>
              </Field>
              <div style={{ height: 12 }}/>
              <Field tk={tk} label="Refund policy">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '10px 14px', border: `1px solid ${t.hairline}`, borderRadius: 6 }}>
                  {[
                    ['full','Full refund (policy A · >72h before start)', true],
                    ['partial','Partial refund · 50%', false],
                    ['emergency','Emergency · platform goodwill', false],
                  ].map(([k, l, on]) => (
                    <div key={k} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                      <div style={{ width: 16, height: 16, borderRadius: 999, border: `2px solid ${on ? t.primary : t.hairlineStrong}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {on && <div style={{ width: 8, height: 8, borderRadius: 999, background: t.primary }}/>}
                      </div>
                      <span style={{ fontFamily: typ.body, fontSize: 13, color: on ? t.ink : t.inkSoft }}>{l}</span>
                    </div>
                  ))}
                </div>
              </Field>
              <div style={{ height: 12 }}/>
              <Field tk={tk} label="Reason · required" hint="Shown to both parties + audit log">
                <Input tk={tk} placeholder="" value="Host rescheduling — weather cancellation per policy A"/>
              </Field>
              <div style={{ marginTop: 16, padding: 12, background: t.surfaceAlt, borderRadius: 6, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <Icon name="info" size={14} color={t.info}/>
                <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkSoft, lineHeight: 1.5 }}>
                  Razorpay will process this within 5–7 business days to the original UPI. Creator's pending payout is automatically reduced by ₹1,560 (net-of-fee).
                </div>
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
                <Btn tk={tk} variant="outline" size="md">Cancel</Btn>
                <Btn tk={tk} variant="primary" size="md" full icon="check">Refund ₹2,400</Btn>
              </div>
            </div>
          </div>
        </AdminShell>
      </AdminBrowser>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// J9 — Editorial Collections (list + editor)
// ══════════════════════════════════════════════════════════════════════
const S_AdminCollections = ({ tk }) => {
  const { t, typ } = tk;
  const collections = [
    { slug: 'monsoon-escapes', title: 'Monsoon escapes', count: 8, status: 'Published', on: true, tone: 'success' },
    { slug: 'weekend-walks-blr', title: 'Weekend walks · BLR', count: 12, status: 'Published', tone: 'success' },
    { slug: 'under-2k', title: 'Under ₹2,000', count: 18, status: 'Published', tone: 'success' },
    { slug: 'editors-picks-apr', title: "Editor's picks · April", count: 6, status: 'Draft', tone: 'default' },
    { slug: 'first-time-creators', title: 'First-time creators', count: 9, status: 'Scheduled', tone: 'info' },
    { slug: 'kerala-backwaters', title: 'Kerala backwaters', count: 0, status: 'Draft', tone: 'default' },
  ];
  const items = [
    { title: 'Three days in the Coorg mist', type: 'Itinerary', creator: '@meera', cover: 'forest' },
    { title: 'Monsoon photo walk · Chikmagalur', type: 'Experience', creator: '@ananya_travels', cover: 'dusk' },
    { title: 'Road to Coonoor — slow miles', type: 'Itinerary', creator: '@devi.ramk', cover: 'warm' },
    { title: 'Waterfall hunt · Agumbe', type: 'Experience', creator: '@arjun_trek', cover: 'forest' },
    { title: 'Where to eat when it rains in Mumbai', type: 'Story', creator: '@food.mumbai', cover: 'amber' },
    { title: 'Why Madikeri in August is magic', type: 'Story', creator: '@meera', cover: 'dusk' },
    { title: 'Konkan beaches in the rain', type: 'Itinerary', creator: '@vk.goa', cover: 'sand' },
    { title: 'Munnar in monsoon · weekend plan', type: 'Itinerary', creator: '@harsh.treks', cover: 'forest' },
  ];
  return (
    <div style={{ position: 'relative' }}>
      <JLabel id="J9 · admin.creatorhub.in/collections/monsoon-escapes" sub="ADM-FR-009 · content_moderator role"/>
      <AdminBrowser tk={tk} url="admin.creatorhub.in/collections/monsoon-escapes">
        <AdminShell tk={tk} active="collections" role="content_moderator">
          <TopBar tk={tk} title="Monsoon escapes" crumbs={['Editorial', 'Collections']} right={
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn tk={tk} variant="outline" size="sm" icon="eye">Preview</Btn>
              <Btn tk={tk} variant="dark" size="sm">Save changes</Btn>
            </div>
          }/>
          <div style={{ flex: 1, display: 'flex', minHeight: 0 }}>
            <div style={{ width: 280, flexShrink: 0, borderRight: `1px solid ${t.hairline}`, background: t.surface, overflowY: 'auto' }}>
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${t.hairline}` }}>
                <Btn tk={tk} variant="outline" size="sm" full icon="plus">New collection</Btn>
              </div>
              {collections.map(c => (
                <div key={c.slug} style={{
                  padding: '12px 16px', borderBottom: `1px solid ${t.hairline}`,
                  background: c.on ? t.surfaceAlt : 'transparent',
                  borderLeft: c.on ? `2px solid ${t.primary}` : '2px solid transparent',
                }}>
                  <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>{c.title}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                    <span style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted }}>{c.count} items</span>
                    <Tag tone={c.tone} subtle tk={tk}>{c.status}</Tag>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px' }}>
              {/* Metadata */}
              <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 20, marginBottom: 16 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
                  <div>
                    <Field tk={tk} label="Title" required>
                      <Input tk={tk} value="Monsoon escapes" placeholder=""/>
                    </Field>
                    <div style={{ height: 10 }}/>
                    <Field tk={tk} label="Slug">
                      <Input tk={tk} value="monsoon-escapes" placeholder="" icon="route"/>
                    </Field>
                    <div style={{ height: 10 }}/>
                    <Field tk={tk} label="Subtitle">
                      <Input tk={tk} value="Eight slow trips for when the rain comes back." placeholder=""/>
                    </Field>
                  </div>
                  <div>
                    <Label tk={tk}>Cover</Label>
                    <div style={{ marginTop: 8, border: `1px dashed ${t.hairlineStrong}`, borderRadius: 6, overflow: 'hidden', position: 'relative' }}>
                      <Photo w="100%" h={140} tk={tk} tone="dusk" r={0}/>
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <Btn tk={tk} variant="outline" size="sm" icon="upload">Replace</Btn>
                      </div>
                    </div>
                    <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: t.surfaceAlt, borderRadius: 6 }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: typ.body, fontSize: 12, color: t.ink, fontWeight: 600 }}>Publish state</div>
                        <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, marginTop: 2 }}>Live in Discover tab for all users</div>
                      </div>
                      <Toggle on tk={tk}/>
                    </div>
                  </div>
                </div>
              </div>
              {/* Items */}
              <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: 14 }}>
                  <div>
                    <Label tk={tk}>Items · 8</Label>
                    <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 4 }}>Drag the handle to reorder · first item appears in the hero slot</div>
                  </div>
                  <div style={{ flex: 1 }}/>
                  <div style={{ width: 280 }}>
                    <Input tk={tk} placeholder="Add content · search by title or creator…" icon="plus"/>
                  </div>
                </div>
                {items.map((it, i) => (
                  <div key={i} style={{ display: 'grid', gridTemplateColumns: '24px 56px 1fr 140px 120px 32px', padding: '10px 8px', borderBottom: i < items.length - 1 ? `1px solid ${t.hairline}` : 'none', alignItems: 'center', gap: 14 }}>
                    <div style={{ color: t.inkFaint, fontFamily: typ.mono, fontSize: 14, cursor: 'grab', textAlign: 'center' }}>⋮⋮</div>
                    <div style={{ width: 48, height: 48, borderRadius: 4, overflow: 'hidden' }}><Photo w={48} h={48} tk={tk} tone={it.cover} r={0}/></div>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontFamily: typ.body, fontSize: 13, color: t.ink, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.title}</div>
                      <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, marginTop: 2 }}>position {i + 1}</div>
                    </div>
                    <Tag tone="default" subtle tk={tk}>{it.type}</Tag>
                    <span style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkSoft }}>{it.creator}</span>
                    <Icon name="x" size={14} color={t.inkMuted}/>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </AdminShell>
      </AdminBrowser>
    </div>
  );
};

// ══════════════════════════════════════════════════════════════════════
// J10 — Search Analytics + Audit Log (tabbed)
// ══════════════════════════════════════════════════════════════════════
const S_AdminAnalytics = ({ tk }) => {
  const { t, typ } = tk;
  const top = [
    ['goa beaches', 1284, 0.42, 312],
    ['monsoon trek', 892, 0.38, 198],
    ['weekend near blr', 714, 0.51, 228],
    ['photo walk', 602, 0.44, 176],
    ['coorg', 588, 0.62, 215],
    ['solo female travel', 512, 0.33, 112],
    ['food walk mumbai', 487, 0.48, 142],
    ['himalaya trek', 402, 0.29, 88],
  ];
  const zero = [
    ['scuba trivandrum', 42, '↑ 12'],
    ['yoga retreat ladakh', 38, '↑ 8'],
    ['motorbike rental goa', 31, '→'],
    ['photography course pune', 24, '↑ 4'],
    ['cooking class sikkim', 18, 'new'],
    ['fishing experience kerala', 14, '→'],
    ['ice climbing himachal', 11, '↑ 2'],
  ];
  return (
    <div style={{ position: 'relative' }}>
      <JLabel id="J10 · admin.creatorhub.in/analytics/search" sub="ADM-FR-010 · operations role · audit tab inset"/>
      <AdminBrowser tk={tk} url="admin.creatorhub.in/analytics/search">
        <AdminShell tk={tk} active="analytics" role="operations">
          <TopBar tk={tk} title="Search analytics" crumbs={['Analytics']} right={
            <div style={{ display: 'flex', gap: 8 }}>
              <Segmented tk={tk} options={['7 days','30 days','90 days']} value="7 days"/>
              <Btn tk={tk} variant="outline" size="sm" icon="download">Export</Btn>
            </div>
          }/>
          <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>
            <div style={{ display: 'flex', gap: 12, marginBottom: 20 }}>
              <StatCard tk={tk} label="Total searches" value="24,812" sub="↑ 12% vs last 7d" tone="info" icon="magnifyingGlass"/>
              <StatCard tk={tk} label="Unique searchers" value="8,412" sub="34% logged-in · 66% anon" tone="info" icon="users"/>
              <StatCard tk={tk} label="Zero-result rate" value="14%" sub="↓ 2pp · target ≤12%" tone="warning" icon="warning"/>
              <StatCard tk={tk} label="Top CTR" value="62%" sub="&#34;coorg&#34; · see below" tone="success" icon="trendUp"/>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
              {/* Top queries */}
              <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 20 }}>
                <Label tk={tk}>Top queries · last 7 days</Label>
                <div style={{ marginTop: 14 }}>
                  {top.map((r, i) => {
                    const pct = (r[1] / top[0][1]) * 100;
                    return (
                      <div key={i} style={{ padding: '10px 0', borderBottom: i < top.length - 1 ? `1px solid ${t.hairline}` : 'none' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div style={{ width: 160, fontFamily: typ.mono, fontSize: 12, color: t.ink, fontWeight: 600 }}>{r[0]}</div>
                          <div style={{ flex: 1, height: 6, background: t.surfaceAlt, borderRadius: 3 }}>
                            <div style={{ width: `${pct}%`, height: '100%', background: t.primary, borderRadius: 3 }}/>
                          </div>
                          <div style={{ width: 60, fontFamily: typ.mono, fontSize: 11, color: t.inkSoft, textAlign: 'right' }}>{r[1].toLocaleString()}</div>
                          <div style={{ width: 48, fontFamily: typ.mono, fontSize: 11, color: r[2] >= 0.5 ? t.success : t.inkMuted, textAlign: 'right', fontWeight: 600 }}>{(r[2] * 100).toFixed(0)}%</div>
                          <div style={{ width: 48, fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, textAlign: 'right' }}>{r[3]}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div style={{ display: 'flex', marginTop: 10, paddingLeft: 172 }}>
                  <div style={{ flex: 1 }}/>
                  {['searches','CTR','clicks'].map((h, i) => (
                    <div key={h} style={{ width: i === 0 ? 60 : 48, fontFamily: typ.mono, fontSize: 9, color: t.inkFaint, textAlign: 'right', letterSpacing: '0.1em', textTransform: 'uppercase' }}>{h}</div>
                  ))}
                </div>
              </div>
              {/* Zero-results */}
              <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8, padding: 20 }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <Label tk={tk}>Zero-result queries</Label>
                  <div style={{ flex: 1 }}/>
                  <Tag tone="warning" subtle tk={tk}>{zero.length} this week</Tag>
                </div>
                <p style={{ margin: '10px 0 14px', fontFamily: typ.body, fontSize: 12, color: t.inkSoft, lineHeight: 1.5 }}>
                  What users wanted but didn't find. Use this to plan editorial collections or nudge creators.
                </p>
                {zero.map((r, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', padding: '10px 0', borderBottom: i < zero.length - 1 ? `1px solid ${t.hairline}` : 'none' }}>
                    <div style={{ flex: 1, fontFamily: typ.mono, fontSize: 12, color: t.ink, fontWeight: 600 }}>{r[0]}</div>
                    <div style={{ width: 48, fontFamily: typ.mono, fontSize: 11, color: t.inkSoft, textAlign: 'right' }}>{r[1]}</div>
                    <div style={{ width: 56, fontFamily: typ.mono, fontSize: 10, color: r[2] === 'new' ? t.primary : t.inkMuted, textAlign: 'right', fontWeight: 700 }}>{r[2]}</div>
                    <Icon name="plusCircle" size={14} color={t.inkMuted} style={{ marginLeft: 8 }}/>
                  </div>
                ))}
              </div>
            </div>
            {/* Audit log preview (tab-inset, same route family) */}
            <div style={{ marginTop: 24, background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: 8 }}>
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', borderBottom: `1px solid ${t.hairline}` }}>
                <Label tk={tk}>Audit log · linked view</Label>
                <div style={{ flex: 1 }}/>
                <Input tk={tk} placeholder="Actor, action, or target…" icon="magnifyingGlass"/>
                <div style={{ width: 10 }}/>
                <Btn tk={tk} variant="outline" size="sm" icon="funnel">All actions</Btn>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '100px 140px 1.2fr 1.5fr 1fr', padding: '10px 20px', background: t.surfaceAlt, borderBottom: `1px solid ${t.hairline}`, fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, letterSpacing: '0.08em', textTransform: 'uppercase', fontWeight: 600 }}>
                <div>Time</div>
                <div>Actor</div>
                <div>Action</div>
                <div>Target</div>
                <div>Source IP</div>
              </div>
              {[
                ['22 Apr 10:38', 'priya@ · mod', 'content.takedown', 'c_8f21 · "Beach party Goa"', '49.37.214.12'],
                ['22 Apr 10:22', 'rohit@ · super', 'kyc.approve', 'user @arjun_trek', '103.21.58.44'],
                ['22 Apr 09:54', 'neha@ · finance', 'payout.release', '₹12,400 · @meera', '103.21.58.44'],
                ['22 Apr 09:31', 'priya@ · mod', 'report.dismiss', '3 reports · c_7a1d', '49.37.214.12'],
                ['22 Apr 09:02', 'rohit@ · super', 'admin.create', 'aisha@ · content_moderator', '103.21.58.44'],
                ['22 Apr 08:15', 'priya@ · mod', 'user.suspend', '@fake_guide · spam pattern', '49.37.214.12'],
              ].map((r, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 140px 1.2fr 1.5fr 1fr', padding: '10px 20px', borderBottom: i < 5 ? `1px solid ${t.hairline}` : 'none', fontFamily: typ.mono, fontSize: 11, color: t.inkSoft }}>
                  <div>{r[0]}</div>
                  <div>{r[1]}</div>
                  <div style={{ color: t.ink, fontWeight: 600 }}>{r[2]}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkSoft }}>{r[3]}</div>
                  <div>{r[4]}</div>
                </div>
              ))}
            </div>
          </div>
        </AdminShell>
      </AdminBrowser>
    </div>
  );
};

Object.assign(window, {
  S_AdminLogin, S_AdminChangePw, S_AdminDashboard, S_AdminUsers,
  S_AdminKyc, S_AdminModeration, S_AdminPayouts, S_AdminRefunds,
  S_AdminCollections, S_AdminAnalytics,
});
