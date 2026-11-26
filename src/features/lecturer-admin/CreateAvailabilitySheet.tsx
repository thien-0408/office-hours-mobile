import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SubLabel } from '../../components/AppPrimitives';
import { PillButton } from '../../components/AuthPrimitives';
import { GoogleMeetLogo, ZoomLogo } from '../../components/Icons';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

const WEEKDAY_CHIPS = [
  { key: 1, label: 'T2' },
  { key: 2, label: 'T3' },
  { key: 3, label: 'T4' },
  { key: 4, label: 'T5' },
  { key: 5, label: 'T6' },
  { key: 6, label: 'T7' },
];

export interface CreateAvailabilityPayload {
  weekdays: number[];
  startTime: string;
  endTime: string;
  slotDurationMinutes: 15 | 20 | 30;
  mode: 'IN_PERSON' | 'ONLINE';
  meetingUrl?: string;
}

interface CreateAvailabilitySheetProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAvailabilityPayload) => Promise<void>;
}

function parseMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return 0;
  return h * 60 + m;
}

export function CreateAvailabilitySheet({
  visible,
  onClose,
  onSubmit,
}: CreateAvailabilitySheetProps) {
  const [selectedDays, setSelectedDays] = useState<number[]>([3, 5]); // T4, T6
  const [activeTimeSide, setActiveTimeSide] = useState<'from' | 'to'>('to');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [duration, setDuration] = useState<15 | 20 | 30>(15);
  const [mode, setMode] = useState<'IN_PERSON' | 'ONLINE'>('ONLINE');
  const [meetingUrl, setMeetingUrl] = useState('zoom.us/j/8812 3450 921');
  const [urlFocused, setUrlFocused] = useState(true);
  const [loading, setLoading] = useState(false);

  const toggleDay = (dayKey: number) => {
    setSelectedDays((prev) =>
      prev.includes(dayKey)
        ? prev.filter((d) => d !== dayKey)
        : [...prev, dayKey].sort(),
    );
  };

  // Nhận diện logo ngay trong ô link họp
  const detectedBrand = useMemo(() => {
    const lower = meetingUrl.toLowerCase();
    if (lower.includes('zoom.us')) return 'zoom';
    if (lower.includes('meet.google.com')) return 'meet';
    return null;
  }, [meetingUrl]);

  // Tính tự động số khung & tổng số slot
  const { frameCount, totalSlots } = useMemo(() => {
    const frames = selectedDays.length;
    const diff = Math.max(0, parseMinutes(endTime) - parseMinutes(startTime));
    const slotsPerFrame = Math.floor(diff / duration);
    return {
      frameCount: frames,
      totalSlots: frames * slotsPerFrame,
    };
  }, [selectedDays, startTime, endTime, duration]);

  const canCreate =
    frameCount > 0 &&
    totalSlots > 0 &&
    (mode === 'IN_PERSON' || meetingUrl.trim().length > 0);

  const handleCreate = async () => {
    if (!canCreate || loading) return;
    setLoading(true);
    try {
      await onSubmit({
        weekdays: selectedDays,
        startTime,
        endTime,
        slotDurationMinutes: duration,
        mode,
        meetingUrl: mode === 'ONLINE' ? meetingUrl.trim() : undefined,
      });
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.scrim}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheet, squircle(radius.sheet)]}>
          <View style={styles.grab} />

          <Text style={typography.h2}>Khung giờ mới</Text>

          {/* Chọn nhiều thứ */}
          <View style={styles.chipsWrap}>
            {WEEKDAY_CHIPS.map((chip) => {
              const isOn = selectedDays.includes(chip.key);
              return (
                <Pressable
                  key={chip.key}
                  onPress={() => toggleDay(chip.key)}
                  style={[styles.chip, isOn && styles.chipOn]}
                >
                  <Text
                    style={[styles.chipText, isOn && styles.chipTextOn]}
                  >
                    {chip.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Chọn giờ lớn */}
          <View style={styles.timePickRow}>
            <Pressable
              onPress={() => setActiveTimeSide('from')}
              style={[
                styles.timeBox,
                squircle(radius.lg),
                activeTimeSide === 'from' && styles.timeBoxOn,
              ]}
            >
              <Text style={styles.timeLabel}>Từ</Text>
              <TextInput
                value={startTime}
                onFocus={() => setActiveTimeSide('from')}
                onChangeText={setStartTime}
                keyboardType="numbers-and-punctuation"
                style={styles.timeBigInput}
              />
            </Pressable>

            <Text style={styles.timeDash}>–</Text>

            <Pressable
              onPress={() => setActiveTimeSide('to')}
              style={[
                styles.timeBox,
                squircle(radius.lg),
                activeTimeSide === 'to' && styles.timeBoxOn,
              ]}
            >
              <Text style={styles.timeLabel}>Đến</Text>
              <TextInput
                value={endTime}
                onFocus={() => setActiveTimeSide('to')}
                onChangeText={setEndTime}
                keyboardType="numbers-and-punctuation"
                style={styles.timeBigInput}
              />
            </Pressable>
          </View>

          {/* Độ dài slot */}
          <SubLabel style={{ marginTop: 18 }}>Độ dài slot</SubLabel>
          <View style={styles.seg}>
            {([15, 20, 30] as (15 | 20 | 30)[]).map((min) => {
              const isOn = duration === min;
              return (
                <Pressable
                  key={min}
                  onPress={() => setDuration(min)}
                  style={[styles.segTab, isOn && styles.segTabOn]}
                >
                  <Text style={[styles.segText, isOn && styles.segTextOn]}>
                    {min} phút
                  </Text>
                </Pressable>
              );
            })}
          </View>

          {/* Hình thức */}
          <SubLabel style={{ marginTop: 16 }}>Hình thức</SubLabel>
          <View style={styles.seg}>
            <Pressable
              onPress={() => setMode('IN_PERSON')}
              style={[
                styles.segTab,
                mode === 'IN_PERSON' && styles.segTabOn,
              ]}
            >
              <Text
                style={[
                  styles.segText,
                  mode === 'IN_PERSON' && styles.segTextOn,
                ]}
              >
                Trực tiếp
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setMode('ONLINE')}
              style={[styles.segTab, mode === 'ONLINE' && styles.segTabOn]}
            >
              <Text
                style={[
                  styles.segText,
                  mode === 'ONLINE' && styles.segTextOn,
                ]}
              >
                Online
              </Text>
            </Pressable>
          </View>

          {/* Ô Link họp khi chọn Online */}
          {mode === 'ONLINE' && (
            <View
              style={[
                styles.linkField,
                squircle(radius.lg),
                urlFocused && styles.linkFieldFocus,
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.linkLabel}>Link họp</Text>
                <TextInput
                  value={meetingUrl}
                  onChangeText={setMeetingUrl}
                  onFocus={() => setUrlFocused(true)}
                  onBlur={() => setUrlFocused(false)}
                  placeholder="meet.google.com/... hoặc zoom.us/j/..."
                  placeholderTextColor={colors.fg4}
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.linkInput}
                />
              </View>
              {detectedBrand === 'zoom' && <ZoomLogo size={24} />}
              {detectedBrand === 'meet' && <GoogleMeetLogo size={24} />}
            </View>
          )}

          <PillButton
            title={
              canCreate
                ? `Tạo ${frameCount} khung · ${totalSlots} slot`
                : 'Tạo khung giờ'
            }
            disabled={!canCreate}
            loading={loading}
            onPress={handleCreate}
            style={{ marginTop: 20 }}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.64)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: colors.line2,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.fg4,
    alignSelf: 'center',
    marginBottom: 18,
  },
  chipsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 16,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.fg,
    borderWidth: 0,
  },
  chipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13.5,
    color: colors.fg2,
  },
  chipTextOn: {
    fontFamily: fontFamily.bold,
    color: '#000000',
  },
  timePickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  timeBox: {
    flex: 1,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  timeBoxOn: {
    borderColor: colors.focus,
  },
  timeLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11.5,
    color: colors.fg3,
  },
  timeBigInput: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    letterSpacing: ls(28, -0.05),
    fontVariant: ['tabular-nums'],
    color: colors.fg,
    padding: 0,
    marginTop: 2,
  },
  timeDash: {
    fontFamily: fontFamily.semiBold,
    fontSize: 18,
    color: colors.fg3,
  },
  seg: {
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segTab: {
    flex: 1,
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segTabOn: {
    backgroundColor: colors.glassHi,
    borderWidth: 1,
    borderColor: colors.glassLine,
  },
  segText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13.5,
    color: colors.fg3,
  },
  segTextOn: {
    color: colors.fg,
  },
  linkField: {
    marginTop: 12,
    minHeight: 58,
    paddingHorizontal: 16,
    paddingVertical: 9,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  linkFieldFocus: {
    borderColor: colors.focus,
  },
  linkLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11.5,
    color: colors.fg3,
  },
  linkInput: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    letterSpacing: ls(15, -0.02),
    color: colors.fg,
    padding: 0,
    marginTop: 2,
  },
});