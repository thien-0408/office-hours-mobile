import React, { useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { colors, fonts, ls, radius, space } from '../../../theme';
import {
  formatMinutesToTime,
  parseTimeToMinutes,
} from '../scheduleLogic';

export interface TimeSelectorProps {
  startTime: string; // "HH:mm"
  endTime: string; // "HH:mm"
  onChangeStartTime: (time: string) => void;
  onChangeEndTime: (time: string) => void;
  error?: string;
}

const HOURS = Array.from({ length: 18 }, (_, i) => String(i + 6).padStart(2, '0')); // 06..23
const MINUTES = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

export function TimeSelector({
  startTime,
  endTime,
  onChangeStartTime,
  onChangeEndTime,
  error,
}: TimeSelectorProps) {
  const [activeTab, setActiveTab] = useState<'start' | 'end'>('start');

  const currentTime = activeTab === 'start' ? startTime : endTime;
  const currentParts = currentTime.split(':');
  const currentHour = currentParts[0] || '08';
  const currentMinute = currentParts[1] || '00';

  const handleSelectHour = (h: string) => {
    const newTime = `${h}:${currentMinute}`;
    if (activeTab === 'start') {
      onChangeStartTime(newTime);
      // Auto advance or adjust end time if needed
      const startMin = parseTimeToMinutes(newTime);
      const endMin = parseTimeToMinutes(endTime);
      if (!Number.isNaN(startMin) && !Number.isNaN(endMin) && endMin <= startMin) {
        onChangeEndTime(formatMinutesToTime(Math.min(1439, startMin + 60)));
      }
    } else {
      onChangeEndTime(newTime);
    }
  };

  const handleSelectMinute = (m: string) => {
    const newTime = `${currentHour}:${m}`;
    if (activeTab === 'start') {
      onChangeStartTime(newTime);
      const startMin = parseTimeToMinutes(newTime);
      const endMin = parseTimeToMinutes(endTime);
      if (!Number.isNaN(startMin) && !Number.isNaN(endMin) && endMin <= startMin) {
        onChangeEndTime(formatMinutesToTime(Math.min(1439, startMin + 60)));
      }
    } else {
      onChangeEndTime(newTime);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.timepickRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Giờ bắt đầu: ${startTime}`}
          onPress={() => setActiveTab('start')}
          style={[
            styles.tpBox,
            activeTab === 'start' && styles.tpBoxActive,
            Boolean(error) && styles.tpBoxError,
          ]}
        >
          <Text style={[styles.tpLabel, activeTab === 'start' && styles.tpLabelActive]}>
            Từ
          </Text>
          <Text style={[styles.tpTime, activeTab === 'start' && styles.tpTimeActive]}>
            {startTime}
          </Text>
        </Pressable>

        <Text style={styles.toSeparator}>–</Text>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Giờ kết thúc: ${endTime}`}
          onPress={() => setActiveTab('end')}
          style={[
            styles.tpBox,
            activeTab === 'end' && styles.tpBoxActive,
            Boolean(error) && styles.tpBoxError,
          ]}
        >
          <Text style={[styles.tpLabel, activeTab === 'end' && styles.tpLabelActive]}>
            Đến
          </Text>
          <Text style={[styles.tpTime, activeTab === 'end' && styles.tpTimeActive]}>
            {endTime}
          </Text>
        </Pressable>
      </View>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      <View style={styles.pickerPanel}>
        <Text style={styles.sectionSubtitle}>
          Chọn {activeTab === 'start' ? 'giờ bắt đầu' : 'giờ kết thúc'}
        </Text>

        <View style={styles.selectorRow}>
          <Text style={styles.miniLabel}>Giờ</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {HOURS.map(h => {
              const isSelected = h === currentHour;
              return (
                <Pressable
                  key={h}
                  accessibilityRole="button"
                  onPress={() => handleSelectHour(h)}
                  style={[styles.chip, isSelected && styles.chipActive]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {h}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.selectorRow}>
          <Text style={styles.miniLabel}>Phút</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {MINUTES.map(m => {
              const isSelected = m === currentMinute;
              return (
                <Pressable
                  key={m}
                  accessibilityRole="button"
                  onPress={() => handleSelectMinute(m)}
                  style={[styles.chip, isSelected && styles.chipActive]}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>
                    {m}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: space.xs,
  },
  timepickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  tpBox: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  tpBoxActive: {
    borderColor: colors.focus,
    backgroundColor: colors.s3,
  },
  tpBoxError: {
    borderColor: colors.err,
  },
  tpLabel: {
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.fg3,
    marginBottom: 2,
  },
  tpLabelActive: {
    color: colors.fg2,
  },
  tpTime: {
    fontSize: 26,
    fontFamily: fonts.bold,
    letterSpacing: ls(26, -0.05),
    color: colors.fg2,
    fontVariant: ['tabular-nums'],
  },
  tpTimeActive: {
    color: colors.fg,
  },
  toSeparator: {
    fontSize: 18,
    color: colors.fg3,
    fontFamily: fonts.semibold,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.err,
    marginTop: space.xs,
  },
  pickerPanel: {
    backgroundColor: colors.s2,
    borderRadius: radius.md,
    padding: space.sm,
    borderWidth: 1,
    borderColor: colors.line,
    marginTop: space.xs,
    gap: space.xs,
  },
  sectionSubtitle: {
    fontSize: 11.5,
    fontFamily: fonts.semibold,
    color: colors.fg3,
    paddingHorizontal: space.xs,
  },
  selectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
  },
  miniLabel: {
    width: 32,
    fontSize: 12,
    fontFamily: fonts.semibold,
    color: colors.fg3,
    paddingLeft: space.xs,
  },
  chipsScroll: {
    gap: 6,
    paddingVertical: 4,
    paddingRight: space.sm,
  },
  chip: {
    height: 32,
    minWidth: 42,
    paddingHorizontal: 8,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
  },
  chipActive: {
    backgroundColor: colors.fg,
    borderColor: colors.fg,
  },
  chipText: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.fg2,
    fontVariant: ['tabular-nums'],
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
});
