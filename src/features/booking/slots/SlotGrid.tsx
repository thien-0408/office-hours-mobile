import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { BookableSlot } from '../../../api/domainTypes';
import { formatVnTime } from '../../../api/time';
import { colors, fonts, ls, radius } from '../../../theme';
import type { SlotState } from './slotLogic';

export type SlotGridItem = { slot: BookableSlot; state: SlotState };

export type SlotGridProps = {
  items: SlotGridItem[];
  selectedSlotId?: string;
  onSelect: (slot: BookableSlot, state: SlotState) => void;
  /** Full slots can be tapped (waitlist). When false they are disabled (reschedule). */
  fullSelectable?: boolean;
};

const COLS = 3;

/** 3-column pill grid. Uses plain rows (not FlatList) so it nests inside a ScrollView. */
export function SlotGrid({
  items,
  selectedSlotId,
  onSelect,
  fullSelectable = true,
}: SlotGridProps) {
  const rows: SlotGridItem[][] = [];
  for (let i = 0; i < items.length; i += COLS) {
    rows.push(items.slice(i, i + COLS));
  }
  return (
    <View style={styles.grid}>
      {rows.map(row => (
        <View key={row[0].slot.id} style={styles.row}>
          {row.map(({ slot, state }) => {
            const time = formatVnTime(slot.startAt);
            const disabled =
              state === 'conflict' ||
              state === 'current' ||
              state === 'past' ||
              (state === 'full' && !fullSelectable);
            const on = slot.id === selectedSlotId;
            return (
              <Pressable
                key={slot.id}
                accessibilityRole="button"
                accessibilityLabel={`${time}, ${LABELS[state]}`}
                accessibilityState={{ disabled, selected: on }}
                disabled={disabled}
                onPress={() => onSelect(slot, state)}
                style={[
                  styles.pill,
                  on && styles.pillOn,
                  state === 'current' && styles.pillCurrent,
                ]}
              >
                <Text
                  style={[
                    styles.time,
                    on && styles.timeOn,
                    state === 'full' && styles.timeFull,
                    (state === 'conflict' || state === 'past') && styles.timeMuted,
                    state === 'current' && styles.timeCurrent,
                  ]}
                >
                  {time}
                </Text>
              </Pressable>
            );
          })}
          {row.length < COLS
            ? Array.from({ length: COLS - row.length }, (_, i) => (
                <View key={`pad-${i}`} style={styles.padCell} />
              ))
            : null}
        </View>
      ))}
    </View>
  );
}

const LABELS: Record<SlotState, string> = {
  available: 'còn trống',
  full: 'đã có người, có thể vào hàng đợi',
  conflict: 'trùng lịch của bạn',
  current: 'giờ hiện tại của bạn',
  past: 'đã qua',
};

const styles = StyleSheet.create({
  grid: { gap: 8 },
  row: { flexDirection: 'row', gap: 8 },
  padCell: { flex: 1 },
  pill: {
    flex: 1,
    height: 46,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  pillOn: { backgroundColor: colors.fg, borderColor: colors.fg },
  pillCurrent: { backgroundColor: 'transparent', borderColor: colors.focus },
  time: {
    fontSize: 14.5,
    fontFamily: fonts.medium,
    letterSpacing: ls(14.5, -0.02),
    color: colors.fg,
    fontVariant: ['tabular-nums'],
  },
  timeOn: { color: '#000', fontFamily: fonts.semibold },
  timeFull: { color: colors.fg4, textDecorationLine: 'line-through' },
  timeMuted: { color: colors.fg4 },
  timeCurrent: { color: colors.fg2 },
});
