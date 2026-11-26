import React from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
} from '../theme/tokens';

export interface DayItem {
  key: string;
  weekday: string; // VD: "T2", "T5"
  dayNum: string;  // VD: "16", "19"
  disabled?: boolean;
}

export interface SlotPillItem {
  id: string;
  time: string; // VD: "09:40"
  status: 'available' | 'full' | 'current';
}

/** Dải chọn ngày (.days trong app.css) */
export function DayStrip({
  days,
  selectedKey,
  onSelect,
  style,
}: {
  days: DayItem[];
  selectedKey: string;
  onSelect: (key: string) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.daysRow, style]}>
      {days.map((d) => {
        const isOn = d.key === selectedKey;
        return (
          <Pressable
            key={d.key}
            disabled={d.disabled}
            onPress={() => onSelect(d.key)}
            style={[
              styles.dayBox,
              squircle(radius.lg),
              isOn && styles.dayBoxOn,
              d.disabled && styles.dayBoxOff,
            ]}
          >
            <Text style={[styles.daySmall, isOn && { color: 'rgba(0,0,0,0.55)' }]}>
              {d.weekday}
            </Text>
            <Text style={[styles.dayNum, isOn && { color: '#000000' }]}>
              {d.dayNum}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Lưới 3 cột viên thuốc khung giờ (.slots trong app.css) */
export function SlotGrid({
  slots,
  selectedId,
  onSelectSlot,
  style,
}: {
  slots: SlotPillItem[];
  selectedId?: string;
  onSelectSlot: (slot: SlotPillItem) => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.slotsGrid, style]}>
      {slots.map((slot) => {
        const isOn = slot.id === selectedId && slot.status === 'available';
        const isFull = slot.status === 'full';
        const isCur = slot.status === 'current';

        return (
          <Pressable
            key={slot.id}
            onPress={() => onSelectSlot(slot)}
            style={[
              styles.slotPill,
              isOn && styles.slotPillOn,
              isCur && styles.slotPillCur,
            ]}
          >
            <Text
              style={[
                styles.slotText,
                isOn && styles.slotTextOn,
                isFull && styles.slotTextFull,
                isCur && styles.slotTextCur,
              ]}
            >
              {slot.time}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Khối ngày số lớn 60px (.dateblk trong app.css) */
export function DateBlock({
  dayNumber,
  line1,
  timeRange,
  suffix,
  style,
}: {
  dayNumber: string;
  line1: string;      // VD: "Thứ Năm, tháng 11"
  timeRange: string;  // VD: "09:40 – 10:00"
  suffix?: string;    // VD: " · online"
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.dateBlk, style]}>
      <Text style={styles.dateBig}>{dayNumber}</Text>
      <View style={{ paddingBottom: 3 }}>
        <Text style={styles.dateSub}>{line1}</Text>
        <Text style={styles.dateSub}>
          <Text style={styles.dateBold}>{timeRange}</Text>
          {suffix ?? ''}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  daysRow: {
    flexDirection: 'row',
    gap: 6,
  },
  dayBox: {
    flex: 1,
    height: 60,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  dayBoxOn: {
    backgroundColor: colors.fg,
    borderWidth: 0,
  },
  dayBoxOff: {
    opacity: 0.35,
  },
  daySmall: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.fg3,
  },
  dayNum: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    letterSpacing: ls(18, -0.04),
    fontVariant: ['tabular-nums'],
    color: colors.fg,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  slotPill: {
    width: '31.5%',
    height: 46,
    borderRadius: radius.pill,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slotPillOn: {
    backgroundColor: colors.fg,
    borderWidth: 0,
  },
  slotPillCur: {
    borderColor: colors.focus,
  },
  slotText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14.5,
    letterSpacing: ls(14.5, -0.02),
    fontVariant: ['tabular-nums'],
    color: colors.fg,
  },
  slotTextOn: {
    fontFamily: fontFamily.bold,
    color: '#000000',
  },
  slotTextFull: {
    color: colors.fg4,
    textDecorationLine: 'line-through',
  },
  slotTextCur: {
    color: colors.fg2,
  },
  dateBlk: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 12,
  },
  dateBig: {
    fontFamily: fontFamily.bold,
    fontSize: 60,
    lineHeight: 54,
    letterSpacing: ls(60, -0.07),
    fontVariant: ['tabular-nums'],
    color: colors.fg,
  },
  dateSub: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    lineHeight: 19,
    letterSpacing: ls(14, -0.02),
    color: colors.fg2,
  },
  dateBold: {
    fontFamily: fontFamily.bold,
    color: colors.fg,
  },
});