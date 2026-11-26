import { PixelRatio, Platform } from 'react-native';

export const colors = {
  // Nền và bề mặt: đen, tách lớp bằng độ sáng
  bg: '#000000',
  s1: '#0D0D0D', // Thẻ (card)
  s2: '#161616', // Ô nhập (input)
  s3: '#1F1F1F', // Avatar, nút tròn
  s4: '#2A2A2A', // Switch tắt, nút disabled

  // Chữ và icon đơn sắc: trắng ở 3 mức + mức phụ
  fg: '#FFFFFF',
  fg2: 'rgba(255, 255, 255, 0.62)',
  fg3: 'rgba(255, 255, 255, 0.38)',
  fg4: 'rgba(255, 255, 255, 0.16)',

  // Đường viền
  line: 'rgba(255, 255, 255, 0.07)',
  line2: 'rgba(255, 255, 255, 0.14)',
  focus: 'rgba(255, 255, 255, 0.34)',

  // Nút chính
  primary: '#E0E0E0',
  onPrimary: '#000000',

  // Kính mờ (FrostedGlass.kt)
  glass: 'rgba(19, 19, 19, 0.78)',
  glassSolid: 'rgba(19, 19, 19, 0.94)',
  glassLine: 'rgba(255, 255, 255, 0.05)',
  glassHi: 'rgba(255, 255, 255, 0.10)',

  // Quầng sáng nền
  tintBrand: '#3465E0',
  tintIndigo: '#4B47A0',
  tintTeal: '#2F6B52',
  tintWine: '#7A3349',

  // Báo lỗi (màu duy nhất ngoài đen/trắng/quầng sáng)
  err: '#FF8A80',
  errBorder: 'rgba(255, 138, 128, 0.45)',
} as const;

export type GlowTone = 'brand' | 'indigo' | 'teal' | 'wine';

export const glowConfigs: Record<GlowTone, { color: string; opacity: number }> =
  {
    brand: { color: colors.tintBrand, opacity: 0.34 },
    indigo: { color: colors.tintIndigo, opacity: 0.42 },
    teal: { color: colors.tintTeal, opacity: 0.34 },
    wine: { color: colors.tintWine, opacity: 0.34 },
  };

export const radius = {
  xs: 8,
  sm: 12,
  md: 14,
  lg: 18,
  card: 20,
  toast: 22,
  sheet: 26,
  pill: 999,
} as const;

// Helper hỗ trợ bo góc squircle trên iOS
export const squircle = (r: number) => ({
  borderRadius: r,
  ...(Platform.OS === 'ios' ? { borderCurve: 'continuous' as const } : {}),
});

// Viền vật lý 2px cho kính (FrostedGlass.kt)
export const glassHairline = 2 / PixelRatio.get();

// Font Inter (tải qua @expo-google-fonts/inter)
export const fontFamily = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semiBold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
} as const;

// Quy đổi letterSpacing từ em sang pt trong RN
export const ls = (fontSize: number, em: number) => fontSize * em;

export const typography = {
  hero: {
    fontFamily: fontFamily.bold,
    fontSize: 34,
    lineHeight: 35.4,
    letterSpacing: ls(34, -0.055),
    color: colors.fg,
  },
  h1: {
    fontFamily: fontFamily.bold,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: ls(30, -0.05),
    color: colors.fg,
  },
  h2: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    lineHeight: 24,
    letterSpacing: ls(20, -0.04),
    color: colors.fg,
  },
  h3: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    lineHeight: 20.25,
    letterSpacing: ls(15, -0.025),
    color: colors.fg,
  },
  sub: {
    fontFamily: fontFamily.medium,
    fontSize: 14.5,
    lineHeight: 21.75,
    letterSpacing: ls(14.5, -0.012),
    color: colors.fg2,
  },
  body: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15.5,
    lineHeight: 21,
    letterSpacing: ls(15.5, -0.02),
    color: colors.fg,
  },
  sm: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 18.85,
    letterSpacing: ls(13, -0.01),
    color: colors.fg2,
  },
  xs: {
    fontFamily: fontFamily.medium,
    fontSize: 11.5,
    lineHeight: 15,
    letterSpacing: 0,
    color: colors.fg3,
  },
  eyebrow: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: ls(12, -0.01),
    color: colors.fg2,
  },
} as const;

// Reanimated Spring configs (đã quy đổi từ dampingRatio của Compose)
const spring = (ratio: number, stiffness: number, mass = 1) => ({
  damping: ratio * 2 * Math.sqrt(stiffness * mass),
  stiffness,
  mass,
});

export const springs = {
  press: spring(1.0, 420),
  indicator: spring(0.82, 700),
  sheet: spring(1.0, 400),
  bouncy: spring(0.4, 900),
} as const;

export const press3DConfig = {
  maxTilt: 4,
  pressedScale: 0.97,
} as const;
