import { useState, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════
// <AppName> Clickable Prototype · Turn 4 of 4 · FINAL
// Faithful: Onboarding v3, Home v4, Detail pages, Booking, Studio, Wizard, Saved, You, sub-screens
// ═══════════════════════════════════════════════════════════════

const C = {
  surface: "#FAF7F4", sunken: "#F2EEE8", border: "#E5E0D7",
  line: "#C9C3B6", softInk: "#9C9689", muted: "#6B6660",
  ink: "#2C2823", coral: "#E15A41", coralWash: "#FFF5F1",
  white: "#FFFFFF", green: "#0F6E56", greenBg: "#E1F5EE",
  // Per-vertical accent colors from wireframe
  amber: "#B8860B", olive: "#5A7247", violet: "#7C5CBF",
  coralAccent: "#E15A41", blue: "#3B7DD8", jade: "#2D8F6F",
  plum: "#8B4F8B", gray: "#888888"
};

const verticalColors = {
  Travel: C.amber, Food: C.olive, Fitness: C.violet,
  Stories: C.coralAccent, Photography: C.blue, Wellness: C.jade,
  Music: C.plum, Education: C.gray
};

const F = { display: "'Fraunces', Georgia, serif", body: "'Inter', system-ui, sans-serif" };

// ── Shared Components ──

const BackBtn = ({ onClick }) => (
  <div onClick={onClick} style={{ width: 32, height: 32, background: C.white, border: `0.5px solid ${C.border}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
  </div>
);

const Avatar = ({ initials, size = 40, ring = false, color }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", border: ring ? `2px solid ${color || C.coral}` : `1.5px solid ${C.border}`, padding: ring ? 2 : 0, flexShrink: 0 }}>
    <div style={{ width: "100%", height: "100%", borderRadius: "50%", background: color ? `${color}18` : C.sunken, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: size * 0.35, fontWeight: 600, color: color || C.ink }}>{initials}</div>
  </div>
);

const MtnCover = ({ h = 160, tint }) => (
  <svg width="100%" height={h} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
    <rect width="400" height="200" fill={tint || C.border}/>
    <path d="M0 100 L60 65 L130 85 L200 55 L270 80 L340 50 L400 70 L400 200 L0 200Z" fill={C.softInk}/>
    <path d="M0 135 L70 108 L150 120 L230 95 L310 112 L400 92 L400 200 L0 200Z" fill={C.muted}/>
    <path d="M0 165 L80 148 L170 155 L260 140 L340 150 L400 142 L400 200 L0 200Z" fill="#444441"/>
  </svg>
);

const CoralMtnCover = ({ h = 160 }) => (
  <svg width="100%" height={h} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
    <rect width="400" height="200" fill="#F0D5CC"/>
    <rect width="400" height="200" fill="#E8B5A5" rx="0"/>
    <text x="200" y="100" fontFamily="Inter" fontSize="12" fill="#C9A090" textAnchor="middle" dominantBaseline="middle">5 min read</text>
  </svg>
);

const ItineraryCover = ({ h = 160 }) => (
  <svg width="100%" height={h} viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" style={{ display: "block" }}>
    <rect width="400" height="200" fill="#E8E2D6"/>
    <path d="M50 50 C 120 90, 200 110, 250 160 S 350 190, 380 200" stroke="#C9C3B6" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="6 4"/>
    <circle cx="80" cy="65" r="9" fill="#2C2823"/>
    <circle cx="170" cy="105" r="9" fill="#2C2823"/>
    <circle cx="260" cy="155" r="11" fill="#E15A41"/>
  </svg>
);

const Toast = ({ message, visible }) => (
  <div style={{ position: "fixed", bottom: 100, left: "50%", transform: `translateX(-50%) translateY(${visible ? 0 : 20}px)`, opacity: visible ? 1 : 0, background: C.ink, color: C.surface, fontSize: 13, fontWeight: 500, padding: "12px 20px", borderRadius: 12, transition: "all 0.3s ease", pointerEvents: "none", zIndex: 100, whiteSpace: "nowrap" }}>{message}</div>
);

const VerticalIcon = ({ name, size = 28, color }) => {
  const icons = {
    Travel: "M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Z",
    Food: "M8 2v5.5a2.5 2.5 0 0 0 5 0V2M12 2v5.5a2.5 2.5 0 0 1-5 0V2M3 2l.5 5.5a2.5 2.5 0 0 0 5 0L9 2",
    Fitness: "M4 8h16M4 16h16M6 4v16M18 4v16",
    Stories: "M4 4h16v16H4z",
    Photography: "M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z",
    Wellness: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
    Music: "M9 18V5l12-2v13",
    Education: "M22 10v6M2 10l10-5 10 5-10 5z"
  };
  if (name === "Travel") return <svg width={size} height={size} viewBox="0 0 256 256" fill={color}><path d={icons.Travel}/></svg>;
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icons[name] || icons.Stories}/></svg>;
};

// ══════════════════════════════════════════════════════════════
// MAIN APP
// ══════════════════════════════════════════════════════════════

export default function Prototype() {
  const [screen, setScreen] = useState("welcome");
  const [history, setHistory] = useState([]);
  const [toast, setToast] = useState(null);
  const [onbStep, setOnbStep] = useState(0);
  const [selectedVerts, setSelectedVerts] = useState(["Travel", "Food", "Stories"]);
  const [bookingStep, setBookingStep] = useState(0);
  const [wizardStep, setWizardStep] = useState(0);
  const [wizardType, setWizardType] = useState("itinerary");
  const [studioState, setStudioState] = useState("active");
  const [youState, setYouState] = useState("creator");

  const nav = useCallback((t) => { setHistory(h => [...h, screen]); setScreen(t); }, [screen]);
  const back = useCallback(() => { if (history.length) { setScreen(history[history.length - 1]); setHistory(h => h.slice(0, -1)); } }, [history]);
  const tabNav = (t) => { setHistory([]); setScreen(t); };
  const showToast = (m) => { setToast(m); setTimeout(() => setToast(null), 2000); };

  const activeTab = (() => {
    if (["home"].includes(screen) || screen.startsWith("detail")) return "home";
    if (screen === "discover") return "discover";
    if (["studio", "wizard"].includes(screen)) return "studio";
    if (screen.startsWith("saved")) return "saved";
    if (screen.startsWith("you") || ["notifications", "profile_edit", "bookings", "connected"].includes(screen)) return "you";
    return null;
  })();

  // ── TAB BAR (matching Image 2 exactly) ──
  const TabBar = () => (
    <div style={{ background: C.surface, borderTop: `0.5px solid ${C.border}`, padding: "8px 12px 16px" }}>
      <div style={{ background: C.white, borderRadius: 16, padding: "10px 6px 12px", display: "grid", gridTemplateColumns: "repeat(5,1fr)", boxShadow: "0 -2px 10px rgba(0,0,0,0.04)" }}>
        {[
          { id: "home", label: "Home", d: "m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" },
          { id: "discover", label: "Discover", d: "M21 21l-4.35-4.35M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z" },
          { id: "studio", label: "Studio", d: "M4 6h16M4 12h16M4 18h16", badge: 3 },
          { id: "saved", label: "Saved", d: "M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" },
          { id: "you", label: "You", d: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z" },
        ].map(t => {
          const isActive = activeTab === t.id;
          return (
            <div key={t.id} onClick={() => tabNav(t.id)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 3, cursor: "pointer", position: "relative" }}>
              <div style={{ position: "relative" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill={isActive ? C.coral : "none"} stroke={isActive ? C.coral : C.muted} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={t.d}/></svg>
                {t.badge && !isActive && <div style={{ position: "absolute", top: -4, right: -8, width: 16, height: 16, borderRadius: "50%", background: C.coral, color: C.white, fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `1.5px solid ${C.white}` }}>{t.badge}</div>}
              </div>
              <div style={{ fontSize: 10, color: isActive ? C.coral : C.muted, fontWeight: isActive ? 600 : 400 }}>{t.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // ONBOARDING v3 (matching Image 4 exactly)
  // ══════════════════════════════════════════════════════════
  const Onboarding = () => {
    const steps = [
      // A · WELCOME · CREATOR-PLATFORM STORY
      <div key="welcome" style={{ padding: "20px 24px 30px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 600, color: C.ink, marginBottom: 24 }}>platform</div>

        {/* Card illustration - 3 content types */}
        <div style={{ position: "relative", height: 180, marginBottom: 28 }}>
          {/* Recipe card (green-tinted, left) */}
          <div style={{ position: "absolute", left: 10, top: 30, width: 100, height: 130, background: C.white, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden", transform: "rotate(-8deg)" }}>
            <div style={{ height: 60, background: "#8BAF7A" }}/>
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 8, color: C.olive, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>RECIPE</div>
              <div style={{ width: "70%", height: 4, background: C.border, borderRadius: 2, marginTop: 6 }}/>
              <div style={{ width: "50%", height: 4, background: C.border, borderRadius: 2, marginTop: 4 }}/>
            </div>
          </div>
          {/* Story card (coral-tinted, center) */}
          <div style={{ position: "absolute", left: "50%", top: 0, transform: "translateX(-50%)", width: 100, height: 130, background: C.white, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden", zIndex: 2 }}>
            <div style={{ height: 60, background: "#F0C5B5" }}/>
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 8, color: C.coral, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>STORY</div>
              <div style={{ width: "80%", height: 4, background: C.border, borderRadius: 2, marginTop: 6 }}/>
              <div style={{ width: "60%", height: 4, background: C.border, borderRadius: 2, marginTop: 4 }}/>
            </div>
          </div>
          {/* Trip card (amber-tinted, right) */}
          <div style={{ position: "absolute", right: 10, top: 30, width: 100, height: 130, background: C.white, borderRadius: 10, boxShadow: "0 4px 16px rgba(0,0,0,0.08)", overflow: "hidden", transform: "rotate(6deg)" }}>
            <div style={{ height: 60, background: "#D4B896" }}/>
            <div style={{ padding: "8px 10px" }}>
              <div style={{ fontSize: 8, color: C.amber, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>TRIP</div>
              <div style={{ width: "70%", height: 4, background: C.border, borderRadius: 2, marginTop: 6 }}/>
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 10 }}>
                <div style={{ fontSize: 9, fontFamily: F.display, fontWeight: 600, color: C.ink }}>₹1,499</div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 500, color: C.ink, lineHeight: 1.1, marginBottom: 12 }}>
          A home for the creators you trust — <span style={{ fontStyle: "italic", color: C.coral }}>and the work they make.</span>
        </div>
        <div style={{ fontSize: 15, color: C.muted, lineHeight: 1.55, marginBottom: 32 }}>
          Trips, recipes, stories, guides. Whatever your favourite people make, you'll find it here.
        </div>

        <div onClick={() => setOnbStep(1)} style={{ background: C.coral, color: C.white, fontFamily: F.body, fontSize: 16, fontWeight: 500, padding: "16px 24px", borderRadius: 14, textAlign: "center", cursor: "pointer", marginBottom: 12 }}>
          Sign up · it takes 30 seconds
        </div>
        <div onClick={() => { setOnbStep(0); tabNav("home"); }} style={{ background: C.white, color: C.ink, border: `1.5px solid ${C.ink}`, fontFamily: F.body, fontSize: 15, fontWeight: 500, padding: "14px 24px", borderRadius: 14, textAlign: "center", cursor: "pointer", marginBottom: 16 }}>
          I already have an account
        </div>
        <div onClick={() => tabNav("home")} style={{ fontSize: 14, color: C.muted, textAlign: "center", cursor: "pointer" }}>
          Browse as guest →
        </div>
      </div>,

      // B · VERTICALS · CENTERED CARDS
      <div key="verticals" style={{ padding: "0 24px 30px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 500, color: C.ink, lineHeight: 1.15, marginBottom: 6 }}>
          What are you into?
        </div>
        <div style={{ fontSize: 14, color: C.muted, lineHeight: 1.5, marginBottom: 24 }}>
          Pick at least 3. Then we'll build your home feed.
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
          {[
            { name: "Travel", count: "142 creators" },
            { name: "Food", count: "8 creators · soon" },
            { name: "Fitness", count: "3 creators · soon" },
            { name: "Stories", count: "23 creators" },
            { name: "Photography", count: "5 creators · soon" },
            { name: "Wellness", count: "2 creators · soon" },
            { name: "Music", count: "coming soon" },
            { name: "Education", count: "coming soon" },
          ].map(v => {
            const selected = selectedVerts.includes(v.name);
            const color = verticalColors[v.name];
            return (
              <div key={v.name} onClick={() => {
                setSelectedVerts(s => s.includes(v.name) ? s.filter(x => x !== v.name) : [...s, v.name]);
              }} style={{
                background: C.white,
                border: selected ? `1.5px solid ${C.coral}` : `1px solid ${C.border}`,
                borderRadius: 14,
                padding: "20px 12px 16px",
                textAlign: "center",
                cursor: "pointer",
                position: "relative",
                boxShadow: selected ? `3px 3px 0 ${C.coral}22` : "none",
                transition: "all 0.15s ease"
              }}>
                {selected && <div style={{ position: "absolute", top: -6, right: -6, width: 22, height: 22, borderRadius: "50%", background: C.coral, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>}
                <div style={{ width: 48, height: 48, borderRadius: 12, background: `${color}15`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
                  <VerticalIcon name={v.name} size={24} color={color}/>
                </div>
                <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 500, color: C.ink, marginBottom: 4 }}>{v.name}</div>
                <div style={{ fontSize: 11, color: C.softInk }}>{v.count}</div>
              </div>
            );
          })}
        </div>

        {selectedVerts.length >= 3 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.green, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize: 14, color: C.green, fontWeight: 500 }}>{selectedVerts.length} picked · ready when you are</div>
          </div>
        )}

        <div onClick={() => setOnbStep(2)} style={{ background: C.coral, color: C.white, fontFamily: F.body, fontSize: 16, fontWeight: 500, padding: "16px 24px", borderRadius: 14, textAlign: "center", cursor: "pointer", opacity: selectedVerts.length >= 3 ? 1 : 0.4 }}>
          Continue
        </div>
      </div>,

      // C · PHONE
      <div key="phone" style={{ padding: "0 24px" }}>
        <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500, color: C.ink, marginBottom: 8 }}>Your phone number</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>We'll send you a one-time code to verify.</div>
        <div style={{ display: "flex", gap: 8, marginBottom: 20 }}>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, width: 60 }}>+91</div>
          <div style={{ flex: 1, background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, color: C.softInk }}>98765 43210</div>
        </div>
        <div onClick={() => setOnbStep(3)} style={{ background: C.coral, color: C.white, fontSize: 15, fontWeight: 500, padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer" }}>Send OTP</div>
      </div>,

      // D · OTP
      <div key="otp" style={{ padding: "0 24px" }}>
        <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500, color: C.ink, marginBottom: 8 }}>Enter the code</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 24 }}>Sent to +91 98765 43210</div>
        <div style={{ display: "flex", gap: 10, justifyContent: "center", marginBottom: 24 }}>
          {[4,8,2,1].map((n,i) => <div key={i} style={{ width: 48, height: 56, background: C.white, border: `1.5px solid ${C.ink}`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", fontFamily: F.display, fontSize: 24, fontWeight: 600 }}>{n}</div>)}
        </div>
        <div onClick={() => { setOnbStep(0); tabNav("home"); }} style={{ background: C.coral, color: C.white, fontSize: 15, fontWeight: 500, padding: "14px", borderRadius: 12, textAlign: "center", cursor: "pointer" }}>Verify</div>
        <div style={{ fontSize: 13, color: C.coral, textAlign: "center", marginTop: 16, cursor: "pointer" }}>Resend code</div>
      </div>,
    ];

    return (
      <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
        {onbStep > 0 && (
          <div style={{ padding: "14px 16px 0", display: "flex", alignItems: "center", gap: 12 }}>
            <BackBtn onClick={() => setOnbStep(s => s - 1)}/>
            {onbStep > 0 && <div style={{ flex: 1, display: "grid", gridTemplateColumns: `repeat(${onbStep <= 1 ? 3 : 2},1fr)`, gap: 4 }}>
              {Array.from({ length: onbStep <= 1 ? 3 : 2 }).map((_, i) => <div key={i} style={{ height: 3, background: (onbStep <= 1 ? onbStep > i : onbStep - 1 > i) ? C.jade : C.border, borderRadius: 99 }}/>)}
            </div>}
          </div>
        )}
        <div style={{ padding: onbStep > 0 ? "16px 0 0" : 0, flex: 1, display: "flex", flexDirection: "column" }}>
          {steps[onbStep]}
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // HOME FEED v4 (matching Image 6 exactly)
  // ══════════════════════════════════════════════════════════
  const HomeFeed = () => (
    <div style={{ paddingBottom: 8 }}>
      {/* Top bar: YOU'RE IN Pune ▼ + avatar + notification */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 8px" }}>
        <div>
          <div style={{ fontSize: 10, color: C.softInk, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 500 }}>YOU'RE IN</div>
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <svg width="12" height="12" viewBox="0 0 256 256" fill={C.coral}><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Z"/></svg>
            <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600, color: C.ink }}>Pune</div>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.muted} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.sunken, border: `1px solid ${C.border}` }}/>
          <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.white, border: `0.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", position: "relative", cursor: "pointer" }} onClick={() => nav("notifications")}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
            <div style={{ position: "absolute", top: 5, right: 6, width: 7, height: 7, borderRadius: "50%", background: C.coral, border: `1.5px solid ${C.white}` }}/>
          </div>
        </div>
      </div>

      {/* Filter chips */}
      <div style={{ display: "flex", gap: 6, padding: "10px 18px 16px", overflowX: "auto" }}>
        {[{ l: "⊕ All", active: true }, { l: "⊙ Near you" }, { l: "⊙ Travel" }, { l: "⊙ Stories" }].map((c, i) => (
          <div key={i} style={{ background: c.active ? C.ink : C.white, color: c.active ? C.surface : C.ink, border: c.active ? "none" : `0.5px solid ${C.border}`, fontSize: 12, fontWeight: 500, padding: "8px 14px", borderRadius: 99, flexShrink: 0, cursor: "pointer" }}>{c.l}</div>
        ))}
      </div>

      {/* PICK UP WHERE YOU LEFT OFF */}
      <div style={{ padding: "0 18px 18px" }}>
        <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>PICK UP WHERE YOU LEFT OFF</div>
        <div onClick={() => nav("detail_itinerary")} style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 14, alignItems: "center", cursor: "pointer" }}>
          <div style={{ width: 56, height: 56, borderRadius: 10, background: C.border, flexShrink: 0 }}><MtnCover h={56}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: C.ink }}>Spiti in seven days</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Day 3 of 7 · Riya M.</div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 8 }}>
              <div style={{ flex: 1, height: 4, background: C.sunken, borderRadius: 99, overflow: "hidden" }}>
                <div style={{ width: "42%", height: "100%", background: C.coral, borderRadius: 99 }}/>
              </div>
              <div style={{ fontSize: 11, color: C.muted, fontWeight: 500 }}>42%</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── NEAR YOU IN PUNE ── */}
      <div style={{ padding: "0 18px 6px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.coral}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 256 256" fill={C.coral}><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Z"/></svg>
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 500, color: C.ink }}>Near you in Pune</div>
          <div style={{ fontSize: 11, color: C.muted }}>Trips, meetups, and stories — all within a few hours</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 18px 20px" }}>
        {/* Travel card - photo forward */}
        <div onClick={() => nav("detail_itinerary")} style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
          <div style={{ position: "relative", height: 130 }}>
            <MtnCover h={130}/>
            <div style={{ position: "absolute", top: 8, left: 8, background: C.white, fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 4, color: C.amber, textTransform: "uppercase", letterSpacing: "0.06em" }}>TRAVEL</div>
            <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(44,40,35,0.8)", color: C.surface, fontSize: 9, padding: "3px 7px", borderRadius: 4, fontWeight: 500 }}>4hr away</div>
          </div>
          <div style={{ padding: "10px 12px 12px" }}>
            <div style={{ fontSize: 10, color: C.amber, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>SELF-PACED</div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 500, lineHeight: 1.2, marginBottom: 4 }}>Mahabaleshwar 2...</div>
            <div style={{ fontSize: 10, color: C.muted }}>Sneha M.</div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, marginTop: 6 }}>₹2,499</div>
          </div>
        </div>
        {/* Stories card - text forward */}
        <div onClick={() => nav("detail_post")} style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
          <div style={{ position: "relative", height: 130 }}>
            <CoralMtnCover h={130}/>
            <div style={{ position: "absolute", top: 8, left: 8, background: C.white, fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 4, color: C.coral, textTransform: "uppercase", letterSpacing: "0.06em" }}>STORIES</div>
            <div style={{ position: "absolute", bottom: 8, left: 8, background: "rgba(44,40,35,0.8)", color: C.surface, fontSize: 9, padding: "3px 7px", borderRadius: 4, fontWeight: 500 }}>5 min read</div>
          </div>
          <div style={{ padding: "10px 12px 12px" }}>
            <div style={{ fontSize: 10, color: C.coral, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>POST</div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 500, lineHeight: 1.2, marginBottom: 4 }}>Why I stopped planning trips</div>
            <div style={{ fontSize: 10, color: C.muted }}>Aanya R. · Pune</div>
          </div>
        </div>
      </div>

      {/* ── TRAVEL YOU MIGHT LOVE ── */}
      <div style={{ padding: "0 18px 6px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.amber}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 256 256" fill={C.amber}><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Z"/></svg>
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 500, color: C.ink }}>Travel you might love</div>
          <div style={{ fontSize: 11, color: C.muted }}>Based on the trips you've saved</div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "10px 18px 20px" }}>
        <div onClick={() => nav("detail_scheduled")} style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
          <div style={{ position: "relative", height: 130 }}><MtnCover h={130}/><div style={{ position: "absolute", top: 8, left: 8, background: C.white, fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 4, color: C.amber, textTransform: "uppercase" }}>TRAVEL</div></div>
          <div style={{ padding: "10px 12px 12px" }}>
            <div style={{ fontSize: 10, color: C.amber, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>SCHEDULED</div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 500, lineHeight: 1.2, marginBottom: 4 }}>Ladakh by bike</div>
            <div style={{ fontSize: 10, color: C.muted }}>Arjun K. · 9 days</div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, marginTop: 6 }}>₹24,999</div>
          </div>
        </div>
        <div onClick={() => nav("detail_itinerary")} style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
          <div style={{ position: "relative", height: 130 }}><MtnCover h={130}/><div style={{ position: "absolute", top: 8, left: 8, background: C.white, fontSize: 9, fontWeight: 700, padding: "3px 7px", borderRadius: 4, color: C.amber, textTransform: "uppercase" }}>TRAVEL</div></div>
          <div style={{ padding: "10px 12px 12px" }}>
            <div style={{ fontSize: 10, color: C.amber, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>SELF-PACED</div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 500, lineHeight: 1.2, marginBottom: 4 }}>Goa offbeat</div>
            <div style={{ fontSize: 10, color: C.muted }}>Priya S. · 4 days</div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, marginTop: 6 }}>₹8,500</div>
          </div>
        </div>
      </div>

      {/* ── STORIES WORTH READING ── */}
      <div style={{ padding: "0 18px 6px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.coral}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 500, color: C.ink }}>Stories worth reading</div>
          <div style={{ fontSize: 11, color: C.muted }}>Long-form from writers you'd enjoy</div>
        </div>
      </div>
      <div style={{ padding: "8px 18px 20px" }}>
        {[
          { title: "The best trips from Pune start before 5 AM", author: "Aarti Gokhale", time: "2 days ago", read: "4 MIN READ" },
          { title: "What I learned from 3 years of solo travel", author: "Devika M.", time: "5 days ago", read: "6 MIN READ" },
        ].map((s, i) => (
          <div key={i} onClick={() => nav("detail_post")} style={{ display: "flex", gap: 14, padding: "14px 0", borderBottom: i === 0 ? `0.5px solid ${C.sunken}` : "none", cursor: "pointer", alignItems: "flex-start" }}>
            <div style={{ width: 48, height: 48, borderRadius: 8, background: C.sunken, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.line} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="4" width="16" height="16" rx="2"/></svg>
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 10, color: C.coral, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 3 }}>{s.read}</div>
              <div style={{ fontFamily: F.display, fontSize: 15, fontWeight: 500, lineHeight: 1.25, color: C.ink, marginBottom: 4 }}>{s.title}</div>
              <div style={{ fontSize: 11, color: C.muted }}>{s.author} · {s.time}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── FOOD CREATORS · SOON ── */}
      <div style={{ padding: "0 18px 6px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.olive}15`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.olive} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 500, color: C.ink }}>Food creators</div>
          <div style={{ fontSize: 10, fontWeight: 700, color: C.olive, background: `${C.olive}15`, padding: "2px 8px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.06em" }}>SOON</div>
        </div>
      </div>
      <div style={{ fontSize: 11, color: C.muted, padding: "0 18px 10px" }}>Coming in V1 · we'll tell you when they arrive</div>
      <div style={{ margin: "0 18px 20px", border: `1.5px dashed ${C.line}`, borderRadius: 14, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: `${C.olive}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.olive} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/></svg>
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: C.ink }}>You're on the food waitlist</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>8 food creators have joined so far. We'll notify you when this goes live.</div>
          </div>
        </div>
      </div>

      {/* ── DISCOVER SOMETHING NEW ── */}
      <div style={{ padding: "0 18px 6px", display: "flex", alignItems: "center", gap: 8 }}>
        <div style={{ width: 26, height: 26, borderRadius: 7, background: `${C.blue}12`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/></svg>
        </div>
        <div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 500, color: C.ink }}>Discover something new</div>
          <div style={{ fontSize: 11, color: C.muted }}>Outside your usual · worth a look</div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 12, padding: "10px 18px 20px", overflowX: "auto" }}>
        {[
          { initials: "MR", name: "Mira R.", cat: "Photo walks", color: C.blue },
          { initials: "KB", name: "Kabir B.", cat: "Heritage walks", color: C.amber },
        ].map((c, i) => (
          <div key={i} style={{ width: 120, flexShrink: 0, textAlign: "center" }}>
            <Avatar initials={c.initials} size={64} ring color={c.color}/>
            <div style={{ fontSize: 13, fontWeight: 500, color: C.ink, marginTop: 8 }}>{c.name}</div>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 2, marginBottom: 10 }}>{c.cat}</div>
            <div style={{ background: C.ink, color: C.surface, fontSize: 12, fontWeight: 500, padding: "8px 16px", borderRadius: 10, cursor: "pointer" }} onClick={() => showToast(`Following ${c.name}`)}>Follow</div>
          </div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // PLACEHOLDER SCREENS (to be improved in Turns 2-4)
  // ══════════════════════════════════════════════════════════

  const PlaceholderScreen = ({ title, subtitle, children }) => (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        <BackBtn onClick={back}/>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{title}</div>
      </div>
      {subtitle && <div style={{ padding: "0 18px 16px", fontSize: 12, color: C.muted }}>{subtitle}</div>}
      {children}
    </div>
  );

  const Discover = () => (
    <div>
      <div style={{ padding: "16px 18px 10px" }}>
        <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500, marginBottom: 6 }}>Discover</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 14 }}>Trips, creators, stories, and cities</div>
        <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px 16px", display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.softInk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <div style={{ fontSize: 14, color: C.softInk }}>Try "Spiti" or "Aarti Gokhale"</div>
        </div>
        <div style={{ fontSize: 11, color: C.softInk, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Browse by category</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 20 }}>
          {[{ n: "Travel", c: "247 trips", col: C.amber }, { n: "Stories", c: "85 writers", col: C.coral },
            { n: "Food", c: "6 creators waiting", col: C.olive, soon: true }, { n: "Fitness", c: "3 creators waiting", col: C.violet, soon: true }
          ].map(v => (
            <div key={v.n} onClick={() => nav("detail_scheduled")} style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
              <VerticalIcon name={v.n} size={20} color={v.col}/>
              <div>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{v.n}</div>
                <div style={{ fontSize: 10, color: C.muted }}>{v.c}</div>
              </div>
              {v.soon && <div style={{ fontSize: 8, color: v.col, fontWeight: 700, background: `${v.col}15`, padding: "2px 6px", borderRadius: 99, marginLeft: "auto", textTransform: "uppercase" }}>SOON</div>}
            </div>
          ))}
        </div>
        <div style={{ fontSize: 11, color: C.softInk, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>Handpicked collections</div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Curated by the team · refreshed weekly</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 18px 20px" }}>
        {[{ t: "Monsoon in the Western Ghats", s: "For the brave and the patient" }, { t: "Storytellers worth reading", s: "Long-form from the deep cut" }].map((c, i) => (
          <div key={i} onClick={() => nav("detail_scheduled")} style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
            <div style={{ height: 120 }}><MtnCover h={120}/></div>
            <div style={{ padding: "10px 12px 12px" }}>
              <div style={{ fontFamily: F.display, fontSize: 13, fontWeight: 500, lineHeight: 1.25 }}>{c.t}</div>
              <div style={{ fontSize: 10, color: C.muted, marginTop: 3 }}>{c.s}</div>
            </div>
          </div>
        ))}
      </div>
      <div style={{ padding: "0 18px 6px", fontSize: 11, color: C.softInk, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>Explore by city</div>
      <div style={{ fontSize: 11, color: C.muted, padding: "0 18px 10px" }}>Where creators are building something</div>
      <div style={{ display: "flex", gap: 10, padding: "0 18px 20px" }}>
        {[{ n: "Pune", c: "24 trips" }, { n: "Mumbai", c: "65 trips" }, { n: "Bangalore", c: "31 trips" }].map(c => (
          <div key={c.n} style={{ display: "flex", alignItems: "center", gap: 6, background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 99, padding: "8px 14px", fontSize: 12, fontWeight: 500 }}>
            <svg width="10" height="10" viewBox="0 0 256 256" fill={C.coral}><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Z"/></svg>
            {c.n} <span style={{ color: C.muted, fontWeight: 400 }}>{c.c}</span>
          </div>
        ))}
      </div>
    </div>
  );

  // ══════════════════════════════════════════════════════════
  // DETAIL PAGES (Turn 2 · matching wireframe Images 7, 9)
  // ══════════════════════════════════════════════════════════
  const Detail = ({ type }) => {
    const isPost = type === "detail_post";
    const isEvent = type === "detail_event";
    const isItin = type === "detail_itinerary";
    const isSched = type === "detail_scheduled";

    // ── A · POST (reading-first, text is hero) ──
    if (isPost) return (
      <div>
        <div style={{ padding: "14px 18px" }}><BackBtn onClick={back}/></div>
        <div style={{ padding: "0 18px 20px" }}>
          <div style={{ fontSize: 10, color: C.coral, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>POST · STORIES</div>
          <div style={{ fontFamily: F.display, fontSize: 30, fontWeight: 500, color: C.ink, lineHeight: 1.1, marginBottom: 16 }}>Why I stopped planning trips</div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <Avatar initials="AR" size={32} ring color={C.coral}/>
            <div><div style={{ fontSize: 13, fontWeight: 500 }}>Aanya R.</div><div style={{ fontSize: 10, color: C.muted }}>2 Apr · 5 min read</div></div>
          </div>
          <div style={{ fontFamily: F.display, fontSize: 15, color: C.ink, lineHeight: 1.65, fontStyle: "normal" }}>
            <p style={{ margin: "0 0 14px" }}>Three years ago I had a color-coded spreadsheet for every trip. Flights in blue, hotels in green, restaurants in yellow. It took me weeks to plan a week.</p>
            <p style={{ margin: "0 0 14px" }}>Then I went to Spiti with no plan at all. A friend had mentioned a village. I bought a bus ticket.</p>
            <div style={{ borderLeft: `3px solid ${C.ink}`, padding: "8px 0 8px 16px", margin: "16px 0", fontStyle: "italic", fontSize: 17, fontWeight: 500, lineHeight: 1.4 }}>
              "The best things happened in the gaps I hadn't planned for."
            </div>
            <p style={{ margin: "0 0 14px" }}>Now I book the first night and the last night. Everything in between I figure out as I go. It's changed how I think about trips entirely…</p>
          </div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 0", borderTop: `0.5px solid ${C.border}`, marginTop: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.muted }}>♡ 142</div>
              <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: C.muted }}>💬 23</div>
            </div>
            <div onClick={() => showToast("Saved")} style={{ cursor: "pointer" }}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill={C.coral} stroke={C.coral} strokeWidth="1.5"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </div>
          </div>
        </div>
      </div>
    );

    // ── B · EVENT (date block first, "Who's going" social proof) ──
    if (isEvent) return (
      <div>
        <div style={{ position: "relative" }}><MtnCover h={200}/><div style={{ position: "absolute", top: 14, left: 14 }}><BackBtn onClick={back}/></div></div>
        <div style={{ padding: "20px 18px" }}>
          <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
            {/* Date block */}
            <div style={{ width: 60, flexShrink: 0, border: `1.5px solid ${C.ink}`, borderRadius: 10, overflow: "hidden", textAlign: "center" }}>
              <div style={{ background: C.ink, color: C.surface, fontSize: 10, fontWeight: 700, padding: "4px 0", textTransform: "uppercase" }}>MAY</div>
              <div style={{ padding: "8px 0 6px" }}>
                <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 600, lineHeight: 1 }}>12</div>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, marginTop: 2 }}>SAT</div>
              </div>
            </div>
            <div>
              <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>EVENT · MEETUP</div>
              <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 500, lineHeight: 1.15, marginBottom: 6 }}>Sunrise trek at Sinhagad</div>
              <div style={{ fontSize: 12, color: C.muted }}>by Aarti Gokhale</div>
            </div>
          </div>
          {/* Meta chips */}
          <div style={{ display: "flex", gap: 12, padding: "12px 0", borderTop: `0.5px solid ${C.sunken}`, borderBottom: `0.5px solid ${C.sunken}`, marginBottom: 16 }}>
            {[["⏰","5:30 AM"],["⏱","3.5 hours"],["📊","Moderate"],["👥","3 of 15 left"]].map(([ic,v],i) => (
              <div key={i} style={{ fontSize: 11, color: C.muted, display: "flex", alignItems: "center", gap: 4 }}><span>{ic}</span>{v}</div>
            ))}
          </div>
          <div style={{ fontFamily: F.display, fontSize: 14, color: C.ink, lineHeight: 1.55, marginBottom: 16 }}>Sinhagad before sunrise is something everyone in Pune should do once. We start at 5:30 AM from the base, reach the top in 90 minutes, and catch first light over the Sahyadris…</div>
          {/* Meeting point */}
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 8 }}>Meeting point</div>
          <div style={{ background: C.sunken, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 256 256" fill={C.coral}><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Z"/></svg>
              <div><div style={{ fontSize: 13, fontWeight: 500 }}>Sinhagad Fort base parking</div><div style={{ fontSize: 11, color: C.muted }}>Donje, Pune · 45 min drive from city</div></div>
            </div>
          </div>
          {/* Who's going */}
          <div style={{ fontSize: 12, fontWeight: 600, marginBottom: 10 }}>Who's going · 12</div>
          <div style={{ display: "flex", alignItems: "center", gap: -4, marginBottom: 20 }}>
            {["RM","NK","SP","AD"].map((i,idx) => <div key={idx} style={{ width: 32, height: 32, borderRadius: "50%", background: C.sunken, border: `2px solid ${C.white}`, marginLeft: idx > 0 ? -8 : 0, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 600, color: C.ink, zIndex: 10-idx }}>{i}</div>)}
            <div style={{ width: 32, height: 32, borderRadius: "50%", background: C.coral, border: `2px solid ${C.white}`, marginLeft: -8, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, fontWeight: 700, color: C.white, zIndex: 5 }}>+4</div>
            <div style={{ fontSize: 11, color: C.muted, marginLeft: 8 }}>and 8 others</div>
          </div>
          {/* Sticky CTA */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: `0.5px solid ${C.border}` }}>
            <div><div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>PER PERSON</div><div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600 }}>₹500</div></div>
            <div onClick={() => { setBookingStep(0); nav("booking"); }} style={{ background: C.coral, color: C.white, fontSize: 14, fontWeight: 500, padding: "13px 24px", borderRadius: 12, cursor: "pointer" }}>Get my spot</div>
          </div>
        </div>
      </div>
    );

    // ── C · SELF-PACED ITINERARY (map is hero, spots, freemium) ──
    if (isItin) return (
      <div>
        {/* Map hero */}
        <div style={{ position: "relative", background: C.sunken, height: 240 }}>
          <svg width="100%" height="240" viewBox="0 0 400 240" style={{ display: "block" }}>
            <rect width="400" height="240" fill={C.sunken}/>
            <path d="M50 60 C 120 110, 200 130, 250 170 S 350 200, 380 220" stroke={C.line} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeDasharray="6 4"/>
            <circle cx="75" cy="75" r="12" fill={C.ink}/><text x="75" y="80" fontFamily="Inter" fontSize="11" fontWeight="700" fill={C.surface} textAnchor="middle">1</text>
            <circle cx="155" cy="115" r="12" fill={C.ink}/><text x="155" y="120" fontFamily="Inter" fontSize="11" fontWeight="700" fill={C.surface} textAnchor="middle">2</text>
            <circle cx="250" cy="160" r="14" fill={C.coral}/><text x="250" y="165" fontFamily="Inter" fontSize="12" fontWeight="700" fill={C.surface} textAnchor="middle">3</text>
            {[1,2,3,4].map(i => <circle key={i} cx={80+i*60} cy={180+Math.sin(i)*10} r="4" fill={C.line}/>)}
          </svg>
          <div style={{ position: "absolute", top: 14, left: 14 }}><BackBtn onClick={back}/></div>
          {/* Map/List toggle */}
          <div style={{ position: "absolute", bottom: 14, right: 14, display: "flex", background: C.white, borderRadius: 8, overflow: "hidden", border: `0.5px solid ${C.border}` }}>
            <div style={{ padding: "6px 12px", fontSize: 11, fontWeight: 600, background: C.ink, color: C.surface }}>Map</div>
            <div style={{ padding: "6px 12px", fontSize: 11, fontWeight: 500, color: C.muted }}>List</div>
          </div>
        </div>
        <div style={{ padding: "18px 18px" }}>
          <div style={{ fontSize: 10, color: C.amber, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>SELF-PACED ITINERARY · TRAVEL</div>
          <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500, lineHeight: 1.1, marginBottom: 8 }}>The complete Spiti guide</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <Avatar initials="RM" size={28} ring/><div style={{ fontSize: 12, fontWeight: 500 }}>Riya Menon</div>
            <svg width="12" height="12" viewBox="0 0 24 24" fill={C.green} stroke="none"><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6" stroke={C.white} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          {/* Stats bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4,1fr)", gap: 8, padding: "14px 0", borderTop: `0.5px solid ${C.sunken}`, borderBottom: `0.5px solid ${C.sunken}`, marginBottom: 16 }}>
            {[["7","DAYS"],["24","SPOTS"],["340","KM"],["15k","BUDGET"]].map(([v,l],i) => (
              <div key={i} style={{ textAlign: "center" }}><div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600 }}>{v}</div><div style={{ fontSize: 9, color: C.muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{l}</div></div>
            ))}
          </div>
          {/* Day by day */}
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>Day by day</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 14 }}>
            {["Day 1","Day 2","Day 3","Day 4"].map((d,i) => <div key={i} style={{ background: i===0 ? C.ink : C.white, color: i===0 ? C.surface : C.ink, border: i===0 ? "none" : `0.5px solid ${C.border}`, fontSize: 11, fontWeight: 500, padding: "6px 12px", borderRadius: 99 }}>{d}</div>)}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Day 1 · Manali → Jibhi</div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 14 }}>4 stops · 110 km · 4 hours driving</div>
          {/* Spots with creator notes */}
          {[
            { num: 1, name: "Naggar Castle", meta: "Heritage · 45 min", note: "Come at noon, before the tour buses from Manali get here. The Nicholas Roerich gallery upstairs is easy to miss." },
            { num: 2, name: "Jibhi Waterfall", meta: "Nature · 1 hour", note: "20-minute walk from the road. Wear grippy shoes — the last 50m is slippery.\nBest light is morning." },
          ].map((s,i) => (
            <div key={i} style={{ marginBottom: 14 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 6 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.ink, color: C.surface, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{s.num}</div>
                <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>{s.name}</div><div style={{ fontSize: 10, color: C.muted }}>{s.meta}</div></div>
                <div style={{ fontSize: 10, color: C.muted }}>Open in Maps</div>
              </div>
              <div style={{ background: C.sunken, borderRadius: 10, padding: "10px 14px", marginLeft: 32 }}>
                <div style={{ fontSize: 9, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>RIYA'S NOTE</div>
                <div style={{ fontFamily: F.display, fontSize: 12, fontStyle: "italic", color: C.ink, lineHeight: 1.55 }}>{s.note}</div>
              </div>
            </div>
          ))}
          {/* Locked content */}
          <div style={{ background: C.sunken, borderRadius: 12, padding: "16px 18px", marginBottom: 16, textAlign: "center" }}>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>22 more spots across 6 days<br/>Including Key Monastery, Dhankar Lake, and Chandratal.<br/><span style={{ fontSize: 11, color: C.softInk }}>Get full access to unlock.</span></div>
          </div>
          {/* Sticky bottom bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderTop: `0.5px solid ${C.border}` }}>
            <div><div style={{ fontSize: 10, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>ONE-TIME</div><div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600 }}>₹499 <span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}>lifetime access</span></div></div>
            <div onClick={() => { setBookingStep(10); nav("booking"); }} style={{ background: C.coral, color: C.white, fontSize: 13, fontWeight: 500, padding: "12px 20px", borderRadius: 12, cursor: "pointer" }}>Get full itinerary</div>
          </div>
        </div>
      </div>
    );

    // ── D · SCHEDULED EXPERIENCE (photo hero, stats, day-by-day, inclusions) ──
    return (
      <div>
        <div style={{ position: "relative" }}>
          <MtnCover h={260}/>
          <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 8 }}><BackBtn onClick={back}/></div>
          <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 8 }}>
            <div style={{ width: 32, height: 32, background: "rgba(255,255,255,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
            </div>
            <div onClick={() => showToast("Saved")} style={{ width: 32, height: 32, background: "rgba(255,255,255,0.9)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </div>
          </div>
          <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", gap: 6 }}>
            <div style={{ background: "rgba(255,255,255,0.92)", fontSize: 10, fontWeight: 600, padding: "4px 9px", borderRadius: 99 }}>📍 TRAVEL</div>
            <div style={{ background: "rgba(255,255,255,0.92)", fontSize: 10, fontWeight: 600, padding: "4px 9px", borderRadius: 99 }}>1/9</div>
          </div>
        </div>
        <div style={{ padding: "18px 18px" }}>
          <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500, lineHeight: 1.1, marginBottom: 6 }}>Spiti in seven days</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 14 }}>★ 4.9 (23) · Manali → Kaza → Manali</div>
          {/* Quick stats 2×2 */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, padding: "14px 0", borderTop: `0.5px solid ${C.sunken}`, borderBottom: `0.5px solid ${C.sunken}`, marginBottom: 14 }}>
            {[["DURATION","7 days"],["GROUP SIZE","Up to 8"],["DIFFICULTY","Moderate"],["LANGUAGE","Hindi / English"]].map(([l,v],i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ fontSize: 10, color: C.softInk, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", width: 70 }}>{l}</div>
                <div style={{ fontSize: 12, fontWeight: 500 }}>{v}</div>
              </div>
            ))}
          </div>
          {/* Creator card */}
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0 16px", borderBottom: `0.5px solid ${C.sunken}`, marginBottom: 14 }}>
            <Avatar initials="RM" size={40} ring/>
            <div style={{ flex: 1 }}><div style={{ fontSize: 14, fontWeight: 600 }}>Riya Menon</div><div style={{ fontSize: 11, color: C.muted }}>Travel creator · Based in Pune</div></div>
            <div style={{ border: `1px solid ${C.ink}`, fontSize: 11, fontWeight: 500, padding: "7px 14px", borderRadius: 99, cursor: "pointer" }}>Follow</div>
          </div>
          {/* About */}
          <div style={{ fontFamily: F.display, fontSize: 14, color: C.ink, lineHeight: 1.6, marginBottom: 16 }}>
            Seven days of Himalayan high-desert landscapes, ancient monasteries, and the kind of silence you can't find anywhere else. We cross 14,000 ft passes, stay with local families, and eat more thukpa than is strictly reasonable. This isn't a backpacking trip — it's slower, more considered.
          </div>
          {/* Day by day */}
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>Day by day</div>
          {[
            { d: "Day 1", route: "Manali → Jibhi", desc: "Early start from Manali. We drive the slow road through Kullu valley, stopping at Naggar Castle. Lunch in Jibhi, afternoon walk to the waterfall, evening around the bonfire." },
            { d: "Day 2", route: "Jibhi → Chitkul", desc: "" },
            { d: "Day 3", route: "Kaza & Key Monastery", desc: "" },
          ].map((day,i) => (
            <div key={i} style={{ padding: "12px 0", borderBottom: `0.5px solid ${C.sunken}` }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: day.desc ? 8 : 0 }}>
                <div style={{ width: 6, height: 6, borderRadius: "50%", background: C.ink }}/>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{day.d}</div>
                <div style={{ fontSize: 12, color: C.muted }}>{day.route}</div>
              </div>
              {day.desc && <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55, marginLeft: 14 }}>{day.desc}</div>}
            </div>
          ))}
          <div onClick={() => {}} style={{ fontSize: 12, color: C.coral, fontWeight: 500, padding: "10px 0 16px", cursor: "pointer" }}>Show 4 more days</div>
          {/* What's included */}
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 10 }}>What's included</div>
          {[["✓","6 nights accommodation (8 nights)"],["✓","All meals except day 4 lunch"],["✓","Private vehicle + driver"],["✓","Entry to Key & Dhankar monasteries"],["✗","Travel to Manali (arrive on your own)"]].map(([check,item],i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, padding: "8px 0", fontSize: 12 }}>
              <span style={{ color: check === "✓" ? C.green : C.coral, fontWeight: 600, fontSize: 14 }}>{check}</span>
              <span style={{ color: check === "✓" ? C.ink : C.muted }}>{item}</span>
            </div>
          ))}
          {/* Sticky bottom bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 0 0", borderTop: `0.5px solid ${C.border}`, marginTop: 16 }}>
            <div><div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 600 }}>₹24,999<span style={{ fontSize: 11, color: C.muted, fontWeight: 400 }}> per person</span></div></div>
            <div onClick={() => { setBookingStep(0); nav("booking"); }} style={{ background: C.coral, color: C.white, fontSize: 14, fontWeight: 500, padding: "13px 22px", borderRadius: 12, cursor: "pointer" }}>Check availability</div>
          </div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // BOOKING FLOW (Turn 2 · matching wireframe Image 10)
  // 0-2: scheduled (pick date, travellers, review+pay)
  // 3: confirmation (WhatsApp-first)
  // 10: self-paced variant (single step)
  // ══════════════════════════════════════════════════════════
  const Booking = () => {
    const isSelfPaced = bookingStep === 10;

    // Self-paced variant: single-step purchase
    if (isSelfPaced) return (
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
          <BackBtn onClick={back}/><div style={{ fontSize: 12, color: C.muted }}>Review and pay</div>
        </div>
        <div style={{ padding: "0 18px" }}>
          <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 500, marginBottom: 16 }}>One-time purchase</div>
          <div style={{ background: C.sunken, borderRadius: 12, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: C.border, flexShrink: 0 }}/>
            <div><div style={{ fontSize: 13, fontWeight: 600 }}>The complete Spiti guide</div><div style={{ fontSize: 11, color: C.muted }}>by Riya Menon · 7 days · lifetime access</div></div>
          </div>
          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>WHAT YOU GET</div>
          {["All 24 spots unlocked across 7 days","Riya's insider notes for every spot","Offline access · download once, use anywhere","Free updates if Riya adds new spots"].map((item,i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 0", fontSize: 12 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
              {item}
            </div>
          ))}
          <div style={{ margin: "16px 0", border: `0.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden" }}>
            {[["Itinerary access (lifetime)","₹499"],["GST (18%)","₹90"]].map(([l,v],i) => (
              <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: `0.5px solid ${C.sunken}`, fontSize: 12, color: C.muted }}><span>{l}</span><span style={{ color: C.ink }}>{v}</span></div>
            ))}
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", fontSize: 14, fontWeight: 600 }}><span>Total</span><span style={{ fontFamily: F.display }}>₹589</span></div>
          </div>
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 16, padding: "10px 0" }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, background: C.coral, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
            </div>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>I agree to the Terms and understand digital products are non-refundable after purchase.</div>
          </div>
          <div onClick={() => { setBookingStep(3); }} style={{ background: C.coral, color: C.white, fontSize: 15, fontWeight: 500, padding: "15px", borderRadius: 14, textAlign: "center", cursor: "pointer" }}>Pay ₹589</div>
        </div>
      </div>
    );

    // Scheduled experience: multi-step
    const stepNav = (
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 16px" }}>
        <BackBtn onClick={() => bookingStep > 0 ? setBookingStep(s => s - 1) : back()}/>
        <div style={{ fontSize: 12, color: C.muted }}>{bookingStep < 3 ? `Step ${bookingStep + 1} of 3` : ""}</div>
      </div>
    );

    const steps = [
      // STEP 1 · PICK DATE (matching Image 10 left)
      <div key="date" style={{ padding: "0 18px" }}>
        <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 500, marginBottom: 16 }}>Pick your date</div>
        {/* Trip summary card */}
        <div style={{ background: C.sunken, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: C.border, flexShrink: 0 }}/>
          <div><div style={{ fontSize: 13, fontWeight: 600 }}>Spiti in seven days</div><div style={{ fontSize: 11, color: C.muted }}>Riya Menon · from Manali</div></div>
        </div>
        {/* Date options */}
        {[
          { d: "May 15 – 21", spots: "4 of 8 spots left", badge: "Filling fast", badgeColor: C.coral, selected: true },
          { d: "Jun 5 – 11", spots: "6 of 8 spots left" },
          { d: "Jun 19 – 25", spots: "2 of 8 spots left", badge: "Almost full", badgeColor: C.amber },
          { d: "Jul 3 – 9", spots: "Sold out · join waitlist", soldOut: true },
        ].map((x, i) => (
          <div key={i} style={{
            background: x.selected ? C.coralWash : x.soldOut ? C.sunken : C.white,
            border: x.selected ? `1.5px solid ${C.coral}` : `1px solid ${C.border}`,
            borderRadius: 12, padding: "14px 16px", marginBottom: 10,
            opacity: x.soldOut ? 0.6 : 1, cursor: x.soldOut ? "default" : "pointer"
          }} onClick={() => !x.soldOut && setBookingStep(1)}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{ width: 20, height: 20, borderRadius: "50%", border: x.selected ? "none" : `1.5px solid ${C.line}`, background: x.selected ? C.coral : "transparent", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  {x.selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                </div>
                <div>
                  <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600 }}>{x.d}</div>
                  <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>7 days · {x.spots}</div>
                  {x.badge && <div style={{ fontSize: 10, color: x.badgeColor, fontWeight: 600, marginTop: 4 }}>{x.badge}</div>}
                </div>
              </div>
              <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: x.soldOut ? C.softInk : C.ink }}>₹{x.soldOut ? "26,999" : "24,999"}</div>
            </div>
          </div>
        ))}
        <div onClick={() => setBookingStep(1)} style={{ background: C.coral, color: C.white, fontSize: 15, fontWeight: 500, padding: "15px", borderRadius: 14, textAlign: "center", cursor: "pointer", marginTop: 8 }}>Continue</div>
      </div>,

      // STEP 2 · TRAVELLERS (matching Image 10 center)
      <div key="travellers" style={{ padding: "0 18px" }}>
        <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 500, marginBottom: 16 }}>How many of you?</div>
        <div style={{ background: C.sunken, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", marginBottom: 20 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: C.border, flexShrink: 0 }}/>
          <div><div style={{ fontSize: 13, fontWeight: 600 }}>Spiti in seven days</div><div style={{ fontSize: 11, color: C.muted }}>May 15 – 21 · 4 spots left</div></div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 32, marginBottom: 20 }}>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.white, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }}>−</div>
          <div style={{ textAlign: "center" }}><div style={{ fontFamily: F.display, fontSize: 48, fontWeight: 600, lineHeight: 1 }}>2</div><div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>travellers · including you</div></div>
          <div style={{ width: 40, height: 40, borderRadius: "50%", background: C.white, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, cursor: "pointer" }}>+</div>
        </div>
        <div style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>Names of the other travellers can be added after booking, before the trip starts. Riya will send a form on WhatsApp.</div>
        <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>PRIMARY CONTACT</div>
        <div style={{ marginBottom: 10 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Your name</div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14 }}>Rohit Sharma</div>
        </div>
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 4 }}>Phone (for WhatsApp)</div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14 }}>+91 98765 43210</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <div style={{ fontSize: 12, fontWeight: 700 }}>2 TRAVELLERS</div>
          <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600 }}>₹49,998</div>
        </div>
        <div onClick={() => setBookingStep(2)} style={{ background: C.coral, color: C.white, fontSize: 15, fontWeight: 500, padding: "15px", borderRadius: 14, textAlign: "center", cursor: "pointer" }}>Continue</div>
      </div>,

      // STEP 3 · REVIEW AND PAY (matching Image 10 right, with hold timer)
      <div key="review" style={{ padding: "0 18px" }}>
        <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 500, marginBottom: 14 }}>Review and pay</div>
        {/* Hold timer */}
        <div style={{ background: C.coralWash, border: `1px solid #F8C2B0`, borderRadius: 12, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#6E2412", fontWeight: 500 }}>
            <span style={{ fontSize: 16 }}>⏰</span>
            Your 2 spots are held — pay within
          </div>
          <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 700, color: C.coral }}>09:32</div>
        </div>
        {/* Trip summary */}
        <div style={{ background: C.sunken, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, background: C.border, flexShrink: 0 }}/>
          <div><div style={{ fontSize: 13, fontWeight: 600 }}>Spiti in seven days</div><div style={{ fontSize: 11, color: C.muted }}>May 15 – 21 · 2 travellers</div></div>
        </div>
        {/* Price breakdown */}
        <div style={{ border: `0.5px solid ${C.border}`, borderRadius: 10, overflow: "hidden", marginBottom: 16 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: `0.5px solid ${C.sunken}` }}>
            <div><div style={{ fontSize: 12 }}>Base price</div><div style={{ fontSize: 10, color: C.muted }}>₹20,000 × 2</div></div>
            <div style={{ fontSize: 13, fontWeight: 500 }}>₹40,000</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 14px", borderBottom: `0.5px solid ${C.sunken}`, fontSize: 12 }}>
            <span>GST (18%)</span><span>₹7,200</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 14px", fontSize: 14, fontWeight: 700 }}>
            <span>Total</span><span style={{ fontFamily: F.display, fontSize: 16 }}>₹47,200</span>
          </div>
        </div>
        <div style={{ fontSize: 11, color: C.muted, marginBottom: 12 }}>Flexible cancellation · full refund up to 7 days before departure.</div>
        {/* T&Cs checkbox */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 8, marginBottom: 16, padding: "8px 0" }}>
          <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${C.line}`, flexShrink: 0 }}/>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>I agree to the Terms and Conditions and Refund Policy.</div>
        </div>
        <div onClick={() => setBookingStep(3)} style={{ background: C.coral, color: C.white, fontSize: 15, fontWeight: 500, padding: "15px", borderRadius: 14, textAlign: "center", cursor: "pointer" }}>Pay ₹47,200</div>
      </div>,

      // STEP 4 · CONFIRMATION (matching Image 10 bottom-left)
      <div key="confirm" style={{ padding: "0 18px", textAlign: "center" }}>
        <div style={{ width: 72, height: 72, borderRadius: "50%", background: C.ink, display: "flex", alignItems: "center", justifyContent: "center", margin: "30px auto 20px" }}>
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
        </div>
        <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 500, marginBottom: 8 }}>You're booked</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 4 }}>Spiti in seven days · May 15 – 21</div>
        <div style={{ fontSize: 13, color: C.muted, marginBottom: 6 }}>2 travellers · ₹47,200 paid</div>
        <div style={{ fontFamily: "monospace", fontSize: 11, color: C.softInk, letterSpacing: "0.05em", marginBottom: 24 }}>BOOKING ID · BK-2026-18K7Q</div>
        {/* What happens next */}
        <div style={{ background: C.sunken, borderRadius: 14, padding: "18px 20px", textAlign: "left", marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 14 }}>WHAT HAPPENS NEXT</div>
          {[
            ["1", "Check WhatsApp now. We sent the receipt and Riya's contact to +91 98765 43210."],
            ["2", "Riya will reach out within 24 hours with the traveller details form and kit list."],
            ["3", "Exact meeting point will be shared 24 hours before departure on May 15."],
          ].map(([num, text], i) => (
            <div key={i} style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: i < 2 ? 14 : 0 }}>
              <div style={{ width: 24, height: 24, borderRadius: "50%", background: i === 2 ? C.coral : C.ink, color: C.white, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>{num}</div>
              <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.55 }}>{text}</div>
            </div>
          ))}
        </div>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 500, marginBottom: 10, cursor: "pointer" }}>Add to calendar</div>
        <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, padding: "13px", fontSize: 14, fontWeight: 500, marginBottom: 16, cursor: "pointer" }}>Download GST invoice</div>
        <div onClick={() => { setBookingStep(0); tabNav("home"); }} style={{ fontSize: 13, color: C.muted, cursor: "pointer", paddingBottom: 20 }}>Back to home</div>
      </div>,
    ];

    return (
      <div>
        {bookingStep < 3 && stepNav}
        {bookingStep < 3 && <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4, padding: "0 16px 16px" }}>
          {[0,1,2].map(i => <div key={i} style={{ height: 3, background: bookingStep >= i ? C.ink : C.border, borderRadius: 99 }}/>)}
        </div>}
        {bookingStep === 3 && <div style={{ padding: "14px 16px" }}><BackBtn onClick={() => setBookingStep(2)}/></div>}
        {steps[Math.min(bookingStep, 3)]}
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // STUDIO (Turn 3 · matching wireframe Image 1)
  // 3 states: never_created, has_drafts, active
  // ══════════════════════════════════════════════════════════
  const Studio = () => {
    const StateSwitcher = () => (
      <div style={{ display: "flex", gap: 4, padding: "8px 16px 4px", background: C.sunken, borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ fontSize: 9, color: C.softInk, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 0", marginRight: 6 }}>STATE</div>
        {[["never_created", "Empty"], ["has_drafts", "Drafts"], ["active", "Active"]].map(([s, l]) => (
          <div key={s} onClick={() => setStudioState(s)} style={{
            background: studioState === s ? C.ink : "transparent",
            color: studioState === s ? C.surface : C.muted,
            fontSize: 10, fontWeight: 500, padding: "4px 10px", borderRadius: 99, cursor: "pointer"
          }}>{l}</div>
        ))}
      </div>
    );

    // ── A · NEVER CREATED ──
    if (studioState === "never_created") return (
      <div>
        <StateSwitcher/>
        <div style={{ padding: "20px 18px 8px" }}>
          <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 500, color: C.ink, lineHeight: 1.1 }}>Studio</div>
          <div style={{ fontSize: 13, color: C.muted, marginTop: 4 }}>Your creator workspace</div>
        </div>
        <div style={{ margin: "16px 18px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 18, padding: "32px 24px 28px", textAlign: "center" }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: C.coralWash, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 500, lineHeight: 1.15, marginBottom: 10 }}>Create your first experience</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.55, marginBottom: 22, padding: "0 8px" }}>Share an itinerary, recipe, or guide. Free or paid — you choose.</div>
          <div onClick={() => { setWizardStep(0); setWizardType("itinerary"); nav("wizard"); }} style={{ background: C.coral, color: C.white, fontSize: 15, fontWeight: 500, padding: "13px 28px", borderRadius: 12, display: "inline-block", cursor: "pointer" }}>Get started</div>
        </div>
        <div style={{ padding: "20px 18px 0" }}>
          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 12 }}>OR BROWSE WHAT OTHERS MAKE</div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            {[["Self-paced", "itinerary"], ["Scheduled", "scheduled"]].map(([label, type], i) => (
              <div key={i} onClick={() => nav("detail_" + (type === "itinerary" ? "itinerary" : "scheduled"))} style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
                <div style={{ height: 100 }}><MtnCover h={100}/></div>
                <div style={{ padding: "10px 12px" }}><div style={{ fontSize: 12, fontWeight: 600 }}>{label}</div></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );

    // ── B · HAS DRAFTS ──
    if (studioState === "has_drafts") return (
      <div>
        <StateSwitcher/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 18px 8px" }}>
          <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 500 }}>Studio</div>
          <div onClick={() => { setWizardStep(0); setWizardType("itinerary"); nav("wizard"); }} style={{ background: C.coral, color: C.white, fontSize: 13, fontWeight: 500, padding: "9px 16px", borderRadius: 10, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>+ New</div>
        </div>
        <div style={{ fontSize: 13, color: C.muted, padding: "0 18px 18px" }}>2 drafts in progress</div>

        <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 18px 12px" }}>CONTINUE WHERE YOU LEFT OFF</div>

        {/* Draft 1 with progress */}
        <div style={{ margin: "0 18px 12px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
          <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 14 }}>
            <div style={{ width: 56, height: 56, borderRadius: 10, flexShrink: 0 }}><MtnCover h={56}/></div>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, lineHeight: 1.2 }}>Spiti in seven days</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Edited 2 days ago</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <div style={{ flex: 1, height: 5, background: C.sunken, borderRadius: 99, overflow: "hidden" }}>
              <div style={{ width: "60%", height: "100%", background: C.coral, borderRadius: 99 }}/>
            </div>
            <div style={{ fontSize: 11, fontWeight: 600, color: C.muted }}>60%</div>
          </div>
          <div onClick={() => { setWizardStep(2); setWizardType("itinerary"); nav("wizard"); }} style={{ background: C.white, border: `1px solid ${C.ink}`, color: C.ink, fontSize: 13, fontWeight: 500, padding: "11px", borderRadius: 10, textAlign: "center", cursor: "pointer" }}>Continue</div>
        </div>

        {/* Draft 2 */}
        <div style={{ margin: "0 18px 12px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: 10, flexShrink: 0 }}><MtnCover h={48}/></div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 600 }}>Untitled draft</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Edited 5 days ago · 20%</div>
          </div>
        </div>
      </div>
    );

    // ── C · ACTIVE CREATOR ──
    return (
      <div>
        <StateSwitcher/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 18px 6px" }}>
          <div style={{ fontFamily: F.display, fontSize: 28, fontWeight: 500 }}>Studio</div>
          <div onClick={() => { setWizardStep(0); setWizardType("itinerary"); nav("wizard"); }} style={{ background: C.coral, color: C.white, fontSize: 13, fontWeight: 500, padding: "9px 16px", borderRadius: 10, cursor: "pointer" }}>+ New</div>
        </div>
        <div style={{ fontSize: 13, color: C.muted, padding: "0 18px 16px" }}>14 published · 3 drafts</div>

        {/* Two stat cards side by side */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, padding: "0 18px 14px" }}>
          <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 9, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>THIS MONTH</div>
            <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600 }}>₹42,300</div>
          </div>
          <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px" }}>
            <div style={{ fontSize: 9, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>BOOKINGS</div>
            <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600 }}>28</div>
          </div>
        </div>

        {/* Coral alert */}
        <div style={{ margin: "0 18px 16px", background: C.coralWash, border: `1px solid #F8C2B0`, borderRadius: 14, padding: "14px 16px", display: "flex", gap: 12, alignItems: "flex-start" }}>
          <div style={{ width: 24, height: 24, borderRadius: "50%", background: C.coral, color: C.white, fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>3</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "#6E2412", marginBottom: 2 }}>3 new bookings</div>
            <div style={{ fontSize: 11, color: "#8B3A22" }}>Tap to confirm before tomorrow</div>
          </div>
        </div>

        <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", padding: "0 18px 10px" }}>RECENT</div>
        <div onClick={() => nav("detail_scheduled")} style={{ margin: "0 18px 10px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
          <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0 }}><MtnCover h={44}/></div>
          <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Spiti in seven days</div><div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>12 bookings this week</div></div>
        </div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // PUBLISHING WIZARD (Turn 3 · matching wireframe Images 12-15)
  // Steps: type picker → basics → overview → days/spots → pricing → review
  // ══════════════════════════════════════════════════════════
  const Wizard = () => {
    const totalSteps = 5;
    const stepLabels = ["Basics", "Overview", "Days", "Pricing", "Review"];

    // STEP 0 · Content type picker (matching Image 12 A)
    if (wizardStep === 0) return (
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 18px" }}>
          <div onClick={back} style={{ fontSize: 13, color: C.muted, cursor: "pointer" }}>Cancel</div>
          <div style={{ fontSize: 11, color: C.softInk, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em" }}>CREATE</div>
          <div style={{ width: 40 }}/>
        </div>
        <div style={{ padding: "16px 18px 24px" }}>
          <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500, lineHeight: 1.15, marginBottom: 8 }}>What are you creating?</div>
          <div style={{ fontSize: 13, color: C.muted, lineHeight: 1.5 }}>Pick the type that fits best. You can change your mind before publishing.</div>
        </div>
        <div style={{ padding: "0 18px" }}>
          {[
            { id: "post", icon: "📝", title: "Post", desc: "A long-form write-up", foot: "Free · no KYC needed · fastest to publish" },
            { id: "event", icon: "📅", title: "Event", desc: "A single time-bound experience", foot: "Free or paid · KYC needed if paid · under 24 hours" },
            { id: "scheduled", icon: "👥", title: "Scheduled experience", desc: "A creator-led multi-day trip", foot: "Paid · KYC required · you are with travellers" },
            { id: "itinerary", icon: "📍", title: "Self-paced itinerary", desc: "A spot-based guide travellers follow on their own", foot: "Free or paid · KYC needed if paid · you are not with travellers" },
          ].map(t => {
            const selected = wizardType === t.id;
            return (
              <div key={t.id} onClick={() => setWizardType(t.id)} style={{
                background: selected ? C.coralWash : C.white,
                border: `1.5px solid ${selected ? C.coral : C.border}`,
                borderRadius: 14, padding: "16px", marginBottom: 10, cursor: "pointer"
              }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: selected ? "#FCE3DA" : C.sunken, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>{t.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 500, marginBottom: 2 }}>{t.title}</div>
                    <div style={{ fontSize: 12, color: C.muted }}>{t.desc}</div>
                  </div>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", border: selected ? "none" : `1.5px solid ${C.line}`, background: selected ? C.coral : "transparent", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    {selected && <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>}
                  </div>
                </div>
                <div style={{ fontSize: 10, color: selected ? "#8B3A22" : C.softInk, marginTop: 12, paddingTop: 12, borderTop: `0.5px solid ${selected ? "#F8C2B0" : C.sunken}` }}>{t.foot}</div>
              </div>
            );
          })}
        </div>
        <div style={{ padding: "20px 18px 16px" }}>
          <div onClick={() => setWizardStep(1)} style={{ background: C.coral, color: C.white, fontSize: 15, fontWeight: 500, padding: "15px", borderRadius: 14, textAlign: "center", cursor: "pointer" }}>Continue</div>
        </div>
      </div>
    );

    // Step header for steps 1-5
    const StepHeader = () => (
      <div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px 8px" }}>
          <BackBtn onClick={() => setWizardStep(s => s - 1)}/>
          <div style={{ fontSize: 11, color: C.softInk, fontWeight: 500 }}>Step {wizardStep} of {totalSteps} · {stepLabels[wizardStep - 1]}</div>
          <div onClick={back} style={{ fontSize: 13, color: C.muted, cursor: "pointer" }}>Save</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${totalSteps},1fr)`, gap: 4, padding: "0 18px 16px" }}>
          {Array.from({ length: totalSteps }).map((_, i) => <div key={i} style={{ height: 3, background: wizardStep > i ? C.ink : C.border, borderRadius: 99 }}/>)}
        </div>
      </div>
    );

    // STEP 1 · BASICS (matching Image 13)
    if (wizardStep === 1) return (
      <div>
        <StepHeader/>
        <div style={{ padding: "0 18px 20px" }}>
          <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500, lineHeight: 1.1, marginBottom: 8 }}>Start with the basics</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>These are the first things travellers will see.</div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>COVER IMAGE</div>
          <div style={{ background: C.sunken, border: `1.5px dashed ${C.line}`, borderRadius: 12, padding: "32px 16px", textAlign: "center", marginBottom: 18 }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={C.softInk} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: 10 }}><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            <div style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>Tap to upload</div>
            <div style={{ fontSize: 11, color: C.softInk }}>1200 × 750 · JPG or PNG · max 5 MB</div>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>TITLE</div>
            <div style={{ fontSize: 10, color: C.softInk }}>28 / 100</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 14, marginBottom: 16 }}>The complete Spiti guide</div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>SHORT DESCRIPTION</div>
            <div style={{ fontSize: 10, color: C.softInk }}>89 / 280</div>
          </div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", fontSize: 13, color: C.muted, lineHeight: 1.5, marginBottom: 16 }}>7 days through the Spiti valley. 24 hand-picked spots with monastery timings, local food tips, and homestay contacts.</div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>VERTICAL</div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <svg width="14" height="14" viewBox="0 0 256 256" fill={C.amber}><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Z"/></svg>
              <div style={{ fontSize: 14, fontWeight: 500 }}>Travel</div>
            </div>
            <div style={{ fontSize: 9, color: C.softInk, fontWeight: 600 }}>locked for MVP</div>
          </div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>SUB-CATEGORY · PICK ONE</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {[["Road Trips"], ["Trekking"], ["Heritage & Culture", true], ["Offbeat"], ["Wellness"]].map(([l, sel], i) => (
              <div key={i} style={{ background: sel ? C.ink : C.white, color: sel ? C.surface : C.ink, border: sel ? "none" : `0.5px solid ${C.border}`, fontSize: 11, fontWeight: 500, padding: "7px 13px", borderRadius: 99 }}>{l}</div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>TAGS · UP TO 5</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {["spiti", "monastery", "high altitude"].map((t, i) => (
              <div key={i} style={{ background: C.sunken, fontSize: 11, padding: "6px 12px", borderRadius: 99, display: "flex", alignItems: "center", gap: 5 }}>{t} <span style={{ color: C.softInk }}>×</span></div>
            ))}
            <div style={{ fontSize: 11, color: C.softInk, padding: "6px 12px" }}>+ add</div>
          </div>
        </div>
        <div style={{ padding: "8px 18px 16px" }}>
          <div onClick={() => setWizardStep(2)} style={{ background: C.coral, color: C.white, fontSize: 15, fontWeight: 500, padding: "15px", borderRadius: 14, textAlign: "center", cursor: "pointer" }}>Continue</div>
        </div>
      </div>
    );

    // STEP 2 · TRIP OVERVIEW (matching Image 13)
    if (wizardStep === 2) return (
      <div>
        <StepHeader/>
        <div style={{ padding: "0 18px 20px" }}>
          <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500, marginBottom: 8 }}>Trip overview</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 20 }}>The skeleton of your trip. You can refine later.</div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>STARTS FROM</div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 16 }}>
            <svg width="14" height="14" viewBox="0 0 256 256" fill={C.coral}><path d="M128,16a88.1,88.1,0,0,0-88,88c0,75.3,80,132.17,83.41,134.55a8,8,0,0,0,9.18,0C136,236.17,216,179.3,216,104A88.1,88.1,0,0,0,128,16Z"/></svg>
            <div style={{ fontSize: 14 }}>Manali, Himachal Pradesh</div>
          </div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>ENDS AT · OPTIONAL</div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "12px 14px", display: "flex", alignItems: "center", gap: 8, marginBottom: 18 }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.softInk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <div style={{ fontSize: 14 }}>Kaza, Spiti Valley</div>
          </div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>HOW MANY DAYS?</div>
          <div style={{ background: C.sunken, borderRadius: 12, padding: 16, display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.white, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>−</div>
            <div style={{ textAlign: "center" }}><div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 600, lineHeight: 1 }}>7</div><div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>days</div></div>
            <div style={{ width: 36, height: 36, borderRadius: "50%", background: C.white, border: `1px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, cursor: "pointer" }}>+</div>
          </div>
          <div style={{ fontSize: 11, color: C.muted, marginBottom: 18, lineHeight: 1.5 }}>Creates 7 day buckets. You'll add spots to each in the next step.</div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>BUDGET RANGE · PER TRAVELLER</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
            {[["Under ₹5k"], ["₹5k–15k"], ["₹15k–30k", true], ["₹30k+"]].map(([l, sel], i) => (
              <div key={i} style={{ background: sel ? C.ink : C.white, color: sel ? C.surface : C.ink, border: sel ? "none" : `0.5px solid ${C.border}`, fontSize: 11, fontWeight: 500, padding: "7px 13px", borderRadius: 99 }}>{l}</div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>DIFFICULTY</div>
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            {[["Easy"], ["Moderate", true], ["Challenging"]].map(([l, sel], i) => (
              <div key={i} style={{ background: sel ? C.ink : C.white, color: sel ? C.surface : C.ink, border: sel ? "none" : `0.5px solid ${C.border}`, fontSize: 11, fontWeight: 500, padding: "7px 13px", borderRadius: 99 }}>{l}</div>
            ))}
          </div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>BEST SEASON · PICK ANY</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
            {[["Spring"], ["Summer", true], ["Monsoon"], ["Autumn", true], ["Winter"]].map(([l, sel], i) => (
              <div key={i} style={{ background: sel ? C.ink : C.white, color: sel ? C.surface : C.ink, border: sel ? "none" : `0.5px solid ${C.border}`, fontSize: 11, fontWeight: 500, padding: "7px 13px", borderRadius: 99 }}>{l}</div>
            ))}
          </div>
        </div>
        <div style={{ padding: "8px 18px 16px" }}>
          <div onClick={() => setWizardStep(3)} style={{ background: C.coral, color: C.white, fontSize: 15, fontWeight: 500, padding: "15px", borderRadius: 14, textAlign: "center", cursor: "pointer" }}>Continue</div>
        </div>
      </div>
    );

    // STEP 3 · DAYS / SPOT EDITOR (matching Image 12 C - populated state)
    if (wizardStep === 3) return (
      <div>
        <StepHeader/>
        <div style={{ padding: "0 18px 16px" }}>
          <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500, marginBottom: 8 }}>Build your days</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>Add spots to each day. Your notes are what travellers pay for.</div>

          {/* Day chips */}
          <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
            <div style={{ background: C.ink, color: C.surface, fontSize: 11, fontWeight: 500, padding: "7px 13px", borderRadius: 99 }}>Day 1</div>
            <div style={{ background: C.white, color: C.ink, border: `0.5px solid ${C.border}`, fontSize: 11, fontWeight: 500, padding: "7px 13px", borderRadius: 99 }}>Day 2</div>
            <div style={{ background: C.white, color: C.softInk, border: `0.5px dashed ${C.line}`, fontSize: 11, fontWeight: 500, padding: "7px 13px", borderRadius: 99 }}>+ Day</div>
          </div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>DAY TITLE</div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 13px", fontSize: 13, marginBottom: 14 }}>Manali → Jibhi</div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 6 }}>SHORT DESCRIPTION</div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 10, padding: "11px 13px", fontSize: 12, color: C.muted, marginBottom: 18 }}>Winding road through Kullu valley · 3 spots</div>

          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
            <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>SPOTS · 3 ADDED</div>
            <div style={{ fontSize: 10, color: C.softInk }}>drag to reorder</div>
          </div>

          {/* Spot 1 */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.ink, color: C.surface, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>1</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Naggar Castle</div><div style={{ fontSize: 10, color: C.muted }}>Heritage · 45 min</div></div>
              <div style={{ fontSize: 16, color: C.softInk }}>⋯</div>
            </div>
            <div style={{ background: C.sunken, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>YOUR NOTE</div>
              <div style={{ fontFamily: F.display, fontSize: 12, fontStyle: "italic", color: C.ink, lineHeight: 1.5 }}>Come at 10am before the tour buses arrive. The Roerich gallery upstairs is easy to miss.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `0.5px solid ${C.sunken}` }}>
              <div style={{ width: 28, height: 16, background: C.border, borderRadius: 99, position: "relative" }}>
                <div style={{ position: "absolute", top: 1, left: 1, width: 14, height: 14, background: C.white, borderRadius: "50%" }}/>
              </div>
              <div style={{ fontSize: 11, color: C.muted }}>Overnight stop</div>
            </div>
          </div>

          {/* Spot 2 */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 10 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.ink, color: C.surface, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>2</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Jibhi Waterfall</div><div style={{ fontSize: 10, color: C.muted }}>Nature · 1 hour</div></div>
              <div style={{ fontSize: 16, color: C.softInk }}>⋯</div>
            </div>
            <div style={{ background: C.sunken, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>YOUR NOTE</div>
              <div style={{ fontFamily: F.display, fontSize: 12, fontStyle: "italic", color: C.ink, lineHeight: 1.5 }}>20-minute walk from the road. Wear grippy shoes · the last 50m is slippery.</div>
            </div>
          </div>

          {/* Spot 3 - overnight, coral highlight */}
          <div style={{ background: C.coralWash, border: `1.5px solid ${C.coral}`, borderRadius: 12, padding: "14px 16px", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 22, height: 22, borderRadius: "50%", background: C.coral, color: C.white, fontSize: 11, fontWeight: 600, display: "flex", alignItems: "center", justifyContent: "center" }}>3</div>
              <div style={{ flex: 1 }}><div style={{ fontSize: 13, fontWeight: 600 }}>Doobi Homestay</div><div style={{ fontSize: 10, color: "#8B3A22" }}>Stay · overnight</div></div>
              <div style={{ fontSize: 16, color: C.softInk }}>⋯</div>
            </div>
            <div style={{ background: C.white, borderRadius: 8, padding: "10px 12px" }}>
              <div style={{ fontSize: 9, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>YOUR NOTE</div>
              <div style={{ fontFamily: F.display, fontSize: 12, fontStyle: "italic", color: C.ink, lineHeight: 1.5 }}>Ask for Tenzin · mention my name · the apple pie is unreal.</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 10, paddingTop: 10, borderTop: `0.5px solid #F8C2B0` }}>
              <div style={{ width: 28, height: 16, background: C.coral, borderRadius: 99, position: "relative" }}>
                <div style={{ position: "absolute", top: 1, right: 1, width: 14, height: 14, background: C.white, borderRadius: "50%" }}/>
              </div>
              <div style={{ fontSize: 11, color: "#6E2412", fontWeight: 600 }}>Overnight stop</div>
            </div>
          </div>

          <div style={{ background: "transparent", border: `1.5px dashed ${C.line}`, borderRadius: 12, padding: 14, textAlign: "center", fontSize: 12, color: C.muted, fontWeight: 500, cursor: "pointer" }}>+ Add another spot</div>
        </div>
        <div style={{ display: "flex", gap: 10, padding: "8px 18px 16px" }}>
          <div style={{ flex: 1, background: C.white, border: `1px solid ${C.ink}`, color: C.ink, fontSize: 14, fontWeight: 500, padding: "13px", borderRadius: 12, textAlign: "center", cursor: "pointer" }}>Preview day</div>
          <div onClick={() => setWizardStep(4)} style={{ flex: 1, background: C.coral, color: C.white, fontSize: 14, fontWeight: 500, padding: "13px", borderRadius: 12, textAlign: "center", cursor: "pointer" }}>Day 2 →</div>
        </div>
      </div>
    );

    // STEP 4 · PRICING (matching Image 12 D)
    if (wizardStep === 4) return (
      <div>
        <StepHeader/>
        <div style={{ padding: "0 18px 20px" }}>
          <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500, marginBottom: 18 }}>How much will this cost?</div>

          {/* Free / Paid toggle */}
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: 4, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 4, marginBottom: 18 }}>
            <div style={{ padding: "11px", textAlign: "center", fontSize: 13, fontWeight: 500, color: C.muted, borderRadius: 9 }}>Free</div>
            <div style={{ padding: "11px", textAlign: "center", fontSize: 13, fontWeight: 500, background: C.ink, color: C.surface, borderRadius: 9 }}>Paid</div>
          </div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>PRICE PER TRAVELLER</div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "20px 16px", display: "flex", alignItems: "baseline", gap: 8, marginBottom: 8 }}>
            <span style={{ fontFamily: F.display, fontSize: 30, fontWeight: 500 }}>₹</span>
            <span style={{ fontFamily: F.display, fontSize: 36, fontWeight: 600, flex: 1 }}>499</span>
            <span style={{ fontSize: 11, color: C.muted }}>lifetime access</span>
          </div>
          <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5, marginBottom: 18 }}>Travellers pay once and keep lifetime access. GST (18%) is added at checkout, not to your listed price.</div>

          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>WHAT TRAVELLERS GET · AUTO-FILLED</div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "12px 16px", marginBottom: 18 }}>
            {["All 24 spots across 7 days", "Your insider notes for every spot", "Offline access", "Free updates when you add spots"].map((item, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", fontSize: 12 }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                {item}
              </div>
            ))}
          </div>

          {/* Freemium preview */}
          <div style={{ background: C.coralWash, border: `1px solid #F8C2B0`, borderRadius: 14, padding: "16px 18px", marginBottom: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#6E2412", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>FREEMIUM PREVIEW</div>
              <div style={{ width: 32, height: 18, background: C.coral, borderRadius: 99, position: "relative" }}>
                <div style={{ position: "absolute", top: 1, right: 1, width: 16, height: 16, background: C.white, borderRadius: "50%" }}/>
              </div>
            </div>
            <div style={{ fontSize: 12, color: "#4A1F12", lineHeight: 1.55, marginBottom: 6 }}>Let travellers see <strong>Day 1 (3 spots)</strong> for free. They unlock the rest after buying.</div>
            <div style={{ fontSize: 11, color: "#8B3A22", fontStyle: "italic" }}>Recommended · free previews convert 3× better than hard paywalls.</div>
          </div>
        </div>
        <div style={{ padding: "8px 18px 16px" }}>
          <div onClick={() => setWizardStep(5)} style={{ background: C.coral, color: C.white, fontSize: 15, fontWeight: 500, padding: "15px", borderRadius: 14, textAlign: "center", cursor: "pointer" }}>Review &amp; publish →</div>
        </div>
      </div>
    );

    // STEP 5 · REVIEW & PUBLISH (matching Image 13)
    if (wizardStep === 5) return (
      <div>
        <StepHeader/>
        <div style={{ padding: "0 18px 20px" }}>
          <div style={{ fontFamily: F.display, fontSize: 26, fontWeight: 500, marginBottom: 8 }}>Ready to go live?</div>
          <div style={{ fontSize: 12, color: C.muted, marginBottom: 18 }}>Here's what travellers will see.</div>

          {/* Preview card */}
          <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", marginBottom: 18 }}>
            <div style={{ position: "relative" }}>
              <div style={{ height: 130 }}><MtnCover h={130}/></div>
              <div style={{ position: "absolute", top: 10, left: 10, background: C.ink, color: C.surface, fontSize: 9, fontWeight: 700, padding: "4px 9px", borderRadius: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>PREVIEW</div>
            </div>
            <div style={{ padding: "14px 16px" }}>
              <div style={{ fontSize: 9, color: C.amber, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 4 }}>SELF-PACED ITINERARY · TRAVEL</div>
              <div style={{ fontFamily: F.display, fontSize: 18, fontWeight: 500, lineHeight: 1.2, marginBottom: 8 }}>The complete Spiti guide</div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <Avatar initials="RM" size={22} ring/>
                <div style={{ fontSize: 11, fontWeight: 500 }}>Riya Menon</div>
              </div>
              <div style={{ display: "flex", justifyContent: "space-around", paddingTop: 12, borderTop: `0.5px solid ${C.sunken}` }}>
                <div style={{ textAlign: "center" }}><div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600 }}>7</div><div style={{ fontSize: 9, color: C.softInk, fontWeight: 600 }}>DAYS</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600 }}>24</div><div style={{ fontSize: 9, color: C.softInk, fontWeight: 600 }}>SPOTS</div></div>
                <div style={{ textAlign: "center" }}><div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 600, color: C.coral }}>₹499</div><div style={{ fontSize: 9, color: C.softInk, fontWeight: 600 }}>PRICE</div></div>
              </div>
            </div>
          </div>

          {/* Ready to publish checklist */}
          <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 10 }}>READY TO PUBLISH</div>
          <div style={{ background: C.white, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 18 }}>
            {[
              ["Cover image added", true],
              ["7 days, 24 spots total", true],
              ["Notes on every spot", true],
              ["Pricing set · freemium preview on", false],
              ["KYC verified", true],
            ].map(([label, done], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, padding: "9px 0", fontSize: 12, borderBottom: i < 4 ? `0.5px solid ${C.sunken}` : "none" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={done ? C.green : C.line} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                <div style={{ color: done ? C.ink : C.muted }}>{label}</div>
              </div>
            ))}
          </div>

          {/* Confirmation checkbox */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 18 }}>
            <div style={{ width: 18, height: 18, borderRadius: 4, border: `1.5px solid ${C.line}`, flexShrink: 0, marginTop: 2 }}/>
            <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.55 }}>I confirm this is my original work and I have rights to publish every photo, note, and place I've included. I agree to the Creator Terms.</div>
          </div>
        </div>
        <div style={{ padding: "8px 18px 16px" }}>
          <div onClick={() => { showToast("Published! 🎉"); setWizardStep(0); tabNav("studio"); }} style={{ background: C.coral, color: C.white, fontSize: 15, fontWeight: 500, padding: "15px", borderRadius: 14, textAlign: "center", cursor: "pointer" }}>Publish</div>
        </div>
      </div>
    );

    return null;
  };

  // ══════════════════════════════════════════════════════════
  // SAVED TAB (Turn 4 · matching wireframe Image 16)
  // ══════════════════════════════════════════════════════════
  const Saved = () => (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "20px 18px 18px" }}>
        <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 500 }}>Saved</div>
        <div style={{ display: "flex", gap: 8 }}>
          <div style={{ width: 36, height: 36, background: C.white, border: `0.5px solid ${C.border}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          </div>
          <div onClick={() => showToast("New list created")} style={{ width: 36, height: 36, background: C.ink, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.surface} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, padding: "0 18px" }}>
        {[
          { n: "Spiti adventures", c: 5, updated: "updated 2 days ago", isList: true },
          { n: "Goa weekend", c: 3, updated: "last week", isList: true },
          { n: "Himalayan reads", c: 8, updated: "2 weeks ago", isList: false, isPosts: true },
        ].map((l, i) => (
          <div key={i} onClick={() => nav("saved_list")} style={{ cursor: "pointer" }}>
            <div style={{ position: "relative", aspectRatio: "1/1", borderRadius: 14, overflow: "hidden", background: l.isPosts ? C.sunken : C.border, marginBottom: 10 }}>
              {l.isPosts ? (
                <div style={{ padding: "20px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                  {[80,60,90,50,70,85].map((w,j) => <div key={j} style={{ width: `${w}%`, height: 4, background: C.line, borderRadius: 2 }}/>)}
                </div>
              ) : <MtnCover h={170}/>}
              <div style={{ position: "absolute", top: 10, right: 10, background: "rgba(44,40,35,0.8)", color: C.surface, fontSize: 11, fontWeight: 600, padding: "4px 9px", borderRadius: 99 }}>{l.c}</div>
            </div>
            <div style={{ fontFamily: F.display, fontSize: 17, fontWeight: 500, lineHeight: 1.2, marginBottom: 4 }}>{l.n}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{l.c} {l.isPosts ? "posts" : "trips"} · {l.updated}</div>
          </div>
        ))}
        <div onClick={() => showToast("New list created")} style={{ aspectRatio: "1/1.18", border: `1.5px dashed ${C.line}`, borderRadius: 14, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8, cursor: "pointer" }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: C.sunken, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.softInk} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div style={{ fontSize: 13, color: C.muted, fontWeight: 500 }}>New list</div>
        </div>
      </div>
    </div>
  );

  const SavedList = () => (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
        <BackBtn onClick={back}/>
        <div style={{ width: 32, height: 32, background: C.white, border: `0.5px solid ${C.border}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></svg>
        </div>
      </div>
      <div style={{ padding: "8px 18px 16px" }}>
        <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 500, lineHeight: 1.05, marginBottom: 8 }}>Spiti<br/>adventures</div>
        <div style={{ fontSize: 13, color: C.muted }}>5 trips · updated 2 days ago</div>
      </div>
      <div style={{ display: "flex", gap: 8, padding: "0 18px 14px" }}>
        <div style={{ background: C.ink, color: C.surface, fontSize: 12, fontWeight: 500, padding: "9px 15px", borderRadius: 99, display: "flex", alignItems: "center", gap: 6 }}>
          Recently added <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke={C.surface} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </div>
        <div style={{ background: C.white, color: C.ink, border: `0.5px solid ${C.border}`, fontSize: 12, fontWeight: 500, padding: "9px 15px", borderRadius: 99 }}>All types</div>
      </div>
      {[
        { type: "Scheduled trip", title: "Spiti in seven days", meta: "Riya Menon · May 15 – 21", price: "₹24,999", target: "detail_scheduled" },
        { type: "Itinerary", title: "The complete Spiti guide", meta: "Riya Menon · 24 spots", price: "₹499", target: "detail_itinerary", isItin: true },
        { type: "Post", title: "First time in Spiti · what I wish I knew", meta: "Aanya R · 6 min read", price: "Free", target: "detail_post" },
      ].map((c, i) => (
        <div key={i} onClick={() => nav(c.target)} style={{ margin: "0 18px 12px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden", cursor: "pointer" }}>
          <div style={{ position: "relative", height: 160 }}>
            {c.isItin ? <ItineraryCover h={160}/> : <MtnCover h={160}/>}
            <div style={{ position: "absolute", top: 10, left: 10, background: C.white, fontSize: 9, fontWeight: 700, padding: "4px 9px", borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.06em", color: C.ink }}>{c.type}</div>
            <div style={{ position: "absolute", top: 10, right: 10, width: 30, height: 30, background: "rgba(255,255,255,0.95)", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <svg width="13" height="13" viewBox="0 0 24 24" fill={C.coral} stroke={C.coral} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/></svg>
            </div>
          </div>
          <div style={{ padding: "14px 16px" }}>
            <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 500, lineHeight: 1.25, marginBottom: 6 }}>{c.title}</div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: 11, color: C.muted }}>{c.meta}</div>
              <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600, color: c.price === "Free" ? C.softInk : C.ink }}>{c.price}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // ── ItineraryCover helper for saved list ──

  // ══════════════════════════════════════════════════════════
  // YOU TAB (Turn 4 · matching wireframe Images 17, 18)
  // 2 states: follower (Aanya) and creator (Riya)
  // ══════════════════════════════════════════════════════════
  const YouTab = () => {
    const isCreator = youState === "creator";

    const StateSwitcher = () => (
      <div style={{ display: "flex", gap: 4, padding: "8px 16px 4px", background: C.sunken, borderBottom: `0.5px solid ${C.border}` }}>
        <div style={{ fontSize: 9, color: C.softInk, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", padding: "4px 0", marginRight: 6 }}>STATE</div>
        {[["follower", "Follower"], ["creator", "Creator"]].map(([s, l]) => (
          <div key={s} onClick={() => setYouState(s)} style={{
            background: youState === s ? C.ink : "transparent",
            color: youState === s ? C.surface : C.muted,
            fontSize: 10, fontWeight: 500, padding: "4px 10px", borderRadius: 99, cursor: "pointer"
          }}>{l}</div>
        ))}
      </div>
    );

    return (
      <div>
        <StateSwitcher/>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 18px 14px" }}>
          <div style={{ fontFamily: F.display, fontSize: 32, fontWeight: 500 }}>You</div>
          <div style={{ width: 36, height: 36, background: C.white, border: `0.5px solid ${C.border}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
          </div>
        </div>

        {/* Profile hero */}
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, padding: "0 18px 16px" }}>
          <Avatar initials={isCreator ? "RM" : "AR"} size={isCreator ? 60 : 52} ring color={isCreator ? C.coral : C.softInk}/>
          <div style={{ flex: 1, paddingTop: 4 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600 }}>{isCreator ? "Riya Menon" : "Aanya R."}</div>
              {isCreator && <svg width="14" height="14" viewBox="0 0 24 24" fill={C.green}><circle cx="12" cy="12" r="10"/><path d="M8 12l3 3 5-6" stroke={C.white} strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/></svg>}
            </div>
            {isCreator ? (
              <>
                <div style={{ fontSize: 12, color: C.coral, fontFamily: "monospace", marginTop: 2 }}>@riya_menon</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 4, lineHeight: 1.4 }}>Travel creator sharing offbeat Himalayan trips · Pune</div>
              </>
            ) : (
              <>
                <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>+91 98765 43210</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Pune, Maharashtra</div>
              </>
            )}
          </div>
          <div onClick={() => nav("profile_edit")} style={{ width: 30, height: 30, background: C.white, border: `0.5px solid ${C.border}`, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", flexShrink: 0 }}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          </div>
        </div>

        {/* Creator stats */}
        {isCreator && (
          <>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 8, padding: "0 18px 14px" }}>
              {[["432", "Followers", true], ["87", "Following"], ["4", "Published"]].map(([v, l, coral], i) => (
                <div key={i} style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "12px", textAlign: "center" }}>
                  <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 600, color: coral ? C.coral : C.ink }}>{v}</div>
                  <div style={{ fontSize: 9, color: C.muted, textTransform: "uppercase", letterSpacing: "0.06em", fontWeight: 600, marginTop: 4 }}>{l}</div>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, padding: "0 18px 18px" }}>
              <div onClick={() => showToast("Opening mini-site")} style={{ flex: 1, background: C.coral, color: C.white, fontSize: 14, fontWeight: 500, padding: "13px", borderRadius: 12, textAlign: "center", cursor: "pointer" }}>View public profile</div>
              <div style={{ width: 46, background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/></svg>
              </div>
            </div>
          </>
        )}

        {/* Aanya: profile completion nudge */}
        {!isCreator && (
          <div style={{ margin: "0 18px 18px", background: C.coralWash, border: `1px solid #F8C2B0`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
              <div style={{ fontSize: 11, color: "#6E2412", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>PROFILE · 40% COMPLETE</div>
              <div style={{ fontSize: 11, color: C.muted }}>3 left</div>
            </div>
            <div style={{ height: 4, background: C.white, borderRadius: 99, overflow: "hidden", marginBottom: 14 }}>
              <div style={{ width: "40%", height: "100%", background: C.coral }}/>
            </div>
            {[["Display name", true], ["Location", true], ["Profile photo", false], ["Short bio", false], ["Connect a social account", false]].map(([l, done], i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 10, fontSize: 12, padding: "5px 0" }}>
                {done ? <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.green} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : <div style={{ width: 14, height: 14, borderRadius: "50%", border: `1.5px solid ${C.line}` }}/>}
                <div style={{ color: done ? C.ink : C.muted }}>{l}</div>
              </div>
            ))}
            <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
              <div style={{ flex: 1, background: C.coral, color: C.white, fontSize: 13, fontWeight: 500, padding: "11px", borderRadius: 10, textAlign: "center", cursor: "pointer" }} onClick={() => nav("profile_edit")}>Complete profile</div>
              <div style={{ fontSize: 13, color: C.muted, fontWeight: 500, padding: "11px 16px", cursor: "pointer" }}>Dismiss</div>
            </div>
          </div>
        )}

        {/* Social accounts (creator only) */}
        {isCreator && (
          <div style={{ padding: "0 18px 16px" }}>
            <div style={{ fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>SOCIAL ACCOUNTS</div>
            <div style={{ background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
              <div onClick={() => nav("connected")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: `0.5px solid ${C.sunken}`, cursor: "pointer" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "#FF0000", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill={C.white}><path d="M23 12s0-3.9-.5-5.8c-.3-1-1.1-1.8-2.1-2.1C18.6 3.6 12 3.6 12 3.6s-6.6 0-8.4.5c-1 .3-1.8 1.1-2.1 2.1C1 8.1 1 12 1 12s0 3.9.5 5.8c.3 1 1.1 1.8 2.1 2.1 1.8.5 8.4.5 8.4.5s6.6 0 8.4-.5c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.8.5-5.8zM9.7 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>YouTube</div>
                    <div style={{ fontSize: 9, color: C.green, fontWeight: 700, background: C.greenBg, padding: "2px 6px", borderRadius: 4, textTransform: "uppercase" }}>CONNECTED</div>
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>@riyawanders · 12.3K subscribers</div>
                </div>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px" }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(45deg, #F09433, #E6683C, #DC2743, #CC2366, #BC1888)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.white} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 600 }}>Instagram</div>
                  <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>Add another audience signal</div>
                </div>
                <div onClick={() => showToast("Connecting Instagram...")} style={{ background: C.coral, color: C.white, fontSize: 11, fontWeight: 500, padding: "7px 14px", borderRadius: 99, cursor: "pointer" }}>Connect</div>
              </div>
            </div>
          </div>
        )}

        {/* Aanya: become a creator card */}
        {!isCreator && (
          <div style={{ margin: "0 18px 18px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "16px 18px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              <div style={{ fontSize: 14, fontWeight: 600 }}>Want to share your trips?</div>
            </div>
            <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5, marginBottom: 12 }}>Publish a post or build an itinerary. No setup needed for free content.</div>
            <div onClick={() => { setStudioState("never_created"); tabNav("studio"); }} style={{ display: "inline-block", border: `1px solid ${C.ink}`, fontSize: 12, fontWeight: 500, padding: "9px 16px", borderRadius: 10, cursor: "pointer" }}>Become a creator</div>
          </div>
        )}

        {/* MY TRIPS */}
        <div style={{ padding: "0 18px 8px", fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>MY TRIPS</div>
        <div style={{ margin: "0 18px 18px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div onClick={() => nav("bookings")} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: isCreator ? `0.5px solid ${C.sunken}` : "none", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>Bookings</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{isCreator ? "2 upcoming · 5 past" : "Nothing booked yet"}</div>
            </div>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
          {isCreator && (
            <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Following</div>
                <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>87 creators</div>
              </div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          )}
        </div>

        {/* PREFERENCES & ACCOUNT */}
        <div style={{ padding: "0 18px 8px", fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>PREFERENCES &amp; ACCOUNT</div>
        <div style={{ margin: "0 18px 18px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          {[
            { icon: "bell", l: "Notifications", v: null, target: "notifications" },
            { icon: "pin", l: "Location", v: "Pune", target: null },
            { icon: "phone", l: "Phone number", v: "+91 98765 43210", target: null },
            { icon: "mail", l: "Email", v: isCreator ? "riya@menon.in" : "Add", target: null },
            ...(isCreator ? [{ icon: "check", l: "KYC verified", v: "PAN · Aadhaar · bank verified", target: "connected", green: true }] : []),
          ].map((row, i, arr) => {
            const icons = {
              bell: "M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 0 1-3.46 0",
              pin: "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z M12 7a3 3 0 1 0 0 6 3 3 0 0 0 0-6z",
              phone: "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z",
              mail: "M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z M22 6l-10 7L2 6",
              check: "M22 11.08V12a10 10 0 1 1-5.93-9.14 M22 4 12 14.01 9 11.01",
            };
            return (
              <div key={i} onClick={() => row.target && nav(row.target)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sunken}` : "none", cursor: row.target ? "pointer" : "default" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={row.green ? C.green : C.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={icons[row.icon]}/></svg>
                <div style={{ flex: 1, fontSize: 13, fontWeight: row.green ? 600 : 500, color: row.green ? C.green : C.ink }}>{row.l}</div>
                {row.v && <div style={{ fontSize: 11, color: row.green ? C.green : C.muted, fontWeight: row.green ? 500 : 400 }}>{row.v}</div>}
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </div>
            );
          })}
        </div>

        {/* HELP & LEGAL */}
        <div style={{ padding: "0 18px 8px", fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>HELP &amp; LEGAL</div>
        <div style={{ margin: "0 18px 18px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          {[
            "Help center",
            ...(isCreator ? ["Grievance officer"] : []),
            "Terms & privacy",
            "Download my data",
          ].map((l, i, arr) => (
            <div key={i} style={{ display: "flex", alignItems: "center", padding: "13px 16px", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sunken}` : "none", cursor: "pointer" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13 }}>{l}</div>
                {l === "Grievance officer" && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>As required by IT Act 2021</div>}
              </div>
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke={C.line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
            </div>
          ))}
        </div>

        <div style={{ margin: "0 18px 8px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
          <div onClick={() => { tabNav("welcome"); setOnbStep(0); }} style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", borderBottom: `0.5px solid ${C.sunken}`, cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.ink} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
            <div style={{ fontSize: 13 }}>Sign out</div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "13px 16px", cursor: "pointer" }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={C.coral} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
            <div style={{ fontSize: 13, color: C.coral }}>Delete account</div>
          </div>
        </div>
        <div style={{ fontSize: 10, color: C.softInk, textAlign: "center", padding: "12px 0 20px" }}>v1.0.0 · build 2026.04.08</div>
      </div>
    );
  };

  // ══════════════════════════════════════════════════════════
  // SUB-SCREENS (Turn 4 · accessed from You tab)
  // ══════════════════════════════════════════════════════════

  const Notifications = () => (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
        <BackBtn onClick={back}/>
        <div style={{ fontSize: 13, fontWeight: 500 }}>Notifications</div>
      </div>
      <div style={{ padding: "8px 18px 18px" }}>
        <div style={{ fontFamily: F.display, fontSize: 24, fontWeight: 500, lineHeight: 1.15, marginBottom: 8 }}>What should we tell you about?</div>
        <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.5 }}>Choose how you'd like to hear from us for each category.</div>
      </div>
      <div style={{ padding: "0 18px 12px", display: "grid", gridTemplateColumns: "1fr 36px 36px 36px", gap: 8, alignItems: "center" }}>
        <div/>
        {["📱","💬","✉"].map((ic, i) => (
          <div key={i} style={{ fontSize: 9, color: C.softInk, fontWeight: 600, textTransform: "uppercase", textAlign: "center" }}>
            <div style={{ fontSize: 14, marginBottom: 2 }}>{ic}</div>
            {["Push","WApp","Email"][i]}
          </div>
        ))}
      </div>
      {[
        ["Bookings & trips", true, true, true],
        ["Messages from creators", true, true, false],
        ["New content from people you follow", true, false, false],
        ["Activity on your content", true, false, true],
        ["Platform updates", false, false, true],
        ["Promotions and offers", false, false, false],
      ].map(([label, push, wa, email], i) => (
        <div key={i} style={{ margin: "0 18px 8px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 36px 36px 36px", gap: 8, alignItems: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
          {[push, wa, email].map((on, j) => (
            <div key={j} style={{ width: 30, height: 18, background: on ? C.coral : C.border, borderRadius: 99, position: "relative", cursor: "pointer", justifySelf: "center" }}>
              <div style={{ position: "absolute", top: 2, [on ? "right" : "left"]: 2, width: 14, height: 14, background: C.white, borderRadius: "50%" }}/>
            </div>
          ))}
        </div>
      ))}
    </div>
  );

  const ProfileEdit = () => (
    <div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "14px 18px" }}>
        <div onClick={back} style={{ fontSize: 13, color: C.muted, cursor: "pointer" }}>Cancel</div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>Edit profile</div>
        <div onClick={() => { showToast("Profile saved"); back(); }} style={{ fontSize: 13, color: C.coral, fontWeight: 600, cursor: "pointer" }}>Save</div>
      </div>
      <div style={{ textAlign: "center", padding: "20px 0 16px" }}>
        <Avatar initials={youState === "creator" ? "RM" : "AR"} size={96} ring color={C.coral}/>
        <div onClick={() => showToast("Photo picker")} style={{ fontSize: 12, color: C.coral, fontWeight: 500, marginTop: 12, cursor: "pointer" }}>Change photo</div>
      </div>
      <div style={{ margin: "0 18px 16px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {[
          ["Display name", youState === "creator" ? "Riya Menon" : "Aanya R."],
          ["Username", youState === "creator" ? "riya_menon" : "aanya_r", "Can change once every 30 days"],
          ["Bio", youState === "creator" ? "Travel creator sharing offbeat Himalayan trips. Based in Pune." : "+ Add a bio about yourself"],
          ["Location", "Pune, Maharashtra"],
          ["Email", youState === "creator" ? "riya@menon.in" : "Add"],
        ].map(([l, v, hint], i, arr) => (
          <div key={i} style={{ padding: "13px 16px", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sunken}` : "none" }}>
            <div style={{ fontSize: 10, color: C.softInk, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 5 }}>{l}</div>
            <div style={{ fontSize: 14, color: v.startsWith("+") || v === "Add" ? C.softInk : C.ink }}>{v}</div>
            {hint && <div style={{ fontSize: 10, color: C.softInk, marginTop: 4 }}>{hint}</div>}
          </div>
        ))}
      </div>
    </div>
  );

  const Bookings = () => (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
        <BackBtn onClick={back}/>
        <div style={{ fontFamily: F.display, fontSize: 22, fontWeight: 500 }}>Bookings</div>
      </div>
      <div style={{ display: "flex", gap: 6, padding: "8px 18px 16px", overflowX: "auto" }}>
        {[["Upcoming · 2", true], ["Past · 5"], ["Cancelled · 1"]].map(([l, active], i) => (
          <div key={i} style={{ background: active ? C.ink : C.white, color: active ? C.surface : C.ink, border: active ? "none" : `0.5px solid ${C.border}`, fontSize: 11, fontWeight: 500, padding: "8px 14px", borderRadius: 99, flexShrink: 0, cursor: "pointer" }}>{l}</div>
        ))}
      </div>
      {[
        { title: "Spiti in seven days", meta: "May 15 – 21 · Riya Menon", status: "Departing in 5 days", urgent: true, price: "₹47,200", id: "BK-2026-18K7Q" },
        { title: "Sunrise trek at Sinhagad", meta: "Sat 12 May · Aarti Gokhale", status: "Confirmed", price: "₹500", id: "BK-2026-18J4P" },
      ].map((b, i) => (
        <div key={i} onClick={() => nav("detail_scheduled")} style={{ margin: "0 18px 12px", background: C.white, border: b.urgent ? `1.5px solid ${C.coral}` : `0.5px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontFamily: F.display, fontSize: 16, fontWeight: 500, lineHeight: 1.2 }}>{b.title}</div>
              <div style={{ fontSize: 11, color: C.muted, marginTop: 4 }}>{b.meta}</div>
            </div>
            <div style={{ fontSize: 9, fontWeight: 700, padding: "4px 9px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.05em", color: b.urgent ? C.white : C.green, background: b.urgent ? C.coral : C.greenBg }}>{b.status}</div>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, borderTop: `0.5px solid ${C.sunken}` }}>
            <div style={{ fontSize: 9, color: C.softInk, fontFamily: "monospace", letterSpacing: "0.05em" }}>{b.id}</div>
            <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 600 }}>{b.price}</div>
          </div>
        </div>
      ))}

      <div style={{ padding: "20px 18px 8px", fontSize: 10, color: C.softInk, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>YOUR LIBRARY</div>
      <div style={{ fontSize: 11, color: C.muted, padding: "0 18px 12px" }}>Self-paced guides you've purchased</div>
      <div onClick={() => nav("detail_itinerary")} style={{ margin: "0 18px 12px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, padding: "12px 14px", display: "flex", gap: 12, alignItems: "center", cursor: "pointer" }}>
        <div style={{ width: 56, height: 56, borderRadius: 10, overflow: "hidden", flexShrink: 0 }}><ItineraryCover h={56}/></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: F.display, fontSize: 14, fontWeight: 500 }}>The complete Spiti guide</div>
          <div style={{ fontSize: 11, color: C.muted, marginTop: 3 }}>Riya Menon · 24 spots · lifetime access</div>
        </div>
        <div style={{ fontSize: 11, color: C.coral, fontWeight: 600 }}>Open →</div>
      </div>
    </div>
  );

  const Connected = () => (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 18px" }}>
        <BackBtn onClick={back}/>
        <div style={{ fontSize: 13, fontWeight: 500 }}>YouTube</div>
      </div>
      <div style={{ margin: "8px 18px 18px", background: C.sunken, borderRadius: 18, padding: "22px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 18 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: "#FF0000", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill={C.white}><path d="M23 12s0-3.9-.5-5.8c-.3-1-1.1-1.8-2.1-2.1C18.6 3.6 12 3.6 12 3.6s-6.6 0-8.4.5c-1 .3-1.8 1.1-2.1 2.1C1 8.1 1 12 1 12s0 3.9.5 5.8c.3 1 1.1 1.8 2.1 2.1 1.8.5 8.4.5 8.4.5s6.6 0 8.4-.5c1-.3 1.8-1.1 2.1-2.1.5-1.9.5-5.8.5-5.8zM9.7 15.6V8.4l6.2 3.6-6.2 3.6z"/></svg>
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontFamily: F.display, fontSize: 20, fontWeight: 600 }}>Riya Wanders</div>
            <div style={{ fontSize: 12, color: C.muted, fontFamily: "monospace", marginTop: 3 }}>@riyawanders</div>
          </div>
          <div style={{ fontSize: 9, fontWeight: 700, padding: "4px 9px", borderRadius: 99, textTransform: "uppercase", letterSpacing: "0.05em", color: C.green, background: C.greenBg }}>Connected</div>
        </div>
        <div style={{ borderTop: `0.5px solid ${C.border}`, paddingTop: 18 }}>
          <div style={{ fontSize: 10, color: C.muted, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", marginBottom: 8 }}>SUBSCRIBERS</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 14 }}>
            <div style={{ fontFamily: F.display, fontSize: 42, fontWeight: 600, color: C.coral, lineHeight: 1 }}>12,340</div>
            <div style={{ fontSize: 11, color: C.green, fontWeight: 600 }}>↑ +127 this week</div>
          </div>
        </div>
      </div>
      <div style={{ margin: "0 18px 16px", background: C.white, border: `0.5px solid ${C.border}`, borderRadius: 14, overflow: "hidden" }}>
        {[["Last synced", "2 hours ago"], ["Profile photo", "No change"], ["Connected since", "28 Mar 2026"]].map(([l, v], i, arr) => (
          <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "13px 16px", borderBottom: i < arr.length - 1 ? `0.5px solid ${C.sunken}` : "none" }}>
            <div style={{ fontSize: 12, color: C.muted }}>{l}</div>
            <div style={{ fontSize: 12, fontWeight: 500 }}>{v}</div>
          </div>
        ))}
      </div>
      <div onClick={() => { showToast("Disconnected"); back(); }} style={{ margin: "0 18px 20px", padding: "13px", border: `1px solid ${C.coral}`, color: C.coral, fontSize: 13, fontWeight: 500, borderRadius: 12, textAlign: "center", cursor: "pointer" }}>Disconnect YouTube</div>
    </div>
  );

  // ── ROUTER ──
  const screens = {
    welcome: <Onboarding/>,
    home: <HomeFeed/>,
    discover: <Discover/>,
    detail_scheduled: <Detail type="detail_scheduled"/>,
    detail_event: <Detail type="detail_event"/>,
    detail_post: <Detail type="detail_post"/>,
    detail_itinerary: <Detail type="detail_itinerary"/>,
    booking: <Booking/>,
    studio: <Studio/>,
    wizard: <Wizard/>,
    saved: <Saved/>,
    saved_list: <SavedList/>,
    you: <YouTab/>,
    notifications: <Notifications/>,
    profile_edit: <ProfileEdit/>,
    bookings: <Bookings/>,
    connected: <Connected/>,
  };

  const showTab = !["welcome", "booking", "wizard", "notifications", "profile_edit", "bookings", "connected", "saved_list"].includes(screen) && !screen.startsWith("detail");

  return (
    <div style={{ fontFamily: F.body, background: "#E5E0D7", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", padding: "16px 16px 24px" }}>
      <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet"/>

      <div style={{ fontSize: 12, color: C.muted, textAlign: "center", marginBottom: 10, lineHeight: 1.5 }}>
        <span style={{ fontFamily: F.display, fontSize: 15, fontWeight: 600, color: C.ink }}>&lt;AppName&gt;</span> · Prototype · Turn 4 of 4 · Final
      </div>

      <div style={{ width: "100%", maxWidth: 390 }}>
        <div style={{ background: C.ink, padding: "6px 6px 3px", borderRadius: "26px 26px 6px 6px" }}>
          <div style={{ background: C.surface, borderRadius: "21px 21px 0 0", overflow: "hidden", minHeight: 780, display: "flex", flexDirection: "column" }}>
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {screens[screen] || <HomeFeed/>}
            </div>
            {showTab && <TabBar/>}
          </div>
        </div>
      </div>

      <Toast message={toast} visible={!!toast}/>
    </div>
  );
}
