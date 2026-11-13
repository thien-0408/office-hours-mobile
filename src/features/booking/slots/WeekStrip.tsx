import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Icon } from '../../../components';
import { colors, fonts, ls } from '../../../theme';
import { shortDayLabel, type WeekInfo } from './slotLogic';

export type WeekStripProps = {
  week: WeekInfo;
  selectedKey: string;
  /** Day keys that have at least one slot (others are dimmed). */
  daysWithSlots: ReadonlySet<string>;
  canGoPrev: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSelectDay: (key: string) => void;
};

/** Week header ("Tuần 47  16–22/11" with prev/next) and the Monday..Sunday day chips. */
export function WeekStrip({
  week,
  selectedKey,
  daysWithSlots,
  canGoPrev,
  onPrev,
  onNext,
  onSelectDay,
}: WeekStripProps) {
  return (
    <View>
      <View style={styles.head}>
        <Text style={styles.title}>Tuần {week.weekNumber}</Text>
        <Text style={styles.range}>{week.rangeLabel}</Text>
        <View style={styles.nav}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tuần trước"
            accessibilityState={{ disabled: !canGoPrev }}
            disabled={!canGoPrev}
            onPress={onPrev}
            hitSlop={10}
            style={styles.navBtn}
          >
            <Icon as={ChevronLeft} size={20} level={canGoPrev ? 'normal' : 'muted'} />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Tuần sau"
            onPress={onNext}
            hitSlop={10}
            style={styles.navBtn}
          >
            <Icon as={ChevronRight} size={20} />
          </Pressable>
        </View>
      </View>
      <View style={styles.days}>
        {week.days.map(d => {
          const on = d.key === selectedKey;
          const off = !daysWithSlots.has(d.key);
          return (
            <Pressable
              key={d.key}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              accessibilityLabel={`${shortDayLabel(d.isoDay)} ngày ${d.day} tháng ${d.month}`}
              onPress={() => onSelectDay(d.key)}
              style={[styles.day, on && styles.dayOn, off && !on && styles.dayOff]}
            >
              <Text style={[styles.dayLabel, on && styles.dayLabelOn]}>
                {shortDayLabel(d.isoDay)}
              </Text>
              <Text style={[styles.dayNum, on && styles.dayNumOn]}>{d.day}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  title: {
    fontSize: 18,
    fontFamily: fonts.bold,
    letterSpacing: ls(18, -0.045),
    color: colors.fg,
  },
  range: {
    marginLeft: 10,
    fontSize: 13,
    fontFamily: fonts.semibold,
    letterSpacing: ls(13, -0.01),
    color: colors.fg3,
  },
  nav: { marginLeft: 'auto', flexDirection: 'row', gap: 8 },
  navBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.s3,
  },
  days: { flexDirection: 'row', gap: 6 },
  day: {
    flex: 1,
    height: 60,
    borderRadius: 18,
    borderCurve: 'continuous',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
  },
  dayOn: { backgroundColor: colors.fg, borderColor: colors.fg },
  dayOff: { opacity: 0.35 },
  dayLabel: {
    fontSize: 11,
    fontFamily: fonts.semibold,
    color: colors.fg3,
  },
  dayLabelOn: { color: 'rgba(0,0,0,0.55)' },
  dayNum: {
    fontSize: 18,
    fontFamily: fonts.semibold,
    letterSpacing: ls(18, -0.04),
    color: colors.fg,
    fontVariant: ['tabular-nums'],
  },
  dayNumOn: { color: '#000' },
});
