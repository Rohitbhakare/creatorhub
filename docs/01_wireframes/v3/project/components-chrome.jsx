// CreatorHub chrome — app header, bottom nav, sheet, section label, screen label

// ──────────────────────────────────────────────────────────────────────────────
// AppHeader — status bar offset included, coral wordmark, optional trailing icons
// Variants: wordmark (home), title (subpage), transparent (over photo)
// ──────────────────────────────────────────────────────────────────────────────
const AppHeader = ({
  variant = 'title', title, back, actions, tk, onBack,
  subtitle, wordmark, transparent, light,
}) => {
  const { t, typ } = tk;
  const fg = light ? '#fff' : t.ink;
  const fgMuted = light ? 'rgba(255,255,255,0.7)' : t.inkMuted;
  return (
    <div style={{
      padding: '52px 16px 12px', // 48px status bar + 4px
      background: transparent ? 'transparent' : t.surface,
      borderBottom: transparent ? 'none' : `1px solid ${t.hairline}`,
      display: 'flex', alignItems: 'center', gap: 12,
      position: 'relative', zIndex: 5,
    }}>
      {back && (
        <button onClick={onBack} style={{
          width: 36, height: 36, borderRadius: 999, flexShrink: 0,
          border: 'none', background: transparent ? 'rgba(255,255,255,0.85)' : t.surfaceAlt,
          display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
        }}>
          <Icon name="caretLeft" size={18} color={transparent ? '#16161A' : t.ink}/>
        </button>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        {wordmark && (
          <div style={{
            fontFamily: typ.display, fontSize: 24, lineHeight: 1, fontWeight: typ.displayWeight,
            letterSpacing: typ.displayTrack, color: fg,
          }}>
            CreatorHub<span style={{ color: t.primary }}>.</span>
          </div>
        )}
        {title && !wordmark && (
          <>
            <div style={{
              fontFamily: typ.body, fontSize: 16, fontWeight: 600, color: fg,
              whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              letterSpacing: '-0.01em',
            }}>{title}</div>
            {subtitle && (
              <div style={{
                fontFamily: typ.mono, fontSize: 10, color: fgMuted, marginTop: 2,
                letterSpacing: '0.05em', textTransform: 'uppercase',
              }}>{subtitle}</div>
            )}
          </>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>{actions}</div>}
    </div>
  );
};

// HeaderIcon — 36px circular icon button
const HeaderIcon = ({ icon, tk, light, onClick, badge }) => {
  const { t } = tk;
  return (
    <button onClick={onClick} style={{
      width: 36, height: 36, borderRadius: 999,
      border: 'none', background: light ? 'rgba(255,255,255,0.85)' : t.surfaceAlt,
      display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
      position: 'relative',
    }}>
      <Icon name={icon} size={18} color={light ? '#16161A' : t.ink}/>
      {badge && (
        <span style={{
          position: 'absolute', top: 5, right: 5, width: 8, height: 8, borderRadius: 999,
          background: t.primary, border: '2px solid #fff',
        }}/>
      )}
    </button>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// BottomNav — 5 tabs, coral active; center "+" is elevated
// SRS IA-FR-001: Home / Discover / Create / Studio / You
// ──────────────────────────────────────────────────────────────────────────────
const BottomNav = ({ active = 'home', tk, hasStudio = true, badge }) => {
  const { t, typ } = tk;
  const items = [
    { key: 'home', label: 'Home', icon: 'house' },
    { key: 'discover', label: 'Discover', icon: 'compass' },
    { key: 'create', label: 'Create', icon: 'plusCircle', center: true },
    { key: 'studio', label: 'Studio', icon: 'sliders', hidden: !hasStudio },
    { key: 'you', label: 'You', icon: 'user' },
  ].filter(x => !x.hidden);

  return (
    <div style={{
      position: 'absolute', bottom: 0, left: 0, right: 0,
      paddingBottom: 24, paddingTop: 8,
      background: t.surface,
      borderTop: `1px solid ${t.hairline}`,
      boxShadow: '0 -8px 24px rgba(16,24,40,0.06), 0 -1px 2px rgba(16,24,40,0.03)',
      display: 'flex', justifyContent: 'space-around', alignItems: 'flex-end',
      zIndex: 30,
    }}>
      {items.map(item => {
        const isActive = item.key === active;
        if (item.center) {
          return (
            <button key={item.key} style={{
              width: 52, height: 52, borderRadius: 18,
              background: t.primary, border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 2,
              boxShadow: `0 2px 4px rgba(16,24,40,0.08), 0 8px 20px ${t.primary}55`,
            }}>
              <Icon name="plus" size={24} color="#fff" weight="bold"/>
            </button>
          );
        }
        return (
          <button key={item.key} style={{
            flex: 1, border: 'none', background: 'transparent', cursor: 'pointer',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2,
            padding: '6px 0 2px', position: 'relative',
          }}>
            <div style={{
              width: 44, height: 26, borderRadius: 999,
              background: isActive ? t.primaryTint : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'background 120ms ease',
            }}>
              <Icon name={item.icon} size={20} color={isActive ? t.primary : t.inkMuted} weight={isActive ? 'fill' : 'regular'}/>
            </div>
            <span style={{
              fontFamily: typ.body, fontSize: 10, fontWeight: isActive ? 600 : 500,
              color: isActive ? t.primary : t.inkMuted, letterSpacing: '-0.005em', marginTop: 2,
            }}>{item.label}</span>
            {badge === item.key && (
              <span style={{
                position: 'absolute', top: 4, right: '30%', width: 7, height: 7, borderRadius: 999,
                background: t.primary, border: `1.5px solid ${t.surface}`,
              }}/>
            )}
          </button>
        );
      })}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Sheet — bottom sheet over content. Used for auth wall, save, filter, etc.
// ──────────────────────────────────────────────────────────────────────────────
const Sheet = ({ children, tk, height = 'auto', pad = 20, title, onClose, scrim = true }) => {
  const { t, typ, radius } = tk;
  return (
    <>
      {scrim && (
        <div style={{
          position: 'absolute', inset: 0, background: 'rgba(22,22,26,0.48)',
          zIndex: 80,
        }}/>
      )}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0,
        background: t.surface,
        borderTopLeftRadius: 22, borderTopRightRadius: 22,
        padding: `12px ${pad}px 28px`,
        zIndex: 90,
        maxHeight: '85%',
        boxShadow: '0 -10px 40px rgba(0,0,0,0.12)',
        display: 'flex', flexDirection: 'column',
      }}>
        <div style={{
          width: 40, height: 4, borderRadius: 999, background: t.hairlineStrong,
          margin: '0 auto 12px',
        }}/>
        {title && (
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 16,
          }}>
            <div style={{ fontFamily: typ.display, fontSize: 22, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>{title}</div>
            {onClose && (
              <button onClick={onClose} style={{
                width: 32, height: 32, borderRadius: 999, border: 'none',
                background: t.surfaceAlt, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Icon name="x" size={16} color={t.ink}/>
              </button>
            )}
          </div>
        )}
        <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
      </div>
    </>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// ScreenLabel — caption above each phone frame. Two kinds:
//   SectionLabel — large divider between packs
//   ScreenCaption — small two-line below frame (id + title)
// ──────────────────────────────────────────────────────────────────────────────
const SectionLabel = ({ pack, title, subtitle, srs, tk }) => {
  const { t, typ } = tk;
  return (
    <div style={{
      gridColumn: '1 / -1',
      padding: '32px 60px 18px',
      borderTop: `1px solid ${t.hairline}`,
      display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 40,
      flexWrap: 'wrap',
    }}>
      <div style={{ flex: 1, minWidth: 320 }}>
        <div style={{
          fontFamily: typ.mono, fontSize: 11, fontWeight: 600, color: t.primary,
          letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 10,
        }}>{pack}</div>
        <h2 style={{
          margin: 0, fontFamily: typ.display, fontWeight: typ.displayWeight,
          fontSize: 44, lineHeight: 1, color: t.ink, letterSpacing: typ.displayTrack,
        }}>{title}</h2>
        {subtitle && <p style={{
          margin: '10px 0 0', fontFamily: typ.body, fontSize: 15, lineHeight: 1.5,
          color: t.inkSoft, maxWidth: 640,
        }}>{subtitle}</p>}
      </div>
      {srs && (
        <div style={{
          fontFamily: typ.mono, fontSize: 10, color: t.inkMuted,
          background: t.surface, border: `1px solid ${t.hairline}`,
          padding: '8px 12px', borderRadius: 6,
          letterSpacing: '0.04em',
        }}>
          SRS · {srs}
        </div>
      )}
    </div>
  );
};

// ──────────────────────────────────────────────────────────────────────────────
// Row — generic list row used everywhere
// ──────────────────────────────────────────────────────────────────────────────
const Row = ({ leading, title, subtitle, trailing, onClick, tk, pad = '12px 0', divider = true }) => {
  const { t, typ } = tk;
  return (
    <div onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: pad,
      borderBottom: divider ? `1px solid ${t.hairline}` : 'none',
      cursor: onClick ? 'pointer' : 'default',
    }}>
      {leading && <div style={{ flexShrink: 0 }}>{leading}</div>}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 500, color: t.ink, letterSpacing: '-0.005em' }}>{title}</div>
        {subtitle && <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted, marginTop: 2 }}>{subtitle}</div>}
      </div>
      {trailing && <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6 }}>{trailing}</div>}
    </div>
  );
};

// Segmented control — iOS style, used in filter / tabs
const Segmented = ({ options, value, onChange, tk, full }) => {
  const { t, typ } = tk;
  return (
    <div style={{
      display: 'inline-flex', padding: 3, borderRadius: 10,
      background: t.surfaceAlt, width: full ? '100%' : 'auto',
    }}>
      {options.map(o => {
        const active = o.value === value;
        return (
          <button key={o.value} onClick={() => onChange && onChange(o.value)} style={{
            flex: full ? 1 : 'initial', padding: '7px 14px', borderRadius: 8, border: 'none',
            background: active ? t.surface : 'transparent',
            color: active ? t.ink : t.inkMuted,
            fontFamily: typ.body, fontSize: 12, fontWeight: 600, cursor: 'pointer',
            boxShadow: active ? '0 1px 2px rgba(0,0,0,0.06)' : 'none',
            letterSpacing: '-0.005em',
          }}>{o.label}</button>
        );
      })}
    </div>
  );
};

// Toggle
const Toggle = ({ on, tk }) => {
  const { t } = tk;
  return (
    <div style={{
      width: 40, height: 24, borderRadius: 999, background: on ? t.ink : t.surfaceSunk,
      padding: 2, transition: 'background 120ms', flexShrink: 0,
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: 999, background: t.surface,
        transform: on ? 'translateX(16px)' : 'translateX(0)',
        transition: 'transform 120ms',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
      }}/>
    </div>
  );
};

// Stepper dots / step ribbon — labelled progress
const StepRibbon = ({ steps, current = 1, tk }) => {
  const { t, typ } = tk;
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 0, padding: '0 16px',
      fontFamily: typ.body,
    }}>
      {steps.map((s, i) => {
        const done = i + 1 < current;
        const active = i + 1 === current;
        const fg = active ? t.ink : done ? t.inkSoft : t.inkFaint;
        return (
          <React.Fragment key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 22, height: 22, borderRadius: 999,
                background: done ? t.ink : active ? t.surface : t.surfaceAlt,
                border: active ? `1.5px solid ${t.ink}` : 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 600, color: done ? t.surface : fg,
                flexShrink: 0,
              }}>{done ? <Icon name="check" size={12} color={t.surface}/> : i + 1}</div>
              <span style={{ fontSize: 12, fontWeight: active ? 600 : 500, color: fg, whiteSpace: 'nowrap' }}>{s}</span>
            </div>
            {i < steps.length - 1 && (
              <div style={{ flex: 1, height: 1, background: t.hairline, margin: '0 10px' }}/>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// Empty state
const Empty = ({ icon, title, body, cta, tk }) => {
  const { t, typ } = tk;
  return (
    <div style={{
      padding: '32px 20px', textAlign: 'center',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
    }}>
      <div style={{
        width: 52, height: 52, borderRadius: 999, background: t.surfaceAlt,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon name={icon} size={24} color={t.inkMuted}/>
      </div>
      <div style={{ fontFamily: typ.display, fontSize: 20, fontWeight: typ.displayWeight, color: t.ink, letterSpacing: typ.displayTrack }}>{title}</div>
      <div style={{ fontFamily: typ.body, fontSize: 13, color: t.inkMuted, maxWidth: 280, lineHeight: 1.5 }}>{body}</div>
      {cta}
    </div>
  );
};

Object.assign(window, {
  AppHeader, HeaderIcon, BottomNav, Sheet, SectionLabel, Row, Segmented, Toggle, StepRibbon, Empty,
});
