import { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import * as Haptics from 'expo-haptics';
import type { BookableSlot } from '../../../api/domainTypes';
import { useLecturerSlots } from '../../../api/hooks';
import { Button } from '../../../components';
import { Skeleton } from '../../../components/motion';
import { colors, fonts, ls } from '../../../theme';
import { SlotGrid } from './SlotGrid';
import {
  defaultDayKey,
  groupSlotsByDay,
  slotState,
  weekInfo,
  type SlotState,
} from './slotLogic';
import { WeekStrip } from './WeekStrip';

export type SlotPickerProps = {
  lecturerId: string;
  /** Week shown first, in whole weeks from the current one (reschedule opens on the booking's week). */
  initialWeekOffset?: number;
  selectedSlotId?: string;
  /** The student's current slot (reschedule): shown outlined and disabled. */
  currentSlotId?: string;
  /** Full slots tappable (waitlist) or disabled. */
  fullSelectable?: boolean;
  onSelect: (slot: BookableSlot, state: SlotState) => void;
};

/** Week strip + day chips + slot grid for one lecturer. Shared by screens 11 and 15. */
export function SlotPicker({
  lecturerId,
  initialWeekOffset = 0,
  selectedSlotId,
  currentSlotId,
  fullSelectable = true,
  onSelect,
}: SlotPickerProps) {
  const [now] = useState(() => Date.now());
  const [offset, setOffset] = useState(Math.max(0, initialWeekOffset));
  const [choice, setChoice] = useState<{ week: string; key: string } | null>(
    null,
  );

  const week = useMemo(() => weekInfo(now, offset), [now, offset]);
  const query = useLecturerSlots(lecturerId, week.week);

  const byDay = useMemo(() => groupSlotsByDay(query.data ?? []), [query.data]);
  const daysWithSlots = useMemo(() => new Set(Object.keys(byDay)), [byDay]);
  const selectedKey =
    choice && choice.week === week.week
      ? choice.key
      : defaultDayKey(week, byDay, now);

  const items = useMemo(
    () =>
      (byDay[selectedKey] ?? []).map(slot => ({
        slot,
        state: slotState(slot, { now, currentSlotId }),
      })),
    [byDay, selectedKey, now, currentSlotId],
  );

  const hasFull = items.some(i => i.state === 'full') && fullSelectable;
  const hasConflict = items.some(i => i.state === 'conflict');

  const handleSelect = (slot: BookableSlot, state: SlotState) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    onSelect(slot, state);
  };

  return (
    <View>
      <WeekStrip
        week={week}
        selectedKey={selectedKey}
        daysWithSlots={daysWithSlots}
        canGoPrev={offset > 0}
        onPrev={() => setOffset(o => Math.max(0, o - 1))}
        onNext={() => setOffset(o => o + 1)}
        onSelectDay={key => setChoice({ week: week.week, key })}
      />
      <View style={styles.body}>
        {query.isPending ? (
          <View style={styles.skeletons}>
            {[0, 1].map(r => (
              <View key={r} style={styles.skeletonRow}>
                {[0, 1, 2].map(c => (
                  <Skeleton
                    key={c}
                    height={46}
                    borderRadius={23}
                    style={styles.skeletonCell}
                  />
                ))}
              </View>
            ))}
          </View>
        ) : query.isError ? (
          <View>
            <Text style={styles.note}>Không tải được lịch của tuần này.</Text>
            <Button
              variant="quiet"
              title="Thử lại"
              onPress={() => query.refetch()}
              style={styles.retry}
            />
          </View>
        ) : daysWithSlots.size === 0 ? (
          <Text style={styles.note}>Tuần này chưa có slot nào.</Text>
        ) : items.length === 0 ? (
          <Text style={styles.note}>Ngày này không có slot.</Text>
        ) : (
          <>
            <SlotGrid
              items={items}
              selectedSlotId={selectedSlotId}
              onSelect={handleSelect}
              fullSelectable={fullSelectable}
            />
            {hasFull || hasConflict ? (
              <View style={styles.legend}>
                {hasFull ? (
                  <Text style={styles.legendText}>
                    Giờ gạch ngang đã có người, chạm để vào hàng đợi.
                  </Text>
                ) : null}
                {hasConflict ? (
                  <Text style={styles.legendText}>
                    Giờ mờ: Trùng lịch của bạn.
                  </Text>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  body: { marginTop: 12, minHeight: 100 },
  skeletons: { gap: 8 },
  skeletonRow: { flexDirection: 'row', gap: 8 },
  skeletonCell: { flex: 1, width: undefined },
  note: {
    fontSize: 14,
    fontFamily: fonts.medium,
    letterSpacing: ls(14, -0.012),
    color: colors.fg2,
    paddingVertical: 12,
  },
  retry: { alignSelf: 'flex-start', paddingHorizontal: 0 },
  legend: { marginTop: 12, gap: 2 },
  legendText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.fg3,
  },
});
