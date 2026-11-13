import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Avatar } from '../../components';
import { Odometer } from '../../components/motion';
import { colors, fonts, ls } from '../../theme';

/** docs/mockups-mochy/logo/oh-mark.svg, monochrome white (stroke = currentColor there). */
export function OhMark({ size = 30 }: { size?: number }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 120 120"
      fill="none"
      stroke={colors.fg}
      strokeWidth={12}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityLabel="OfficeHours"
    >
      <Path d="M58.67 63.48A22 22 0 1 1 38 49" />
      <Path d="M74 27V93" />
      <Path d="M74 63A14 14 0 0 1 102 63V93" />
    </Svg>
  );
}

/** `.apphead`: logo mark on the left, the user's avatar (-> Profile) on the right. */
export function AppHeader({
  userId,
  onAvatarPress,
}: {
  userId: string | undefined;
  onAvatarPress: () => void;
}) {
  return (
    <View style={styles.head}>
      <OhMark />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Hồ sơ của bạn"
        onPress={onAvatarPress}
        hitSlop={8}
      >
        <Avatar id={userId} size={34} shape="round" />
      </Pressable>
    </View>
  );
}

export type StatItem = {
  value: number;
  label: string;
  onPress?: () => void;
};

/** `.stats`: big odometer numbers with one short line each. */
export function StatsRow({ items }: { items: StatItem[] }) {
  return (
    <View style={styles.stats}>
      {items.map(s => {
        const body = (
          <>
            <Odometer value={s.value} style={styles.statNumber} />
            <Text style={styles.statLabel}>{s.label}</Text>
          </>
        );
        return s.onPress ? (
          <Pressable
            key={s.label}
            accessibilityRole="button"
            accessibilityLabel={`${s.value} ${s.label}`}
            onPress={s.onPress}
          >
            {body}
          </Pressable>
        ) : (
          <View
            key={s.label}
            accessible
            accessibilityLabel={`${s.value} ${s.label}`}
          >
            {body}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  head: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stats: { flexDirection: 'row', gap: 30 },
  statNumber: { fontSize: 40, lineHeight: 48, letterSpacing: -2.4 },
  statLabel: {
    marginTop: 2,
    fontSize: 12.5,
    fontFamily: fonts.medium,
    letterSpacing: ls(12.5, -0.01),
    color: colors.fg2,
  },
});
