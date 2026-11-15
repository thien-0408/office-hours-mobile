/**
 * Theme tokens for OfficeHours Mobile
 * Translated from CSS mock (docs/mockups-mochy/mochy.css) and STYLE-MOCHY.md (§6, §8)
 */

export const colors = {
  bg: '#000000',
  s1: '#0d0d0d',
  s2: '#161616',
  s3: '#1f1f1f',
  s4: '#2a2a2a',
  fg: '#ffffff',
  fg2: 'rgba(255,255,255,0.62)',
  fg3: 'rgba(255,255,255,0.38)',
  fg4: 'rgba(255,255,255,0.16)',
  line: 'rgba(255,255,255,0.07)',
  line2: 'rgba(255,255,255,0.14)',
  focus: 'rgba(255,255,255,0.34)',
  primary: '#e0e0e0',
  onPrimary: '#000000',
  err: '#ff8a80',
  ok: '#9be7b4',
} as const;

export const glass = {
  tint: 'rgba(19,19,19,0.78)',
  outline: 'rgba(255,255,255,0.05)',
  highlight: 'rgba(255,255,255,0.10)',
  solid: 'rgba(19,19,19,0.94)',
  blurHigh: 24,
  blurLow: 12,
  shadow: '0px 2px 6px 2px rgba(0,0,0,0.12)',
} as const;

export const glow = {
  brand: { color: '#3465e0', opacity: 0.34 },
  indigo: { color: '#4b47a0', opacity: 0.42 },
  teal: { color: '#2f6b52', opacity: 0.34 },
  wine: { color: '#7a3349', opacity: 0.34 },
} as const;

export const tintPairs = [
  ['#2D2B55', '#151521'],
  ['#1B382D', '#0F1F17'],
  ['#381B24', '#1F0F15'],
  ['#1B2838', '#0F1521'],
] as const;

export const radius = {
  sm: 12,
  md: 14,
  lg: 18,
  card: 20,
  sheet: 26,
  pill: 999,
} as const;

export const size = {
  button: 54,
  buttonQuiet: 44,
  field: 58,
  iconButton: 40,
  avatar: 40,
  listRow: 66,
  rowImage: 48,
  navBar: 64,
  topNav: 52,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  gutter: 22,
} as const;

export const iconOpacity = {
  active: 1,
  normal: 0.62,
  muted: 0.38,
} as const;

export const spring = (ratio: number, stiffness: number, mass = 1) => ({
  damping: ratio * 2 * Math.sqrt(stiffness * mass),
  stiffness,
  mass,
});

export const springs = {
  /** Finger down: quick, no bounce. */
  press: spring(1.0, 520),
  /** Finger up: ~4% overshoot, only on press release. */
  release: spring(0.72, 320),
  /** Active-tab pill glide: soft, no bounce. */
  indicator: spring(0.92, 280),
  /** Sheets, odometer, layout: Apple-like, settles in ~400 ms. */
  sheet: spring(1.0, 240),
  bouncy: spring(0.4, 900),
} as const;

export const press3D = {
  maxTilt: 4,
  pressedScale: 0.97,
  pressedOpacity: 0.9,
} as const;

/** Timings (ms) and distances shared by transitions and entering animations. */
export const motion = {
  /** Stack push/pop. */
  screen: 320,
  /** Modal-like screens (fade_from_bottom). */
  modal: 300,
  /** Tab crossfade. */
  tabFade: 180,
  /** Reveal: stagger per index, duration, rise distance (dp). */
  stagger: 35,
  revealDuration: 420,
  revealOffsetY: 10,
  /** Skeleton -> content crossfade. */
  contentFade: 220,
} as const;

export type Colors = typeof colors;
export type ColorName = keyof typeof colors;
export type Glass = typeof glass;
export type Glow = typeof glow;
export type TintPairs = typeof tintPairs;
export type Radius = typeof radius;
export type Size = typeof size;
export type Space = typeof space;
export type IconOpacity = typeof iconOpacity;
export type Springs = typeof springs;
export type Press3D = typeof press3D;
export type Motion = typeof motion;
