/**
 * Typography tokens for OfficeHours Mobile
 * Uses Inter font family names from @expo-google-fonts/inter
 * Styles mapped from docs/mockups-mochy/mochy.css and STYLE-MOCHY.md
 */

import type { TextStyle } from 'react-native';
import { colors } from './tokens';

export const fonts = {
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
} as const;

export const ls = (fontSize: number, em: number): number => fontSize * em;

export const tracking = {
  display: -0.04,
  title: -0.03,
  body: 0,
} as const;

const round1 = (val: number): number => Math.round(val * 10) / 10;

export const text = {
  hero: {
    fontSize: 34,
    lineHeight: round1(34 * 1.04), // 35.4
    letterSpacing: ls(34, -0.055), // -1.87
    fontFamily: fonts.bold,
    color: colors.fg,
  },
  t1: {
    fontSize: 30,
    lineHeight: round1(30 * 1.1), // 33
    letterSpacing: ls(30, -0.05), // -1.5
    fontFamily: fonts.bold,
    color: colors.fg,
  },
  t2: {
    fontSize: 20,
    lineHeight: round1(20 * 1.2), // 24
    letterSpacing: ls(20, -0.04), // -0.8
    fontFamily: fonts.semibold,
    color: colors.fg,
  },
  t3: {
    fontSize: 15,
    lineHeight: round1(15 * 1.35), // 20.3
    letterSpacing: ls(15, -0.025), // -0.375
    fontFamily: fonts.semibold,
    color: colors.fg,
  },
  sub: {
    fontSize: 14.5,
    lineHeight: round1(14.5 * 1.5), // 21.8
    letterSpacing: ls(14.5, -0.012), // -0.174
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  sm: {
    fontSize: 13,
    lineHeight: round1(13 * 1.45), // 18.9
    letterSpacing: ls(13, -0.01), // -0.13
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  xs: {
    fontSize: 11.5,
    letterSpacing: 0,
    fontFamily: fonts.medium,
    color: colors.fg3,
  },
  eyebrow: {
    fontSize: 12,
    letterSpacing: ls(12, -0.01), // -0.12
    fontFamily: fonts.semibold,
    color: colors.fg2,
  },
  button: {
    fontSize: 15.5,
    letterSpacing: ls(15.5, -0.03), // -0.465
    fontFamily: fonts.bold,
    color: colors.fg,
  },
  fieldLabel: {
    fontSize: 11.5,
    letterSpacing: ls(11.5, -0.005), // -0.0575
    fontFamily: fonts.semibold,
    color: colors.fg3,
  },
  fieldValue: {
    fontSize: 15.5,
    letterSpacing: ls(15.5, -0.02), // -0.31
    fontFamily: fonts.semibold,
    color: colors.fg,
  },
} as const satisfies Record<string, TextStyle>;

export type Fonts = typeof fonts;
export type TextVariants = typeof text;
export type TextVariant = keyof typeof text;
