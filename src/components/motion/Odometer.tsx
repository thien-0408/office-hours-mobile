import { useEffect, type ComponentType, type ReactElement } from 'react';
import {
  StyleSheet,
  Text,
  View,
  type TextStyle,
  type ViewProps,
} from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import MaskedViewNative from '@react-native-masked-view/masked-view';
import { LinearGradient } from 'expo-linear-gradient';
import { springs, text } from '../../theme';

export type OdometerFormat = 'int' | 'mm:ss';
export type OdometerToken =
  | { kind: 'digit'; digit: number; key: string }
  | { kind: 'sep'; char: string; key: string };

// Package types are a legacy class component; widen to a JSX-safe type.
const MaskedView = MaskedViewNative as unknown as ComponentType<
  ViewProps & { maskElement: ReactElement }
>;
const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
const LINE = 1.2; // reel row height, in em
const DIGIT_W = 0.62; // column width, in em
const SPRING = { ...springs.sheet, damping: springs.sheet.damping * 0.7 };

/**
 * Splits a value into odometer columns. Keys count from the right so a
 * column keeps its identity (and animates) when the number grows.
 */
export function splitOdometer(
  value: number,
  format: OdometerFormat = 'int',
): OdometerToken[] {
  const v = Math.max(0, Math.floor(Number.isFinite(value) ? value : 0));
  let chars: string[];
  if (format === 'mm:ss') {
    const m = String(Math.floor(v / 60)).padStart(2, '0');
    const s = String(v % 60).padStart(2, '0');
    chars = [...m, ':', ...s];
  } else {
    chars = [...String(v)];
  }
  return chars.map((c, i) => {
    const key = `r${chars.length - 1 - i}`;
    return c === ':'
      ? { kind: 'sep', char: c, key }
      : { kind: 'digit', digit: Number(c), key };
  });
}

function Reel({
  digit,
  height,
  width,
  textStyle,
}: {
  digit: number;
  height: number;
  width: number;
  textStyle: TextStyle;
}) {
  const y = useSharedValue(-digit * height);
  useEffect(() => {
    y.value = withSpring(-digit * height, SPRING);
  }, [digit, height, y]);
  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: y.value }],
  }));
  return (
    <View style={[styles.reel, { width, height }]}>
      <Animated.View style={style}>
        {DIGITS.map(d => (
          <Text
            key={d}
            style={[textStyle, styles.digit, { height, lineHeight: height }]}
          >
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

export type OdometerProps = {
  value: number;
  format?: OdometerFormat;
  style?: TextStyle;
};

/** Mechanical counter: every digit is a 0-9 reel that springs to its value. */
export function Odometer({ value, format = 'int', style }: OdometerProps) {
  const textStyle = { ...text.hero, ...style } as TextStyle;
  const fontSize = textStyle.fontSize ?? 34;
  const height = Math.round(fontSize * LINE);
  const width = Math.round(fontSize * DIGIT_W);
  const tokens = splitOdometer(value, format);
  const label =
    format === 'mm:ss'
      ? tokens.map(t => (t.kind === 'sep' ? ':' : t.digit)).join('')
      : String(Math.max(0, Math.floor(value)));

  return (
    <MaskedView
      accessible
      accessibilityLabel={label}
      style={{ height }}
      maskElement={
        <LinearGradient
          colors={['transparent', '#000', '#000', 'transparent']}
          locations={[0, 0.28, 0.72, 1]}
          style={StyleSheet.absoluteFill}
        />
      }
    >
      <View style={[styles.row, { height }]}>
        {tokens.map(t =>
          t.kind === 'digit' ? (
            <Reel
              key={t.key}
              digit={t.digit}
              height={height}
              width={width}
              textStyle={textStyle}
            />
          ) : (
            <Text
              key={t.key}
              style={[textStyle, styles.digit, { height, lineHeight: height }]}
            >
              {t.char}
            </Text>
          ),
        )}
      </View>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  reel: { overflow: 'hidden' },
  row: { flexDirection: 'row', alignSelf: 'flex-start' },
  digit: { textAlign: 'center', fontVariant: ['tabular-nums'] },
});
