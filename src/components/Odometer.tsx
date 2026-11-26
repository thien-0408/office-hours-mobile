import React, { useEffect } from 'react';
import { StyleSheet, Text, TextStyle, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, fontFamily } from '../theme/tokens';

const DIGITS = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];

function DigitReel({
  digit,
  height,
  textStyle,
}: {
  digit: number;
  height: number;
  textStyle?: TextStyle;
}) {
  const reducedMotion = useReducedMotion();
  const translateY = useSharedValue(-digit * height);

  useEffect(() => {
    if (reducedMotion) {
      translateY.value = -digit * height;
    } else {
      translateY.value = withTiming(-digit * height, {
        duration: 450,
        easing: Easing.out(Easing.back(1.15)),
      });
    }
  }, [digit, height, reducedMotion, translateY]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <View style={{ height, width: 10, overflow: 'hidden' }}>
      <Animated.View style={animStyle}>
        {DIGITS.map((d) => (
          <Text
            key={d}
            style={[styles.digit, { height, lineHeight: height }, textStyle]}
          >
            {d}
          </Text>
        ))}
      </Animated.View>
    </View>
  );
}

/**
 * Đếm lùi định dạng m:ss (ví dụ 0:58, 0:42)
 * fadeColor: màu nền phía sau để làm mờ tự nhiên 2 mép trên/dưới
 */
export function OdometerCountdown({
  seconds,
  color = 'rgba(255,255,255,0.42)',
  fadeColor = colors.s4,
  fontSize = 15.5,
}: {
  seconds: number;
  color?: string;
  fadeColor?: string;
  fontSize?: number;
}) {
  const lineHeight = Math.round(fontSize * 1.25);
  const safeSec = Math.max(0, Math.floor(seconds));
  const m = Math.floor(safeSec / 60) % 10;
  const s1 = Math.floor((safeSec % 60) / 10);
  const s2 = safeSec % 10;

  const textStyle: TextStyle = {
    fontSize,
    color,
    fontFamily: fontFamily.bold,
  };

  return (
    <View style={[styles.row, { height: lineHeight, overflow: 'hidden' }]}>
      <DigitReel digit={m} height={lineHeight} textStyle={textStyle} />
      <Text style={[styles.sep, { lineHeight }, textStyle]}>:</Text>
      <DigitReel digit={s1} height={lineHeight} textStyle={textStyle} />
      <DigitReel digit={s2} height={lineHeight} textStyle={textStyle} />

      {/* Mép mờ trên */}
      <LinearGradient
        pointerEvents="none"
        colors={[fadeColor, 'transparent']}
        style={styles.fadeTop}
      />
      {/* Mép mờ dưới */}
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', fadeColor]}
        style={styles.fadeBottom}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    position: 'relative',
  },
  digit: {
    textAlign: 'center',
    fontVariant: ['tabular-nums'],
  },
  sep: {
    textAlign: 'center',
    marginHorizontal: 0.5,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '24%',
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '24%',
  },
});