// ---------------------------------------------------------------------------
// Design tokens: a warm Louisiana / Mardi Gras palette used as tasteful
// accents (purple, green, gold) over cream/ink neutrals — not loud fills.
// ---------------------------------------------------------------------------

export const palette = {
  purple: '#5B3A8C',
  purpleSoft: '#7B5AAD',
  green: '#2E7D4F',
  gold: '#C99A2E',
  goldSoft: '#E7C25B',
};

export const lightColors = {
  mode: 'light',

  background: '#FBF7F0', // warm cream
  surface: '#FFFFFF',
  card: '#FFFFFF',
  elevated: '#FFFFFF',

  text: '#2A2333',
  textMuted: '#6E6578',
  textFaint: '#9A93A3',
  inverseText: '#FFFFFF',

  border: '#ECE4D7',
  divider: '#F1EBE0',
  inputBg: '#F7F2EA',

  primary: palette.purple,
  primarySoft: '#EFE8F6',
  onPrimary: '#FFFFFF',

  green: palette.green,
  greenSoft: '#E4F1E9',

  gold: palette.gold,
  goldSoft: '#FBF1D8',

  danger: '#B3261E',
  dangerSoft: '#F9E4E2',

  star: palette.gold,
  starEmpty: '#E4DBCB',

  overlay: 'rgba(24, 21, 33, 0.45)',
  shadow: '#000000',
};

export const darkColors = {
  mode: 'dark',

  background: '#171320',
  surface: '#201B2B',
  card: '#252030',
  elevated: '#2C2638',

  text: '#F3EEF7',
  textMuted: '#B4ABC1',
  textFaint: '#8A8098',
  inverseText: '#1A1622',

  border: '#332B42',
  divider: '#2B2438',
  inputBg: '#2A2436',

  primary: '#A585D6',
  primarySoft: '#2E2540',
  onPrimary: '#1A1030',

  green: '#59BE86',
  greenSoft: '#223A2C',

  gold: '#E4BE58',
  goldSoft: '#3A3120',

  danger: '#F2938C',
  dangerSoft: '#3A2422',

  star: '#E4BE58',
  starEmpty: '#453B54',

  overlay: 'rgba(0, 0, 0, 0.6)',
  shadow: '#000000',
};

// Spacing scale (4pt-ish grid).
export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  xl: 26,
  pill: 999,
};

// Typographic scale with real hierarchy.
export const typography = {
  display: { fontSize: 30, fontWeight: '800', letterSpacing: 0.2 },
  title: { fontSize: 23, fontWeight: '800', letterSpacing: 0.2 },
  heading: { fontSize: 18, fontWeight: '700' },
  subheading: { fontSize: 15, fontWeight: '700', letterSpacing: 0.3 },
  body: { fontSize: 15, fontWeight: '500' },
  bodyStrong: { fontSize: 15, fontWeight: '700' },
  small: { fontSize: 13, fontWeight: '500' },
  caption: { fontSize: 12, fontWeight: '600', letterSpacing: 0.3 },
};
