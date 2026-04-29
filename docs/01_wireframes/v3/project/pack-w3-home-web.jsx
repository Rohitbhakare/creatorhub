/* CreatorHub — Web Home Feed v2 (single-column, no side nav, magazine + interactive)
 * Storytelling + light gamification baked in. Coral is the only decorative accent. */

const W3_PHOTOS = {
  konkan: 'radial-gradient(ellipse at 25% 75%, rgba(0,30,60,0.32) 0%, transparent 45%), radial-gradient(ellipse at 70% 30%, rgba(255,180,90,0.35) 0%, transparent 55%), linear-gradient(180deg, #6e8aa0 0%, #b89a76 35%, #6e6452 65%, #2c2823 100%)',
  spiti: 'radial-gradient(ellipse at 50% 100%, rgba(80,40,20,0.55) 0%, transparent 60%), radial-gradient(ellipse at 30% 30%, rgba(255,200,140,0.45) 0%, transparent 50%), linear-gradient(180deg, #5b89c3 0%, #87a8c8 35%, #d8c4a6 60%, #b89a76 80%, #4a3a30 100%)',
  bhandar: 'radial-gradient(ellipse at 25% 75%, rgba(0,40,30,0.55) 0%, transparent 55%), radial-gradient(ellipse at 70% 25%, rgba(180,140,90,0.40) 0%, transparent 55%), linear-gradient(180deg, #4a6080 0%, #6e8a76 35%, #4a6048 60%, #2a3a30 100%)',
  velas: 'radial-gradient(ellipse at 50% 70%, rgba(80,60,40,0.55) 0%, transparent 60%), radial-gradient(ellipse at 50% 30%, rgba(255,200,140,0.45) 0%, transparent 60%), linear-gradient(180deg, #4a3024 0%, #8a6845 30%, #d8c4a6 60%, #b89a76 100%)',
  thane: 'radial-gradient(ellipse at 30% 50%, rgba(255,200,80,0.55) 0%, transparent 50%), radial-gradient(ellipse at 70% 70%, rgba(180,80,40,0.55) 0%, transparent 50%), linear-gradient(180deg, #6e4424 0%, #c8784a 30%, #d8a04a 60%, #8a5824 100%)',
  matheran: 'radial-gradient(ellipse at 30% 80%, rgba(40,60,40,0.55) 0%, transparent 55%), radial-gradient(ellipse at 70% 20%, rgba(220,200,160,0.45) 0%, transparent 50%), linear-gradient(180deg, #6a7a6a 0%, #8a9a82 30%, #4a6048 60%, #2a3828 100%)',
  bandra: 'radial-gradient(ellipse at 40% 80%, rgba(0,30,60,0.50) 0%, transparent 50%), radial-gradient(ellipse at 70% 25%, rgba(255,140,80,0.55) 0%, transparent 55%), linear-gradient(180deg, #6a4a60 0%, #b86850 35%, #d8a06a 60%, #6a4a4a 100%)',
  fishing: 'radial-gradient(ellipse at 50% 100%, rgba(0,30,60,0.55) 0%, transparent 55%), radial-gradient(ellipse at 30% 25%, rgba(220,140,80,0.45) 0%, transparent 55%), linear-gradient(180deg, #6e8aa0 0%, #4a6f55 40%, #2c4a3a 70%, #1a2820 100%)',
  ladakh: 'radial-gradient(ellipse at 50% 30%, rgba(180,210,255,0.40) 0%, transparent 55%), radial-gradient(ellipse at 25% 80%, rgba(180,90,50,0.50) 0%, transparent 55%), linear-gradient(180deg, #6a8db0 0%, #c8a890 40%, #8a6a52 70%, #3a2820 100%)',
  goa: 'radial-gradient(ellipse at 70% 70%, rgba(255,180,120,0.55) 0%, transparent 55%), radial-gradient(ellipse at 25% 30%, rgba(120,180,200,0.45) 0%, transparent 50%), linear-gradient(180deg, #5e90b0 0%, #c8a890 50%, #d8b890 80%, #6a4a30 100%)',
};

const W3_MOODS = [
  { id: 'slow', label: 'Slow & quiet', emoji: '🌿', desc: 'Single villages, no rush, monsoons' },
  { id: 'high', label: 'High octane', emoji: '⚡', desc: 'Bike rides, treks, long hauls' },
  { id: 'food', label: 'Foodie', emoji: '🥘', desc: 'Walks, kitchens, hidden mess halls' },
  { id: 'sunrise', label: 'Sunrise people', emoji: '🌅', desc: '4am starts, golden hour, fewer crowds' },
  { id: 'art', label: 'Art & craft', emoji: '🎨', desc: 'Studios, weavers, ateliers, residencies' },
];

function S_WebHome({ tk }) {
  const { t, typ, radius } = tk;

  // ── Local state ──────────────────────────────────────────────
  const [mood, setMood] = React.useState('slow');
  const [savedSet, setSavedSet] = React.useState(new Set(['matheran']));
  const [chapter, setChapter] = React.useState(0);
  const [quest, setQuest] = React.useState({ xp: 1280, level: 4, streak: 7 });
  const [notifOpen, setNotifOpen] = React.useState(false);
  const [tilt, setTilt] = React.useState({ x: 0, y: 0 });

  const toggleSave = (k) => {
    setSavedSet(s => {
      const n = new Set(s);
      if (n.has(k)) n.delete(k); else { n.add(k); setQuest(q => ({ ...q, xp: q.xp + 5 })); }
      return n;
    });
  };

  // ── Hero chapter rotator (storytelling) ──────────────────────
  const heroStory = {
    title: 'Konkan in 4 Quiet Days',
    creator: 'Aanya Ravi',
    avatar: 'AR',
    location: 'Ratnagiri → Velas → Guhagar',
    hero: 'konkan',
    chapters: [
      { n: 1, title: 'Leaving the highway', sub: 'Day 1 · 90 km · Mumbai → Ratnagiri', body: 'You leave NH-66 just past Chiplun. The road narrows. The air shifts to salt and jackfruit.' },
      { n: 2, title: 'Velas at first light', sub: 'Day 2 · 14 km · Olive ridley turtle hatching', body: 'A 5:30am call. Sand still cool. Volunteers form a quiet aisle as 47 turtles find the sea.' },
      { n: 3, title: 'A homestay kitchen', sub: 'Day 3 · 0 km · Aji\'s kuli ambat', body: 'No menu. A jaali plate of solkadhi, three fishes, hot rice. You eat until you cannot.' },
      { n: 4, title: 'The cliff at Guhagar', sub: 'Day 4 · 38 km · The way back', body: 'Sunset 6:42. Ten minutes of orange. Then the slow, salt-soaked drive home.' },
    ],
  };
  const ch = heroStory.chapters[chapter];

  // ── Helpers ──────────────────────────────────────────────────
  const Photo = ({ k, h, children, style }) => (
    <div style={{
      position: 'relative', height: h, borderRadius: radius.lg,
      background: W3_PHOTOS[k] || '#888',
      overflow: 'hidden',
      ...style,
    }}>{children}</div>
  );

  const Pill = ({ children, kind = 'ink' }) => {
    const bg = kind === 'coral' ? t.primary : kind === 'glass' ? 'rgba(255,255,255,0.92)' : 'rgba(20,20,24,0.78)';
    const fg = kind === 'glass' ? t.ink : '#fff';
    return <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 9px', borderRadius: 999, background: bg, color: fg,
      fontFamily: typ.body, fontSize: 10, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    }}>{children}</span>;
  };

  const Bookmark = ({ k }) => {
    const saved = savedSet.has(k);
    return (
      <button onClick={() => toggleSave(k)} style={{
        position: 'absolute', top: 12, right: 12, width: 34, height: 34, borderRadius: 999,
        background: saved ? t.primary : 'rgba(255,255,255,0.92)',
        border: 0, cursor: 'pointer', display: 'grid', placeItems: 'center',
        backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)',
        transition: 'transform 0.18s cubic-bezier(.5,1.6,.5,1), background 0.18s',
        boxShadow: saved ? '0 6px 20px rgba(225,90,65,0.45)' : '0 2px 8px rgba(0,0,0,0.15)',
        transform: saved ? 'scale(1.06)' : 'scale(1)',
      }}>
        <svg width="14" height="14" viewBox="0 0 24 24" fill={saved ? '#fff' : 'none'} stroke={saved ? '#fff' : t.ink} strokeWidth="2">
          <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
        </svg>
      </button>
    );
  };

  const Avatar = ({ initials, size = 28, gradient = 'linear-gradient(135deg, #d4b896, #a07c5a)' }) => (
    <div style={{
      width: size, height: size, borderRadius: 999, background: gradient, color: '#fff',
      display: 'grid', placeItems: 'center', fontFamily: typ.display, fontWeight: 600, fontSize: size * 0.4,
      flex: '0 0 auto',
    }}>{initials}</div>
  );

  // ── Magazine top header ──────────────────────────────────────
  const Header = (
    <header style={{
      position: 'sticky', top: 0, zIndex: 50,
      background: 'rgba(255,255,255,0.82)', backdropFilter: 'saturate(180%) blur(20px)',
      WebkitBackdropFilter: 'saturate(180%) blur(20px)',
      borderBottom: `1px solid ${t.hairline}`,
    }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', padding: '0 32px', height: 72, display: 'flex', alignItems: 'center', gap: 28 }}>
        {/* Brand */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: '0 0 auto' }}>
          <div style={{ width: 8, height: 8, borderRadius: 999, background: t.primary }}/>
          <div style={{ fontFamily: typ.display, fontWeight: 600, fontSize: 22, letterSpacing: '-0.03em', color: t.ink, lineHeight: 1 }}>
            creator<em style={{ fontStyle: 'italic', color: t.primary }}>hub</em>
          </div>
        </div>

        {/* Center search */}
        <div style={{
          flex: '1 1 420px', maxWidth: 520, height: 42,
          background: t.surfaceAlt, borderRadius: 999, padding: '0 18px',
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
          transition: 'background 0.15s, box-shadow 0.15s',
        }}
          onMouseEnter={e => { e.currentTarget.style.background = t.surface; e.currentTarget.style.boxShadow = `0 4px 16px ${t.hairline}, inset 0 0 0 1px ${t.hairline}`; }}
          onMouseLeave={e => { e.currentTarget.style.background = t.surfaceAlt; e.currentTarget.style.boxShadow = 'none'; }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={t.inkMuted} strokeWidth="1.8"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <span style={{ flex: 1, fontFamily: typ.body, fontSize: 13.5, color: t.inkMuted }}>
            <span style={{ color: t.ink, fontWeight: 500 }}>Try</span> "Konkan turtles in February"
          </span>
          <span style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, padding: '2px 6px', borderRadius: 4, background: t.surface, border: `1px solid ${t.hairline}`, fontWeight: 500 }}>⌘ K</span>
        </div>

        {/* Right: streak badge + notifs + create + avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 'auto', flex: '0 0 auto' }}>
          {/* Streak badge — gamification */}
          <div title={`${quest.streak}-day streak`} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 11px 6px 8px', borderRadius: 999,
            background: t.primaryTint, color: t.primaryDeep,
            fontFamily: typ.body, fontSize: 12, fontWeight: 700, letterSpacing: '-0.005em',
            border: `1px solid ${t.primary}22`,
          }}>
            <span style={{ fontSize: 14, lineHeight: 1 }}>🔥</span>
            {quest.streak}<span style={{ opacity: 0.65, fontWeight: 500 }}>d</span>
          </div>

          <button onClick={() => setNotifOpen(o => !o)} style={{
            position: 'relative', width: 40, height: 40, borderRadius: 999, border: 0,
            background: notifOpen ? t.surfaceAlt : 'transparent', cursor: 'pointer',
            display: 'grid', placeItems: 'center',
          }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth="1.8"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <span style={{
              position: 'absolute', top: 8, right: 7,
              width: 8, height: 8, borderRadius: 999, background: t.primary,
              border: `2px solid ${t.surface}`,
            }}/>
          </button>

          <button style={{
            background: t.ink, color: t.surface, border: 0,
            padding: '10px 16px 10px 14px', borderRadius: 999, cursor: 'pointer',
            fontFamily: typ.body, fontSize: 13, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
            transition: 'background 0.15s',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Publish
          </button>

          <Avatar initials="RB" size={36} gradient="linear-gradient(135deg, #d4b896, #a07c5a)"/>
        </div>
      </div>
    </header>
  );

  // ── Hero — editorial chapter showcase ────────────────────────
  const Hero = (
    <section style={{ maxWidth: 1240, margin: '32px auto 0', padding: '0 32px' }}>
      {/* Greeting + happening-now ticker */}
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 20, gap: 24 }}>
        <div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.22em', textTransform: 'uppercase', marginBottom: 8 }}>
            Tuesday · Mumbai · 28°C light rain
          </div>
          <h1 style={{
            margin: 0, fontFamily: typ.display, fontSize: 46, lineHeight: 1.02,
            color: t.ink, fontWeight: 600, letterSpacing: '-0.02em',
          }}>
            Good evening, Riya.<br/>
            <span style={{ color: t.inkMuted }}>Where to,</span> <em style={{ fontStyle: 'italic', color: t.primary }}>this weekend?</em>
          </h1>
        </div>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '8px 14px 8px 8px', borderRadius: 999, background: t.surface,
          border: `1px solid ${t.hairline}`,
          fontFamily: typ.body, fontSize: 12.5, color: t.inkSoft, flex: '0 0 auto',
        }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 999, background: '#1D9E7515', color: '#1D9E75', fontWeight: 700, fontSize: 11 }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: '#1D9E75', animation: 'w3pulse 1.5s ease-in-out infinite' }}/>
            LIVE
          </span>
          <span><strong style={{ color: t.ink }}>32 travellers</strong> reading this page now</span>
        </div>
      </div>

      {/* Hero chapter card — ⅔/⅓ split, photo left, narrative right */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 0, borderRadius: radius.xl,
        overflow: 'hidden', background: t.surface, border: `1px solid ${t.hairline}`,
        boxShadow: '0 8px 32px rgba(20,20,30,0.06), 0 1px 4px rgba(20,20,30,0.04)',
        minHeight: 460,
      }}>
        {/* Photo side */}
        <Photo k={heroStory.hero} h="100%" style={{ borderRadius: 0, position: 'relative', minHeight: 460 }}>
          {/* Top-left chapter pill */}
          <div style={{ position: 'absolute', top: 24, left: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Pill kind="coral">⭐ Story of the day</Pill>
            <div style={{ color: '#fff', fontFamily: typ.display, fontSize: 14, fontWeight: 500, letterSpacing: '0.18em', textTransform: 'uppercase', textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              Chapter 0{ch.n}/04
            </div>
          </div>

          {/* Bottom-left title */}
          <div style={{ position: 'absolute', left: 24, right: 24, bottom: 24 }}>
            <div style={{ color: 'rgba(255,255,255,0.88)', fontFamily: typ.body, fontSize: 11, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', marginBottom: 8, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
              {heroStory.location}
            </div>
            <h2 style={{
              margin: 0, color: '#fff', fontFamily: typ.display, fontSize: 44, lineHeight: 1.02,
              fontWeight: 600, letterSpacing: '-0.02em', textShadow: '0 2px 12px rgba(0,0,0,0.35)', maxWidth: '90%',
            }}>{heroStory.title}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 14 }}>
              <Avatar initials={heroStory.avatar} size={32} gradient="linear-gradient(135deg, #d4b896, #a07c5a)"/>
              <div style={{ color: '#fff', fontFamily: typ.body, fontSize: 13, fontWeight: 500, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                {heroStory.creator} <span style={{ color: 'rgba(255,255,255,0.65)' }}>· 312 saves · ★ 4.8</span>
              </div>
            </div>
          </div>

          <Bookmark k="konkan-hero"/>
        </Photo>

        {/* Narrative side */}
        <div style={{ padding: '32px 36px 32px 32px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: t.surface }}>
          <div>
            <div style={{ fontFamily: typ.mono, fontSize: 11, color: t.inkMuted, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 12 }}>{ch.sub}</div>
            <h3 style={{ margin: '0 0 14px', fontFamily: typ.display, fontSize: 30, lineHeight: 1.1, color: t.ink, fontWeight: 600, letterSpacing: '-0.015em' }}>
              {ch.title}
            </h3>
            <p style={{ margin: 0, fontFamily: typ.display, fontSize: 18, lineHeight: 1.55, color: t.inkSoft, fontStyle: 'italic', fontWeight: 400 }}>
              "{ch.body}"
            </p>

            {/* Chapter dots — clickable */}
            <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
              {heroStory.chapters.map((c, i) => (
                <button key={i} onClick={() => setChapter(i)} style={{
                  flex: 1, padding: '12px 10px 10px', border: 0, cursor: 'pointer',
                  background: i === chapter ? t.surface : t.surfaceAlt,
                  borderRadius: radius.md,
                  borderLeft: `3px solid ${i === chapter ? t.primary : 'transparent'}`,
                  textAlign: 'left', transition: 'background 0.15s, border-color 0.15s',
                }}>
                  <div style={{ fontFamily: typ.mono, fontSize: 9, color: i === chapter ? t.primary : t.inkMuted, fontWeight: 700, letterSpacing: '0.14em' }}>DAY 0{c.n}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 11.5, color: i === chapter ? t.ink : t.inkSoft, fontWeight: i === chapter ? 600 : 500, marginTop: 4, lineHeight: 1.3, height: 30, overflow: 'hidden' }}>
                    {c.title}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* CTAs */}
          <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
            <button style={{
              flex: 1, background: t.ink, color: t.surface, border: 0, padding: '14px 18px',
              borderRadius: radius.md, cursor: 'pointer', fontFamily: typ.body, fontSize: 14, fontWeight: 600,
            }}>
              Read all 4 chapters →
            </button>
            <button style={{
              background: t.surface, color: t.ink, border: `1.5px solid ${t.hairlineStrong}`, padding: '14px 18px',
              borderRadius: radius.md, cursor: 'pointer', fontFamily: typ.body, fontSize: 14, fontWeight: 600,
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
              Save
            </button>
          </div>
        </div>
      </div>
    </section>
  );

  // ── Quest strip — light gamification ─────────────────────────
  const xpToNext = 1500;
  const QuestStrip = (
    <section style={{ maxWidth: 1240, margin: '24px auto 0', padding: '0 32px' }}>
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1.4fr', gap: 12,
      }}>
        {/* Level + XP */}
        <div style={{
          padding: 20, borderRadius: radius.lg, background: t.surface,
          border: `1px solid ${t.hairline}`, position: 'relative', overflow: 'hidden',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
            <div style={{
              width: 36, height: 36, borderRadius: radius.md, background: t.primary, color: '#fff',
              display: 'grid', placeItems: 'center', fontFamily: typ.display, fontSize: 16, fontWeight: 700,
              boxShadow: '0 4px 14px rgba(225,90,65,0.4)',
            }}>L{quest.level}</div>
            <div>
              <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase' }}>Explorer</div>
              <div style={{ fontFamily: typ.body, fontSize: 13.5, color: t.ink, fontWeight: 600 }}>Trail Scout</div>
            </div>
          </div>
          <div style={{ height: 6, borderRadius: 999, background: t.surfaceAlt, overflow: 'hidden', marginBottom: 8 }}>
            <div style={{ height: '100%', width: `${(quest.xp / xpToNext) * 100}%`, background: `linear-gradient(90deg, ${t.primary}, ${t.primaryDeep})`, borderRadius: 999, transition: 'width 0.4s' }}/>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: typ.mono, fontSize: 10.5, color: t.inkMuted }}>
            <span><strong style={{ color: t.ink }}>{quest.xp}</strong> xp</span>
            <span>{xpToNext - quest.xp} to L{quest.level + 1}</span>
          </div>
        </div>

        {/* Streak */}
        <div style={{
          padding: 20, borderRadius: radius.lg, background: t.surface,
          border: `1px solid ${t.hairline}`,
        }}>
          <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>Reading streak</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 12 }}>
            <span style={{ fontFamily: typ.display, fontSize: 32, fontWeight: 600, color: t.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{quest.streak}</span>
            <span style={{ fontFamily: typ.body, fontSize: 13, color: t.inkMuted, fontWeight: 500 }}>days</span>
            <span style={{ marginLeft: 'auto', fontSize: 22 }}>🔥</span>
          </div>
          <div style={{ display: 'flex', gap: 3 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} style={{
                flex: 1, height: 6, borderRadius: 2,
                background: i < quest.streak ? t.primary : t.surfaceAlt,
                opacity: i < quest.streak ? 1 - (quest.streak - 1 - i) * 0.08 : 1,
              }}/>
            ))}
          </div>
          <div style={{ marginTop: 8, fontFamily: typ.body, fontSize: 11, color: t.inkMuted }}>Read 1 story to keep the streak alive</div>
        </div>

        {/* Saved count */}
        <div style={{
          padding: 20, borderRadius: radius.lg, background: t.surface,
          border: `1px solid ${t.hairline}`,
        }}>
          <div style={{ fontFamily: typ.mono, fontSize: 9, color: t.inkMuted, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 8 }}>Saved this month</div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 6, marginBottom: 14 }}>
            <span style={{ fontFamily: typ.display, fontSize: 32, fontWeight: 600, color: t.ink, letterSpacing: '-0.02em', lineHeight: 1 }}>{savedSet.size + 11}</span>
            <span style={{ fontFamily: typ.body, fontSize: 13, color: t.inkMuted, fontWeight: 500 }}>trips</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: -6 }}>
            {['konkan', 'spiti', 'matheran'].map((k, i) => (
              <div key={k} style={{
                width: 24, height: 24, borderRadius: 6, marginLeft: i ? -6 : 0,
                background: W3_PHOTOS[k], border: `2px solid ${t.surface}`,
              }}/>
            ))}
            <div style={{ marginLeft: 8, fontFamily: typ.body, fontSize: 11, color: t.inkMuted }}>+ 9 more</div>
          </div>
        </div>

        {/* Active quest — coral, the call to action */}
        <div style={{
          padding: 20, borderRadius: radius.lg,
          background: `linear-gradient(135deg, ${t.primary} 0%, ${t.primaryDeep} 100%)`,
          color: '#fff', position: 'relative', overflow: 'hidden',
          boxShadow: '0 8px 24px rgba(225,90,65,0.32)',
        }}>
          <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: 999, background: 'rgba(255,255,255,0.12)' }}/>
          <div style={{ position: 'absolute', top: 10, right: 16, fontSize: 36, opacity: 0.4 }}>🏆</div>
          <div style={{ position: 'relative' }}>
            <div style={{ fontFamily: typ.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>Active quest · ends in 2 days</div>
            <div style={{ fontFamily: typ.display, fontSize: 18, fontWeight: 600, lineHeight: 1.15, marginBottom: 14, maxWidth: 220 }}>
              Read 3 stories from creators you don't follow yet
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'rgba(255,255,255,0.25)', overflow: 'hidden' }}>
                <div style={{ height: '100%', width: '66%', background: '#fff', borderRadius: 999 }}/>
              </div>
              <div style={{ fontFamily: typ.mono, fontSize: 11, fontWeight: 700 }}>2 / 3</div>
            </div>
            <div style={{ marginTop: 10, fontFamily: typ.body, fontSize: 11.5, opacity: 0.85 }}>+150 XP · unlocks "Curious" badge</div>
          </div>
        </div>
      </div>
    </section>
  );

  // ── Mood selector — recolours / refilters the feed ───────────
  const Moods = (
    <section style={{ maxWidth: 1240, margin: '40px auto 0', padding: '0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18, gap: 16 }}>
        <div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Tune your feed</div>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 28, fontWeight: 600, letterSpacing: '-0.015em', color: t.ink }}>
            What kind of weekend feels right?
          </h2>
        </div>
        <div style={{ fontFamily: typ.body, fontSize: 12.5, color: t.inkMuted }}>
          Pick a mood — we'll re-rank everything below.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10 }}>
        {W3_MOODS.map(m => {
          const active = mood === m.id;
          return (
            <button key={m.id} onClick={() => setMood(m.id)} style={{
              position: 'relative', padding: '20px 16px', borderRadius: radius.lg, cursor: 'pointer',
              background: active ? t.surface : t.surface,
              border: `1.5px solid ${active ? t.primary : t.hairline}`,
              boxShadow: active ? `0 0 0 3px ${t.primaryTint}, 0 4px 14px rgba(225,90,65,0.18)` : '0 1px 3px rgba(20,20,30,0.04)',
              textAlign: 'left', transition: 'all 0.2s cubic-bezier(.5,1.6,.5,1)',
              transform: active ? 'translateY(-2px)' : 'translateY(0)',
            }}>
              <div style={{ fontSize: 26, marginBottom: 10, lineHeight: 1 }}>{m.emoji}</div>
              <div style={{ fontFamily: typ.body, fontSize: 13.5, fontWeight: 600, color: t.ink, marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontFamily: typ.body, fontSize: 11, color: t.inkMuted, lineHeight: 1.4 }}>{m.desc}</div>
              {active && (
                <div style={{
                  position: 'absolute', top: 10, right: 10, width: 18, height: 18, borderRadius: 999,
                  background: t.primary, color: '#fff', display: 'grid', placeItems: 'center',
                }}>
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </section>
  );

  // ── Bento mosaic — magazine-style asymmetric grid ────────────
  const Bento = (
    <section style={{ maxWidth: 1240, margin: '40px auto 0', padding: '0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Curated for {W3_MOODS.find(x => x.id === mood)?.label}</div>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 32, fontWeight: 600, letterSpacing: '-0.015em', color: t.ink }}>
            Stories near <em style={{ fontStyle: 'italic', color: t.primary }}>Mumbai</em>, this week
          </h2>
        </div>
        <a href="#" style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink, textDecoration: 'none', borderBottom: `1.5px solid ${t.primary}`, paddingBottom: 2 }}>
          Browse all 142 →
        </a>
      </div>

      {/* 3-row bento — large feature + 2 verticals + 3 smalls */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gridTemplateRows: 'repeat(2, 240px)', gap: 12,
      }}>
        {/* Large feature: 2 cols × 2 rows */}
        <a href="#" style={{ gridColumn: 'span 2', gridRow: 'span 2', textDecoration: 'none' }}>
          <Photo k="spiti" h="100%" style={{ position: 'relative', cursor: 'pointer', borderRadius: radius.xl }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 35%, rgba(0,0,0,0.7) 100%)' }}/>
            <div style={{ position: 'absolute', top: 18, left: 18, display: 'flex', gap: 6 }}>
              <Pill kind="coral">Featured</Pill>
              <Pill kind="glass">8 chapters</Pill>
            </div>
            <Bookmark k="spiti"/>
            <div style={{ position: 'absolute', left: 22, right: 22, bottom: 22, color: '#fff' }}>
              <div style={{ fontFamily: typ.mono, fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 8 }}>HIMACHAL · 9 DAYS · 1,240 KM</div>
              <h3 style={{ margin: 0, fontFamily: typ.display, fontSize: 32, lineHeight: 1.05, fontWeight: 600, letterSpacing: '-0.015em', textShadow: '0 2px 12px rgba(0,0,0,0.4)' }}>
                The slow road through Spiti — a rider's diary
              </h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 14 }}>
                <Avatar initials="VK" size={28} gradient="linear-gradient(135deg, #c8a677, #8a6845)"/>
                <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 500 }}>
                  Vikram K. <span style={{ opacity: 0.7 }}>· ★ 4.9 · 1,420 saves</span>
                </div>
                <div style={{ marginLeft: 'auto', padding: '5px 11px', borderRadius: 999, background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', fontFamily: typ.body, fontSize: 12, fontWeight: 600 }}>
                  ₹14,500 · book ride
                </div>
              </div>
            </div>
          </Photo>
        </a>

        {/* Tall vertical: 1 col × 2 rows */}
        <a href="#" style={{ gridRow: 'span 2', textDecoration: 'none' }}>
          <Photo k="velas" h="100%" style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.65) 100%)' }}/>
            <div style={{ position: 'absolute', top: 14, left: 14 }}><Pill kind="glass">Event · Feb–Apr only</Pill></div>
            <Bookmark k="velas"/>
            <div style={{ position: 'absolute', left: 16, right: 16, bottom: 16, color: '#fff' }}>
              <div style={{ fontFamily: typ.mono, fontSize: 9, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', opacity: 0.85, marginBottom: 6 }}>VELAS · 240 KM</div>
              <h3 style={{ margin: 0, fontFamily: typ.display, fontSize: 19, lineHeight: 1.15, fontWeight: 600, textShadow: '0 1px 6px rgba(0,0,0,0.4)' }}>
                Olive ridley turtle festival
              </h3>
              <div style={{ marginTop: 10, fontFamily: typ.body, fontSize: 11.5, opacity: 0.92 }}>2 days · 412 saved</div>
            </div>
          </Photo>
        </a>

        {/* Right column small 1 */}
        <a href="#" style={{ textDecoration: 'none' }}>
          <Photo k="thane" h="100%" style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.7) 100%)' }}/>
            <div style={{ position: 'absolute', top: 12, left: 12 }}><Pill kind="coral">Booking open</Pill></div>
            <Bookmark k="thane"/>
            <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, color: '#fff' }}>
              <h3 style={{ margin: 0, fontFamily: typ.display, fontSize: 16, lineHeight: 1.2, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                Sunday Biryani Walk
              </h3>
              <div style={{ marginTop: 6, fontFamily: typ.body, fontSize: 11, opacity: 0.9 }}>Devansh P. · ₹1,200 · 18/24 spots</div>
            </div>
          </Photo>
        </a>

        {/* Right column small 2 */}
        <a href="#" style={{ textDecoration: 'none' }}>
          <Photo k="bandra" h="100%" style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0) 45%, rgba(0,0,0,0.7) 100%)' }}/>
            <div style={{ position: 'absolute', top: 12, left: 12 }}><Pill kind="glass">FREE</Pill></div>
            <Bookmark k="bandra"/>
            <div style={{ position: 'absolute', left: 14, right: 14, bottom: 14, color: '#fff' }}>
              <h3 style={{ margin: 0, fontFamily: typ.display, fontSize: 16, lineHeight: 1.2, fontWeight: 600, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>
                Monsoon photo walk · Bandra
              </h3>
              <div style={{ marginTop: 6, fontFamily: typ.body, fontSize: 11, opacity: 0.9 }}>Saanvi K. · Fri 4pm · 32 going</div>
            </div>
          </Photo>
        </a>
      </div>

      {/* Small row of 4 — posts */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 12,
      }}>
        {[
          { k: 'matheran', t: 'Matheran without the crowds', meta: 'Aanya R. · 218 saves', pill: 'Itinerary' },
          { k: 'fishing', t: 'A morning at the fishing village', meta: 'Riya M. · 4 hours · ₹1,500', pill: 'Experience' },
          { k: 'bhandar', t: 'Bhandardara sunrise loop', meta: 'Aanya R. · 1 day · ₹2,400', pill: 'Itinerary' },
          { k: 'goa', t: 'Off-season Goa is the only Goa', meta: 'Karthik S. · 7 chapters', pill: 'Story' },
        ].map(c => (
          <a key={c.k} href="#" style={{ textDecoration: 'none' }}>
            <div style={{ background: t.surface, border: `1px solid ${t.hairline}`, borderRadius: radius.lg, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s' }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 12px 28px rgba(20,20,30,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <Photo k={c.k} h={150} style={{ borderRadius: 0, position: 'relative' }}>
                <div style={{ position: 'absolute', top: 10, left: 10 }}><Pill kind="glass">{c.pill}</Pill></div>
                <Bookmark k={c.k + 'sm'}/>
              </Photo>
              <div style={{ padding: '14px 14px 16px' }}>
                <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 600, color: t.ink, lineHeight: 1.3, marginBottom: 6 }}>{c.t}</div>
                <div style={{ fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted }}>{c.meta}</div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );

  // ── Map strip — interactive city pins ────────────────────────
  const MapStrip = (
    <section style={{ maxWidth: 1240, margin: '40px auto 0', padding: '0 32px' }}>
      <div style={{ position: 'relative', height: 280, borderRadius: radius.xl, overflow: 'hidden', background: 'linear-gradient(135deg, #d8e0d4 0%, #c4cdb8 30%, #c8a890 65%, #b89a76 100%)', border: `1px solid ${t.hairline}` }}>
        {/* Decorative map "topography" */}
        <svg width="100%" height="100%" viewBox="0 0 1200 280" style={{ position: 'absolute', inset: 0, opacity: 0.35 }}>
          <path d="M0,180 Q200,150 400,170 T800,140 T1200,160" stroke={t.ink} strokeWidth="0.6" fill="none"/>
          <path d="M0,210 Q300,180 600,200 T1200,190" stroke={t.ink} strokeWidth="0.4" fill="none"/>
          <path d="M0,240 Q250,220 500,235 T1200,220" stroke={t.ink} strokeWidth="0.4" fill="none"/>
          <path d="M0,90 Q150,60 300,80 T600,70 T900,90 T1200,75" stroke={t.ink} strokeWidth="0.4" fill="none"/>
        </svg>

        <div style={{ position: 'absolute', top: 24, left: 28, right: 28, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 2 }}>
          <div>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.ink, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Within 6h drive</div>
            <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 26, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em' }}>
              Trips from <em style={{ fontStyle: 'italic', color: t.primary }}>Mumbai</em>
            </h2>
          </div>
          <button style={{
            background: t.surface, color: t.ink, border: `1px solid ${t.hairlineStrong}`,
            padding: '8px 14px', borderRadius: 999, cursor: 'pointer', fontFamily: typ.body, fontSize: 12, fontWeight: 600,
            display: 'flex', alignItems: 'center', gap: 6,
          }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
            Open full map
          </button>
        </div>

        {/* Pins */}
        {[
          { x: 28, y: 75, label: 'Konkan', count: 24, hot: true },
          { x: 18, y: 56, label: 'Igatpuri', count: 8 },
          { x: 38, y: 40, label: 'Bhandardara', count: 12 },
          { x: 50, y: 70, label: 'Velas', count: 6, hot: true },
          { x: 62, y: 48, label: 'Matheran', count: 14 },
          { x: 76, y: 62, label: 'Pune', count: 28 },
          { x: 88, y: 80, label: 'Mahabaleshwar', count: 18 },
        ].map((p, i) => (
          <div key={i} style={{ position: 'absolute', left: `${p.x}%`, top: `${p.y}%`, transform: 'translate(-50%, -100%)', zIndex: 3 }}>
            <div style={{
              padding: '5px 10px 5px 8px', borderRadius: 999,
              background: p.hot ? t.primary : t.surface, color: p.hot ? '#fff' : t.ink,
              fontFamily: typ.body, fontSize: 11.5, fontWeight: 600,
              boxShadow: '0 6px 18px rgba(20,20,30,0.18)',
              display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer',
              transition: 'transform 0.18s cubic-bezier(.5,1.6,.5,1)',
              whiteSpace: 'nowrap',
            }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.08)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              {p.hot && <span style={{ fontSize: 10 }}>🔥</span>}
              {p.label} <span style={{ opacity: 0.7, fontWeight: 500 }}>· {p.count}</span>
            </div>
            <div style={{
              width: 0, height: 0, borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
              borderTop: `7px solid ${p.hot ? t.primary : t.surface}`, margin: '0 auto', filter: 'drop-shadow(0 2px 2px rgba(0,0,0,0.15))',
            }}/>
          </div>
        ))}
      </div>
    </section>
  );

  // ── Creator spotlight — parallax tilt card ───────────────────
  const onTilt = (e) => {
    const r = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 8;
    const y = ((e.clientY - r.top) / r.height - 0.5) * -6;
    setTilt({ x, y });
  };
  const Spotlight = (
    <section style={{ maxWidth: 1240, margin: '40px auto 0', padding: '0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Creator spotlight</div>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 28, fontWeight: 600, letterSpacing: '-0.015em', color: t.ink }}>
            From the people you <em style={{ fontStyle: 'italic', color: t.primary }}>follow</em>
          </h2>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button style={{ width: 36, height: 36, borderRadius: 999, border: `1px solid ${t.hairline}`, background: t.surface, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth="2"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <button style={{ width: 36, height: 36, borderRadius: 999, border: `1px solid ${t.hairline}`, background: t.surface, cursor: 'pointer', display: 'grid', placeItems: 'center' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={t.ink} strokeWidth="2"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>

      <div onMouseMove={onTilt} onMouseLeave={() => setTilt({ x: 0, y: 0 })}
        style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: radius.xl, overflow: 'hidden',
          background: t.surface, border: `1px solid ${t.hairline}`,
          boxShadow: '0 8px 32px rgba(20,20,30,0.06)',
          transform: `perspective(1200px) rotateY(${tilt.x}deg) rotateX(${tilt.y}deg)`,
          transition: 'transform 0.2s ease-out',
          minHeight: 360,
        }}>
        <div style={{ padding: '40px 44px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 22 }}>
              <Avatar initials="AR" size={48} gradient="linear-gradient(135deg, #d4b896, #a07c5a)"/>
              <div>
                <div style={{ fontFamily: typ.body, fontSize: 14, fontWeight: 700, color: t.ink, display: 'flex', alignItems: 'center', gap: 6 }}>
                  Aanya Ravi
                  <span style={{ width: 14, height: 14, borderRadius: 999, background: t.primary, color: '#fff', display: 'grid', placeItems: 'center', fontSize: 8, fontWeight: 700 }}>✓</span>
                </div>
                <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>Mumbai · 2.4k followers · 18 itineraries</div>
              </div>
            </div>
            <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', marginBottom: 10 }}>New this week</div>
            <h3 style={{ margin: 0, fontFamily: typ.display, fontSize: 26, lineHeight: 1.1, fontWeight: 600, color: t.ink, letterSpacing: '-0.015em', marginBottom: 12 }}>
              "I went back to Konkan in monsoon. The roads were empty. Here's the route I'd repeat next year."
            </h3>
            <p style={{ margin: 0, fontFamily: typ.body, fontSize: 13.5, color: t.inkSoft, lineHeight: 1.55 }}>
              4 chapters · 312 km · 1 booking-ready stop with a fisherman family in Guhagar. Posted 3 days ago.
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8, marginTop: 28 }}>
            <button style={{ background: t.ink, color: t.surface, border: 0, padding: '12px 18px', borderRadius: radius.md, cursor: 'pointer', fontFamily: typ.body, fontSize: 13, fontWeight: 600 }}>
              Read story →
            </button>
            <button style={{ background: 'transparent', color: t.ink, border: `1.5px solid ${t.hairlineStrong}`, padding: '12px 18px', borderRadius: radius.md, cursor: 'pointer', fontFamily: typ.body, fontSize: 13, fontWeight: 600 }}>
              View profile
            </button>
          </div>
        </div>
        <Photo k="konkan" h="100%" style={{ borderRadius: 0, position: 'relative', minHeight: 360 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 0%, transparent 30%)' }}/>
          <div style={{ position: 'absolute', bottom: 18, right: 18, padding: '6px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.92)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', fontFamily: typ.body, fontSize: 11.5, fontWeight: 600, color: t.ink }}>
            Chapter 1 of 4 · 4 min read
          </div>
        </Photo>
      </div>

      {/* Tiny "from follows" strip */}
      <div style={{ marginTop: 18, display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
        {[
          { initials: 'DP', name: 'Devansh P.', new: 2, color: 'linear-gradient(135deg, #c8a677, #8a6845)' },
          { initials: 'SK', name: 'Saanvi K.', new: 1, color: 'linear-gradient(135deg, #b89a76, #d8c4a6)' },
          { initials: 'VK', name: 'Vikram K.', new: 3, color: 'linear-gradient(135deg, #a08680, #6a4a40)' },
          { initials: 'RM', name: 'Riya M.', new: 0, color: 'linear-gradient(135deg, #c0a094, #8a6e62)' },
        ].map(c => (
          <button key={c.initials} style={{
            display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
            borderRadius: radius.md, background: t.surface, border: `1px solid ${t.hairline}`,
            cursor: 'pointer', textAlign: 'left',
          }}>
            <Avatar initials={c.initials} size={36} gradient={c.color}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: typ.body, fontSize: 13, fontWeight: 600, color: t.ink }}>{c.name}</div>
              <div style={{ fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted }}>
                {c.new > 0 ? <><strong style={{ color: t.primary }}>{c.new} new</strong> story</> : 'All caught up'}
              </div>
            </div>
            {c.new > 0 && <div style={{ width: 8, height: 8, borderRadius: 999, background: t.primary }}/>}
          </button>
        ))}
      </div>
    </section>
  );

  // ── Continue reading — story progress, narrative ─────────────
  const Continue = (
    <section style={{ maxWidth: 1240, margin: '40px auto 0', padding: '0 32px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 18 }}>
        <div>
          <div style={{ fontFamily: typ.mono, fontSize: 10, color: t.primary, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', marginBottom: 6 }}>Pick up where you left off</div>
          <h2 style={{ margin: 0, fontFamily: typ.display, fontSize: 26, fontWeight: 600, letterSpacing: '-0.015em', color: t.ink }}>
            Three stories <em style={{ fontStyle: 'italic', color: t.primary }}>half-read</em>
          </h2>
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {[
          { k: 'konkan', t: 'Konkan in 4 Quiet Days', creator: 'Aanya R.', progress: 0.5, chapter: 'Ch. 2 of 4 · Velas at first light' },
          { k: 'spiti', t: 'Spiti Routes — 2026', creator: 'Vikram K.', progress: 0.25, chapter: 'Ch. 2 of 8 · Crossing Kunzum' },
          { k: 'matheran', t: 'Matheran Without the Crowds', creator: 'Aanya R.', progress: 0.75, chapter: 'Ch. 3 of 4 · The midnight train' },
        ].map(c => (
          <a key={c.k} href="#" style={{ textDecoration: 'none' }}>
            <div style={{
              display: 'flex', gap: 14, padding: 14, borderRadius: radius.lg,
              background: t.surface, border: `1px solid ${t.hairline}`,
              cursor: 'pointer', transition: 'transform 0.18s, box-shadow 0.18s',
            }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 10px 24px rgba(20,20,30,0.08)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
            >
              <Photo k={c.k} h={92} style={{ width: 92, flex: '0 0 92px', borderRadius: radius.md }}/>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
                <div>
                  <div style={{ fontFamily: typ.body, fontSize: 13.5, fontWeight: 600, color: t.ink, lineHeight: 1.25, marginBottom: 4 }}>{c.t}</div>
                  <div style={{ fontFamily: typ.body, fontSize: 11.5, color: t.inkMuted, marginBottom: 8 }}>{c.creator} · {c.chapter}</div>
                </div>
                <div>
                  <div style={{ height: 4, borderRadius: 999, background: t.surfaceAlt, overflow: 'hidden', marginBottom: 6 }}>
                    <div style={{ height: '100%', width: `${c.progress * 100}%`, background: t.primary, borderRadius: 999 }}/>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: typ.mono, fontSize: 10, color: t.inkMuted, fontWeight: 600 }}>
                    <span>{Math.round(c.progress * 100)}% read</span>
                    <span>continue →</span>
                  </div>
                </div>
              </div>
            </div>
          </a>
        ))}
      </div>
    </section>
  );

  // ── Footer ───────────────────────────────────────────────────
  const Footer = (
    <footer style={{ marginTop: 80, padding: '40px 32px 32px', borderTop: `1px solid ${t.hairline}`, background: t.surface }}>
      <div style={{ maxWidth: 1240, margin: '0 auto', display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ fontFamily: typ.display, fontWeight: 600, fontSize: 18, color: t.ink, letterSpacing: '-0.02em' }}>
          creator<em style={{ fontStyle: 'italic', color: t.primary }}>hub</em>
        </div>
        <div style={{ fontFamily: typ.body, fontSize: 12, color: t.inkMuted }}>
          Travel stories worth saving. Travel plans worth booking. · Made in Bengaluru.
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 16, fontFamily: typ.body, fontSize: 12, color: t.inkSoft }}>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>About</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Creators</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Press</a>
          <a href="#" style={{ color: 'inherit', textDecoration: 'none' }}>Help</a>
        </div>
      </div>
    </footer>
  );

  return (
    <DCArtboard id="w3-home" label="W3 · Web home feed (single column · interactive)" width={1280} height={3680}>
      <style>{`
        @keyframes w3pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
      `}</style>
      <div style={{ width: 1280, background: t.bg, color: t.ink, fontFamily: typ.body, paddingBottom: 0, minHeight: 3680 }}>
        {Header}
        {Hero}
        {QuestStrip}
        {Moods}
        {Bento}
        {MapStrip}
        {Spotlight}
        {Continue}
        {Footer}
      </div>
    </DCArtboard>
  );
}

Object.assign(window, { S_WebHome });
