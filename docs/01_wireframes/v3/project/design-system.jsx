// CreatorHub design tokens — pure-white direction, coral-only accent per SRS C-17.
// Coral #E15A41 is the sole decorative accent; semantic colors only on functional states.

const CH_THEMES = {
  paper: {
    name: 'Paper White',
    subtitle: 'SRS-default · pure white + coral',
    bg: '#F7F7F5',           // app chrome / behind cards
    surface: '#FFFFFF',       // cards, sheets
    surfaceAlt: '#F2F1EE',    // sunken rows, toolbars
    surfaceSunk: '#ECEAE5',   // info blocks
    ink: '#16161A',           // body / primary text
    inkSoft: '#3A3A40',       // secondary
    inkMuted: '#7A7A82',      // meta
    inkFaint: '#B4B4BA',      // disabled, hairline emphasis
    hairline: '#E8E6E1',      // borders
    hairlineStrong: '#D8D5CE',
    primary: '#E15A41',       // SRS coral
    primaryDeep: '#B9401E',
    primaryTint: '#FCEBE6',   // 10% coral wash — backgrounds only, never text
    success: '#1D9E75',
    warning: '#BA7517',
    danger: '#C2362F',
    info: '#185FA5',
  },
  snow: {
    name: 'Snow',
    subtitle: 'cooler whites, slightly techy',
    bg: '#F5F7FA',
    surface: '#FFFFFF',
    surfaceAlt: '#EEF0F4',
    surfaceSunk: '#E5E8EE',
    ink: '#0E1116',
    inkSoft: '#353A44',
    inkMuted: '#6E7683',
    inkFaint: '#AAB0BB',
    hairline: '#E1E4EA',
    hairlineStrong: '#CED3DB',
    primary: '#E15A41',
    primaryDeep: '#B9401E',
    primaryTint: '#FCEBE6',
    success: '#1D9E75',
    warning: '#BA7517',
    danger: '#C2362F',
    info: '#185FA5',
  },
  bone: {
    name: 'Bone',
    subtitle: 'warmer off-white, paper feel',
    bg: '#F4F1EA',
    surface: '#FBF9F4',
    surfaceAlt: '#EFEBE1',
    surfaceSunk: '#E7E2D5',
    ink: '#1C1A14',
    inkSoft: '#3E3A30',
    inkMuted: '#7B7565',
    inkFaint: '#B2AC9C',
    hairline: '#E2DCCB',
    hairlineStrong: '#CFC7B2',
    primary: '#E15A41',
    primaryDeep: '#B9401E',
    primaryTint: '#FAE6DF',
    success: '#1D9E75',
    warning: '#BA7517',
    danger: '#C2362F',
    info: '#185FA5',
  },
  ink: {
    name: 'Ink Night',
    subtitle: 'dark counterpart · coral stays',
    bg: '#0E0F12',
    surface: '#17181C',
    surfaceAlt: '#202126',
    surfaceSunk: '#2A2B31',
    ink: '#F5F4F0',
    inkSoft: '#C8C6C0',
    inkMuted: '#8A8880',
    inkFaint: '#56544E',
    hairline: '#2E2F36',
    hairlineStrong: '#3D3E46',
    primary: '#E85A41',
    primaryDeep: '#FF8164',
    primaryTint: '#2A1A16',
    success: '#55C79A',
    warning: '#D99B3A',
    danger: '#E46760',
    info: '#5FA4E5',
  },
};

const CH_TYPE_PAIRS = {
  editorial: {
    name: 'Editorial',
    subtitle: 'Fraunces display + Geist UI',
    display: '"Fraunces", "Fraunces Fallback", Georgia, serif',
    body: '"Geist", -apple-system, "Segoe UI", sans-serif',
    mono: '"Geist Mono", "JetBrains Mono", monospace',
    displayWeight: 500,
    displayWeightBold: 600,
    bodyWeight: 400,
    displayTrack: '-0.02em',
    displayOpsz: 96,
  },
  srs: {
    name: 'SRS-locked',
    subtitle: 'Fraunces + Inter (SRS C-18)',
    display: '"Fraunces", Georgia, serif',
    body: '"Inter", -apple-system, "Segoe UI", sans-serif',
    mono: '"JetBrains Mono", monospace',
    displayWeight: 500,
    displayWeightBold: 600,
    bodyWeight: 400,
    displayTrack: '-0.018em',
    displayOpsz: 96,
  },
  sans: {
    name: 'Sans-first',
    subtitle: 'Geist everywhere',
    display: '"Geist", -apple-system, sans-serif',
    body: '"Geist", -apple-system, sans-serif',
    mono: '"Geist Mono", monospace',
    displayWeight: 600,
    displayWeightBold: 700,
    bodyWeight: 400,
    displayTrack: '-0.035em',
    displayOpsz: null,
  },
};

const CH_CORAL_HUES = {
  coral: { name: 'Coral', value: '#E15A41', deep: '#B9401E', tint: '#FCEBE6' },
  terracotta: { name: 'Terracotta', value: '#C9502A', deep: '#933410', tint: '#F7E4DA' },
  saffron: { name: 'Saffron', value: '#D97B1A', deep: '#9C5608', tint: '#FBECD3' },
};

const CH_RADII = {
  sharp: { sm: 2, md: 4, lg: 8, xl: 12, pill: 999 },
  soft:  { sm: 4, md: 8, lg: 12, xl: 16, pill: 999 },
  round: { sm: 6, md: 12, lg: 18, xl: 24, pill: 999 },
};

const CH_DENSITIES = {
  compact: { gap: 8, padBlock: 12, padInline: 14, fontBase: 13, lineBase: 1.45 },
  cozy:    { gap: 12, padBlock: 16, padInline: 16, fontBase: 14, lineBase: 1.5 },
  spacious:{ gap: 16, padBlock: 20, padInline: 20, fontBase: 15, lineBase: 1.55 },
};

const CH_DEFAULTS = /*EDITMODE-BEGIN*/{
  "theme": "paper",
  "typePair": "editorial",
  "coralHue": "coral",
  "radius": "soft",
  "density": "cozy",
  "gamification": "hidden"
}/*EDITMODE-END*/;

// Resolve a theme + overrides into a flat token bag
function resolveTokens(cfg) {
  const theme = CH_THEMES[cfg.theme] || CH_THEMES.paper;
  const typ = CH_TYPE_PAIRS[cfg.typePair] || CH_TYPE_PAIRS.editorial;
  const coral = CH_CORAL_HUES[cfg.coralHue] || CH_CORAL_HUES.coral;
  const radius = CH_RADII[cfg.radius] || CH_RADII.soft;
  const density = CH_DENSITIES[cfg.density] || CH_DENSITIES.cozy;
  // Override primary with the chosen hue (except in ink mode, which keeps its tuned coral)
  const t = { ...theme };
  if (cfg.theme !== 'ink') {
    t.primary = coral.value;
    t.primaryDeep = coral.deep;
    t.primaryTint = coral.tint;
  }
  return { t, typ, radius, density, gamification: cfg.gamification, theme: cfg.theme };
}

Object.assign(window, {
  CH_THEMES, CH_TYPE_PAIRS, CH_CORAL_HUES, CH_RADII, CH_DENSITIES, CH_DEFAULTS,
  resolveTokens,
});
