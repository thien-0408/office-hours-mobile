import { StyleSheet, Text, View } from 'react-native';
import { colors, fonts, ls } from '../../../theme';
import {
  dayName,
  formatVnTimeRange,
  vnParts,
} from '../../../api/time';

/** `.dateblk`: big day number, then "Thứ Tư, tháng 11" and the bold time range. */
export function DateBlock({
  startAt,
  endAt,
  where,
}: {
  startAt: string;
  endAt: string;
  where?: string;
}) {
  const p = vnParts(startAt);
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${dayName(p.isoDayOfWeek)} ${p.day} tháng ${p.month}`}
    >
      <Text style={styles.day}>{p.day}</Text>
      <View style={styles.side}>
        <Text style={styles.sub}>
          {dayName(p.isoDayOfWeek)}, tháng {p.month}
        </Text>
        <Text style={styles.sub}>
          <Text style={styles.time}>{formatVnTimeRange(startAt, endAt)}</Text>
          {where ? ` · ${where}` : ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', gap: 12 },
  day: {
    fontSize: 60,
    lineHeight: 52,
    fontFamily: fonts.bold,
    letterSpacing: ls(60, -0.05),
    color: colors.fg,
  },
  side: { paddingBottom: 2 },
  sub: {
    fontSize: 14,
    lineHeight: 18,
    fontFamily: fonts.semibold,
    letterSpacing: ls(14, -0.01),
    color: colors.fg2,
  },
  time: {
    fontFamily: fonts.bold,
    letterSpacing: ls(14, -0.02),
    color: colors.fg,
  },
});
