// CreatorHub primitives — pure-white aesthetic.
// All components take { t, typ, radius, density } via a single `tk` bag for brevity.

// ──────────────────────────────────────────────────────────────────────────────
// Phosphor-style icon set (stroke weight 1.5 outline, duotone achievable via fill)
// ──────────────────────────────────────────────────────────────────────────────
const Icon = ({ name, size = 20, color = 'currentColor', weight = 'regular' }) => {
  const sw = weight === 'bold' ? 2 : weight === 'fill' ? 0 : 1.5;
  const filled = weight === 'fill';
  const p = filled
    ? { fill: color, stroke: color, strokeWidth: 0.5, strokeLinejoin: 'round' }
    : { fill: 'none', stroke: color, strokeWidth: sw, strokeLinecap: 'round', strokeLinejoin: 'round' };

  const paths = {
    // nav
    house:    <path {...p} d="M3 11l9-8 9 8v9a2 2 0 0 1-2 2h-4v-7h-6v7H5a2 2 0 0 1-2-2v-9z"/>,
    compass:  <g><circle cx="12" cy="12" r="9" {...p}/><path {...p} d="M15.5 8.5l-2.2 5.3-5.3 2.2 2.2-5.3 5.3-2.2z"/></g>,
    plusCircle: <g><circle cx="12" cy="12" r="9" {...p}/><path {...p} d="M12 8v8M8 12h8"/></g>,
    pencilSimple: <g><path {...p} d="M14 4l6 6-10 10H4v-6L14 4z"/></g>,
    heart:    <path {...p} d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>,
    bookmark: <path {...p} d="M7 3h10a1 1 0 0 1 1 1v17l-6-4-6 4V4a1 1 0 0 1 1-1z"/>,
    user:     <g><circle cx="12" cy="8" r="4" {...p}/><path {...p} d="M4 21c0-4.4 3.6-8 8-8s8 3.6 8 8"/></g>,
    users:    <g><circle cx="9" cy="8" r="3.5" {...p}/><path {...p} d="M2 21a7 7 0 0 1 14 0"/><path {...p} d="M16 4a3.5 3.5 0 0 1 0 7M22 21a7 7 0 0 0-5-6.7"/></g>,
    // actions
    magnifyingGlass: <g><circle cx="11" cy="11" r="7" {...p}/><path {...p} d="M20 20l-4-4"/></g>,
    bell:     <g><path {...p} d="M6 8a6 6 0 1 1 12 0c0 7 3 9 3 9H3s3-2 3-9z"/><path {...p} d="M10 21a2 2 0 0 0 4 0"/></g>,
    gear:     <g><circle cx="12" cy="12" r="3" {...p}/><path {...p} d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.9 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.9.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.9V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/></g>,
    share:    <g><circle cx="18" cy="5" r="3" {...p}/><circle cx="6" cy="12" r="3" {...p}/><circle cx="18" cy="19" r="3" {...p}/><path {...p} d="M8.5 10.5l7-4M8.5 13.5l7 4"/></g>,
    chat:     <path {...p} d="M4 5a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-7l-5 4v-4H6a2 2 0 0 1-2-2V5z"/>,
    // map / travel
    mapPin:   <g><path {...p} d="M12 21s-7-7.5-7-12a7 7 0 0 1 14 0c0 4.5-7 12-7 12z"/><circle cx="12" cy="9" r="2.5" {...p}/></g>,
    mountains:<g><path {...p} d="M3 20l5-9 4 6 3-4 6 7H3z"/><circle cx="16" cy="6" r="2" {...p}/></g>,
    bookOpen: <g><path {...p} d="M12 6s-3-2-9-2v14c6 0 9 2 9 2s3-2 9-2V4c-6 0-9 2-9 2z"/><path {...p} d="M12 6v14"/></g>,
    forkKnife:<g><path {...p} d="M6 3v7a2 2 0 0 0 2 2v9M6 3v4M9 3v4"/><path {...p} d="M17 3c-2 0-3 2-3 5s1 4 3 4v9"/></g>,
    camera:   <g><rect x="3" y="7" width="18" height="13" rx="2" {...p}/><circle cx="12" cy="13" r="3.5" {...p}/><path {...p} d="M8 7l1.5-3h5L16 7"/></g>,
    sun:      <g><circle cx="12" cy="12" r="4" {...p}/><path {...p} d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></g>,
    musicNotes: <g><circle cx="7" cy="18" r="2.5" {...p}/><circle cx="17" cy="16" r="2.5" {...p}/><path {...p} d="M9.5 18V6l10-2v12"/></g>,
    barbell:  <g><path {...p} d="M4 9v6M6 7v10M9 10h6M18 9v6M20 7v10"/></g>,
    graduationCap: <g><path {...p} d="M3 9l9-4 9 4-9 4-9-4z"/><path {...p} d="M7 11v4c0 1.5 2.5 3 5 3s5-1.5 5-3v-4M21 9v5"/></g>,
    ticket:   <path {...p} d="M3 8a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v2a2 2 0 1 0 0 4v2a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V8z"/>,
    // chev / nav
    caretRight: <path {...p} d="M9 6l6 6-6 6"/>,
    caretLeft:  <path {...p} d="M15 6l-6 6 6 6"/>,
    caretDown:  <path {...p} d="M6 9l6 6 6-6"/>,
    caretUp:    <path {...p} d="M6 15l6-6 6 6"/>,
    arrowRight: <path {...p} d="M5 12h14M13 5l7 7-7 7"/>,
    arrowUp:    <path {...p} d="M12 5v14M5 12l7-7 7 7"/>,
    x:          <path {...p} d="M6 6l12 12M18 6L6 18"/>,
    check:      <path {...p} d="M4 12l5 5L20 6"/>,
    // status
    warning:  <g><path {...p} d="M12 3l10 17H2L12 3z"/><path {...p} d="M12 10v5M12 17.5v.5"/></g>,
    info:     <g><circle cx="12" cy="12" r="9" {...p}/><path {...p} d="M12 11v5M12 7.5v.5"/></g>,
    checkCircle: <g><circle cx="12" cy="12" r="9" {...p}/><path {...p} d="M8 12l3 3 5-6"/></g>,
    lock:     <g><rect x="4" y="10" width="16" height="11" rx="2" {...p}/><path {...p} d="M8 10V7a4 4 0 0 1 8 0v3"/></g>,
    // misc
    clock:    <g><circle cx="12" cy="12" r="9" {...p}/><path {...p} d="M12 7v5l3 2"/></g>,
    calendar: <g><rect x="3" y="5" width="18" height="16" rx="2" {...p}/><path {...p} d="M3 9h18M8 3v4M16 3v4"/></g>,
    currencyInr: <path {...p} d="M7 5h10M7 9h10M7 5c4 0 6 2 6 4s-2 4-6 4h-1l7 6"/>,
    sliders: <g><path {...p} d="M4 6h12M4 12h6M4 18h8"/><circle cx="19" cy="6" r="2" {...p}/><circle cx="15" cy="12" r="2" {...p}/><circle cx="17" cy="18" r="2" {...p}/></g>,
    funnel:  <path {...p} d="M3 5h18l-7 9v6l-4-2v-4L3 5z"/>,
    upload:  <g><path {...p} d="M12 16V4M6 10l6-6 6 6"/><path {...p} d="M4 20h16"/></g>,
    cameraPlus: <g><rect x="3" y="7" width="18" height="13" rx="2" {...p}/><circle cx="12" cy="13" r="3.5" {...p}/><path {...p} d="M8 7l1.5-3h5L16 7M19 10v4M17 12h4"/></g>,
    plus:    <path {...p} d="M12 5v14M5 12h14"/>,
    minus:   <path {...p} d="M5 12h14"/>,
    dotsThree: <g><circle cx="5" cy="12" r="1.5" {...p} fill={color}/><circle cx="12" cy="12" r="1.5" {...p} fill={color}/><circle cx="19" cy="12" r="1.5" {...p} fill={color}/></g>,
    eye: <g><path {...p} d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3" {...p}/></g>,
    flame: <path {...p} d="M12 3s-1 3 2 6 2 6 2 6a6 6 0 1 1-8 0s-1-2 0-4 4-2 4-8z"/>,
    star:  <path {...p} d="M12 3l2.8 6 6.2.6-4.8 4.4 1.4 6.4L12 17.1l-5.6 3.3 1.4-6.4L3 9.6l6.2-.6L12 3z"/>,
    trendUp: <path {...p} d="M3 17l6-6 4 4 8-9M15 6h6v6"/>,
    phone: <path {...p} d="M5 4h4l2 5-3 2a12 12 0 0 0 5 5l2-3 5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2z"/>,
    whatsapp: <g><path {...p} d="M20 12a8 8 0 1 1-3.2-6.4L21 4l-1.4 4.3A8 8 0 0 1 20 12z"/><path {...p} d="M9 8c0 4 3 7 7 7l1.5-2.5-3-1-.8 1a5.8 5.8 0 0 1-2-2l1-.8-1-3L9 8z"/></g>,
    google: <g><path {...p} d="M21 12h-9v2.5h5.5c-.4 2-2 3.5-5.5 3.5a5.5 5.5 0 1 1 0-11 5 5 0 0 1 3.5 1.3l2-2A8 8 0 1 0 20 13a8 8 0 0 0 1-1z"/></g>,
    apple: <g><path {...p} d="M15 3c0 2-1.5 3.5-3 3.5 0-2 1.5-3.5 3-3.5z"/><path {...p} d="M8 9c2 0 3-1 4-1s2 1 3.5 1 2.5 1.5 2.5 3.5-1 4-2 6c-.8 1.5-1.8 2.5-3 2.5s-1.5-.8-3-.8-1.8.8-3 .8-2.5-1.5-3.5-3.5S3 13 4 11s2.5-2 4-2z"/></g>,
    instagram: <g><rect x="3" y="3" width="18" height="18" rx="5" {...p}/><circle cx="12" cy="12" r="4" {...p}/><circle cx="17" cy="7" r="1" fill={color}/></g>,
    youtube: <g><rect x="2" y="5" width="20" height="14" rx="3" {...p}/><path {...p} d="M10 9l5 3-5 3V9z"/></g>,
    download: <g><path {...p} d="M12 4v12M6 10l6 6 6-6"/><path {...p} d="M4 20h16"/></g>,
    receipt: <g><path {...p} d="M5 3h14v18l-3-2-3 2-3-2-3 2-2-2V3z"/><path {...p} d="M8 8h8M8 12h8M8 16h5"/></g>,
    shield: <g><path {...p} d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6l8-3z"/><path {...p} d="M9 12l2 2 4-4"/></g>,
    identification: <g><rect x="3" y="5" width="18" height="14" rx="2" {...p}/><circle cx="9" cy="12" r="2.5" {...p}/><path {...p} d="M13 10h5M13 14h4"/></g>,
    bank: <g><path {...p} d="M3 10l9-6 9 6M5 10v9M9 10v9M15 10v9M19 10v9M3 21h18M3 10h18"/></g>,
    route: <g><circle cx="6" cy="6" r="2.5" {...p}/><circle cx="18" cy="18" r="2.5" {...p}/><path {...p} d="M8.5 6H15a3 3 0 0 1 3 3v2M15.5 18H9a3 3 0 0 1-3-3v-2" strokeDasharray="2 2"/></g>,
  };
  return <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'block', flexShrink: 0 }}>{paths[name]}</svg>;
};

// ──────────────────────────────────────────────────────────────────────────────
// Button — coral primary, ghost, outline, text. Only primary uses coral (SRS C-17#1)
// ──────────────────────────────────────────────────────────────────────────────
const Btn = ({ children, variant = 'primary', size = 'md', full, icon, iconRight, tk, onClick, disabled }) => {
  const { t, typ, radius } = tk;
  const sizes = {
    sm: { h: 32, px: 12, fs: 13 },
    md: { h: 44, px: 16, fs: 14 },
    lg: { h: 52, px: 20, fs: 15 },
  };
  const s = sizes[size];
  const variants = {
    primary: { bg: t.primary, fg: '#fff', bd: 'transparent', hover: t.primaryDeep },
    dark:    { bg: t.ink, fg: t.surface, bd: 'transparent', hover: t.inkSoft },
    outline: { bg: 'transparent', fg: t.ink, bd: t.hairlineStrong, hover: t.surfaceAlt },
    ghost:   { bg: t.surfaceAlt, fg: t.ink, bd: 'transparent', hover: t.surfaceSunk },
    text:    { bg: 'transparent', fg: t.primary, bd: 'transparent', hover: 'transparent' },
    danger:  { bg: t.danger, fg: '#fff', bd: 'transparent', hover: t.danger },
  };
  const v = variants[variant];
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: s.h, padding: `0 ${s.px}px`, width: full ? '100%' : 'auto',
        borderRadius: radius.md, background: v.bg, color: v.fg,
        border: `1px solid ${v.bd}`,
        fontFamily: typ.body, fontSize: s.fs, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.5 : 1,
        letterSpacing: '-0.005em',
        transition: 'background 120ms',
      }}
    >
      {icon && <Icon name={icon} size={s.fs + 3} color={v.fg}/>}
      {children}
      {iconRight && <Icon name={iconRight} size={s.fs + 3} color={v.fg}/>}
    </button>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Tag / Pill — semantic tones only (default + 4 semantic states)
// ──────────────────────────────────────────────────────────────────────────────
const Tag = ({ children, tone = 'default', icon, tk, subtle }) => {
  const { t, typ } = tk;
  const tones = {
    default: { bg: t.surfaceAlt, fg: t.inkSoft, bd: t.hairline },
    solid:   { bg: t.ink, fg: t.surface, bd: 'transparent' },
    outline: { bg: 'transparent', fg: t.inkSoft, bd: t.hairlineStrong },
    coral:   { bg: t.primaryTint, fg: t.primaryDeep, bd: 'transparent' }, // status pill only
    success: { bg: 'rgba(29,158,117,0.1)', fg: t.success, bd: 'transparent' },
    warning: { bg: 'rgba(186,117,23,0.12)', fg: t.warning, bd: 'transparent' },
    danger:  { bg: 'rgba(194,54,47,0.1)', fg: t.danger, bd: 'transparent' },
    info:    { bg: 'rgba(24,95,165,0.1)', fg: t.info, bd: 'transparent' },
  };
  const s = tones[tone];
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: subtle ? '2px 8px' : '4px 9px',
      borderRadius: 999, background: s.bg, color: s.fg,
      border: `1px solid ${s.bd}`,
      fontFamily: typ.body, fontSize: 11, fontWeight: 600,
      letterSpacing: '0.02em', lineHeight: 1, whiteSpace: 'nowrap',
    }}>
      {icon && <Icon name={icon} size={11} color={s.fg}/>}
      {children}
    </span>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Input / Field — whitish surface, hairline border, coral focus
// ──────────────────────────────────────────────────────────────────────────────
const Field = ({ label, hint, error, success, children, tk, inline, required }) => {
  const { t, typ } = tk;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <label style={{
            fontFamily: typ.body, fontSize: 12, fontWeight: 600, color: t.ink,
            letterSpacing: '0.01em',
          }}>
            {label}{required && <span style={{ color: t.primary }}> *</span>}
          </label>
          {inline && <span style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted }}>{inline}</span>}
        </div>
      )}
      {children}
      {error && <div style={{ fontFamily: typ.body, fontSize: 11, color: t.danger, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="warning" size={11} color={t.danger}/>{error}</div>}
      {success && !error && <div style={{ fontFamily: typ.body, fontSize: 11, color: t.success, display: 'flex', alignItems: 'center', gap: 4 }}><Icon name="checkCircle" size={11} color={t.success}/>{success}</div>}
      {hint && !error && !success && <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted }}>{hint}</div>}
    </div>
  );
};

const Input = ({ placeholder, value, icon, suffix, tk, state = 'default', onChange, type = 'text', ...rest }) => {
  const { t, typ, radius } = tk;
  const borders = {
    default: t.hairlineStrong,
    focus: t.ink,
    valid: t.success,
    invalid: t.danger,
  };
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '0 12px', height: 44,
      background: t.surface,
      border: `1px solid ${borders[state]}`,
      borderRadius: radius.md,
      fontFamily: typ.body,
    }}>
      {icon && <Icon name={icon} size={16} color={t.inkMuted}/>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        readOnly={!onChange}
        placeholder={placeholder}
        style={{
          border: 'none', outline: 'none', background: 'transparent',
          flex: 1, minWidth: 0,
          fontFamily: typ.body, fontSize: 14, color: t.ink,
        }}
        {...rest}
      />
      {state === 'valid' && <Icon name="checkCircle" size={16} color={t.success} weight="fill"/>}
      {state === 'invalid' && <Icon name="warning" size={16} color={t.danger}/>}
      {suffix && <span style={{ fontFamily: typ.mono, fontSize: 12, color: t.inkMuted }}>{suffix}</span>}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Card — base surface
// ──────────────────────────────────────────────────────────────────────────────
const Card = ({ children, tk, pad = 16, flat, accent, dashed, onClick, raised = true, style = {} }) => {
  const { t, radius } = tk;
  // Default elevation — soft, layered, iOS/Linear-ish.
  const elevation = raised && !flat && !dashed
    ? '0 1px 2px rgba(16,24,40,0.05), 0 1px 4px rgba(16,24,40,0.04), 0 4px 12px rgba(16,24,40,0.04)'
    : 'none';
  return (
    <div onClick={onClick} style={{
      background: flat ? t.bg : t.surface,
      border: dashed ? `1px dashed ${t.hairlineStrong}` : `1px solid ${t.hairline}`,
      borderLeft: accent ? `3px solid ${accent}` : undefined,
      borderRadius: radius.lg,
      padding: pad,
      cursor: onClick ? 'pointer' : 'default',
      boxShadow: elevation,
      ...style,
    }}>{children}</div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Avatar — initial-based, optional image slot
// ──────────────────────────────────────────────────────────────────────────────
const Avatar = ({ name = 'A', color, size = 36, ring, tk }) => {
  const { t, typ } = tk;
  return (
    <div style={{
      width: size, height: size, borderRadius: 999, flexShrink: 0,
      background: color || t.surfaceAlt,
      color: color ? '#fff' : t.ink,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: typ.body, fontSize: size * 0.4, fontWeight: 600,
      border: ring ? `2px solid ${ring}` : `1px solid ${t.hairline}`,
      boxShadow: ring ? `0 0 0 2px ${t.surface}` : 'none',
      textTransform: 'uppercase',
    }}>{name.charAt(0)}</div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Image placeholder — abstract gradient blocks, no illustrative fakery
// ──────────────────────────────────────────────────────────────────────────────
const Photo = ({ w = '100%', h = 160, label, r = 12, tk, tone = 'warm', children, overlay }) => {
  const { typ } = tk;
  // Abstract gradients tagged to content type, not illustrative
  const gradients = {
    warm:    'linear-gradient(135deg, #D4A574 0%, #A6683E 100%)',
    cool:    'linear-gradient(135deg, #7A96B8 0%, #3D5B7E 100%)',
    forest:  'linear-gradient(135deg, #7A9B7E 0%, #3D5B3E 100%)',
    dusk:    'linear-gradient(160deg, #C47A5E 0%, #7D3E4E 60%, #3D2E4E 100%)',
    sand:    'linear-gradient(135deg, #E0C896 0%, #B8946E 100%)',
    stone:   'linear-gradient(135deg, #A6A099 0%, #5E5A53 100%)',
    mist:    'linear-gradient(160deg, #B8C4CC 0%, #7A8A96 100%)',
    coast:   'linear-gradient(160deg, #7EB0B8 0%, #3D6A7E 100%)',
    pine:    'linear-gradient(160deg, #5E8A6E 0%, #2E4A3E 100%)',
    ember:   'linear-gradient(160deg, #D47E5A 0%, #A04E3E 60%, #5E2E3E 100%)',
    night:   'linear-gradient(160deg, #2E3B4E 0%, #1A2230 100%)',
    paper:   'linear-gradient(135deg, #EDE9E1 0%, #C8C3B8 100%)',
  };
  return (
    <div style={{
      width: w, height: h, borderRadius: r, overflow: 'hidden',
      background: gradients[tone] || gradients.warm,
      position: 'relative',
      display: 'flex', flexDirection: 'column', justifyContent: 'flex-end',
      padding: 12, boxSizing: 'border-box',
    }}>
      {/* subtle grain */}
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none',
        background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.18), transparent 60%)',
      }}/>
      {overlay}
      {label && (
        <div style={{
          position: 'relative', fontFamily: typ.mono, fontSize: 9,
          color: 'rgba(255,255,255,0.8)', letterSpacing: '0.1em', textTransform: 'uppercase',
        }}>{label}</div>
      )}
      {children}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Progress primitives — rings, bars, step indicators
// ──────────────────────────────────────────────────────────────────────────────
const Ring = ({ pct = 40, size = 44, stroke = 3, color, trackColor, children }) => {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} stroke={trackColor} strokeWidth={stroke} fill="none"/>
        <circle cx={size/2} cy={size/2} r={r} stroke={color} strokeWidth={stroke} fill="none"
          strokeDasharray={c} strokeDashoffset={c - (c * pct) / 100} strokeLinecap="round"/>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{children}</div>
    </div>
  );
};

const Bar = ({ pct = 50, tk, color, track }) => {
  const { t } = tk;
  return (
    <div style={{
      height: 4, background: track || t.surfaceAlt, borderRadius: 999, overflow: 'hidden',
    }}>
      <div style={{ width: `${pct}%`, height: '100%', background: color || t.primary, borderRadius: 999 }}/>
    </div>
  );
};

const Steps = ({ current = 1, total = 5, tk }) => {
  const { t } = tk;
  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
      {Array.from({ length: total }, (_, i) => (
        <div key={i} style={{
          flex: 1, height: 3, borderRadius: 999,
          background: i < current ? t.ink : t.surfaceAlt,
        }}/>
      ))}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Phone device wrapper — iOS-style, status bar + dynamic island + home indicator
// ──────────────────────────────────────────────────────────────────────────────
const Phone = ({ children, w = 360, h = 780, tk, label, sublabel, dark = false, statusTime = '9:41', bg }) => {
  const { t, typ } = tk;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
      {label && (
        <div style={{ padding: '0 4px' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, fontWeight: 600, color: t.inkMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
          {sublabel && <div style={{ fontFamily: typ.body, fontSize: 13, color: t.ink, marginTop: 2 }}>{sublabel}</div>}
        </div>
      )}
      <div style={{
        width: w, height: h, borderRadius: 44, overflow: 'hidden',
        background: dark ? '#000' : (bg || t.bg),
        boxShadow: '0 24px 60px rgba(18,18,22,0.14), 0 0 0 1px rgba(0,0,0,0.08), inset 0 0 0 5px #0a0a0c',
        position: 'relative', flexShrink: 0,
      }}>
        {/* dynamic island */}
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          width: 108, height: 32, borderRadius: 20, background: '#000', zIndex: 50,
        }}/>
        {/* status bar */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, height: 48,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 26px 0', zIndex: 40, pointerEvents: 'none',
        }}>
          <span style={{ fontFamily: '-apple-system, "SF Pro Text"', fontWeight: 600, fontSize: 15, color: dark ? '#fff' : t.ink }}>{statusTime}</span>
          <div style={{ display: 'flex', gap: 5, alignItems: 'center' }}>
            <svg width="17" height="11" viewBox="0 0 17 11" fill={dark ? '#fff' : t.ink}><path d="M1 8h2v3H1zM5 6h2v5H5zM9 3h2v8H9zM13 0h2v11h-2z"/></svg>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke={dark ? '#fff' : t.ink} strokeWidth="1"><path d="M7.5.5C4.4.5 1.7 1.5 0 3m7.5-2.5C10.6.5 13.3 1.5 15 3M2 5c1.5-1.2 3.4-2 5.5-2s4 .8 5.5 2M4 7c1-.8 2.2-1 3.5-1s2.5.2 3.5 1"/><circle cx="7.5" cy="9" r="1.2" fill={dark ? '#fff' : t.ink}/></svg>
            <div style={{
              width: 24, height: 11, borderRadius: 3,
              border: `1px solid ${dark ? '#fff' : t.ink}`, opacity: 0.85,
              display: 'flex', alignItems: 'center', padding: 1,
            }}>
              <div style={{ height: '100%', width: '82%', background: dark ? '#fff' : t.ink, borderRadius: 1 }}/>
            </div>
          </div>
        </div>
        {/* home indicator */}
        <div style={{
          position: 'absolute', bottom: 8, left: '50%', transform: 'translateX(-50%)',
          width: 120, height: 4, borderRadius: 999, background: dark ? 'rgba(255,255,255,0.7)' : 'rgba(0,0,0,0.28)',
          zIndex: 60, pointerEvents: 'none',
        }}/>
        <div style={{ height: '100%', overflow: 'hidden', position: 'relative' }}>{children}</div>
      </div>
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Frame — a labelled non-device rectangle (for sheets, web screens, etc.)
// ──────────────────────────────────────────────────────────────────────────────
const Frame = ({ children, w = 360, h = 'auto', tk, label, sublabel, pad = 0 }) => {
  const { t, typ } = tk;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 10 }}>
      {label && (
        <div style={{ padding: '0 4px' }}>
          <div style={{ fontFamily: typ.mono, fontSize: 10, fontWeight: 600, color: t.inkMuted, letterSpacing: '0.08em', textTransform: 'uppercase' }}>{label}</div>
          {sublabel && <div style={{ fontFamily: typ.body, fontSize: 13, color: t.ink, marginTop: 2 }}>{sublabel}</div>}
        </div>
      )}
      <div style={{
        width: w, height: h,
        background: t.bg,
        borderRadius: 16, overflow: 'hidden',
        boxShadow: '0 12px 40px rgba(18,18,22,0.08), 0 0 0 1px rgba(0,0,0,0.06)',
        padding: pad, position: 'relative', flexShrink: 0,
      }}>{children}</div>
    </div>
  );
};

Object.assign(window, {
  Icon, Btn, Tag, Field, Input, Card, Avatar, Photo, Ring, Bar, Steps, Phone, Frame,
});
