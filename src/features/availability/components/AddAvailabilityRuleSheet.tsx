import React, { useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCreateAvailabilityRule } from '../../../api/hooks';
import type { Semester } from '../../../api/domainTypes';
import { Button } from '../../../components/Button';
import { Field } from '../../../components/Field';
import { Seg, type SegOption } from '../../../components/Seg';
import { colors, fonts, radius, space } from '../../../theme';
import {
  availabilityErrorMessage,
  calculateSlotsCount,
  calculateTotalSlots,
  validateRuleInput,
} from '../availabilityLogic';
import { TimeSelector } from './TimeSelector';

export interface AddAvailabilityRuleSheetProps {
  visible: boolean;
  lecturerId: string;
  activeSemester: Semester | undefined;
  onClose: () => void;
}

const ALL_DAYS = [
  { value: 1, label: 'T2' },
  { value: 2, label: 'T3' },
  { value: 3, label: 'T4' },
  { value: 4, label: 'T5' },
  { value: 5, label: 'T6' },
  { value: 6, label: 'T7' },
  { value: 7, label: 'CN' },
];

const SLOT_LENGTH_OPTIONS: SegOption[] = [
  { value: '15', label: '15 phút' },
  { value: '20', label: '20 phút' },
  { value: '30', label: '30 phút' },
];

const FORMAT_OPTIONS: SegOption[] = [
  { value: 'in_person', label: 'Trực tiếp' },
  { value: 'online', label: 'Online' },
];

export function AddAvailabilityRuleSheet({
  visible,
  lecturerId,
  activeSemester,
  onClose,
}: AddAvailabilityRuleSheetProps) {
  const insets = useSafeAreaInsets();
  const createMutation = useCreateAvailabilityRule(lecturerId);

  const [selectedDays, setSelectedDays] = useState<number[]>([3, 5]); // Default: T4, T6 like mock
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [slotLengthMinutes, setSlotLengthMinutes] = useState(15);
  const [meetingFormat, setMeetingFormat] = useState<'in_person' | 'online'>('online');
  const [meetingUrl, setMeetingUrl] = useState('https://zoom.us/j/88123450921');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isOnline = meetingFormat === 'online';

  const toggleDay = (day: number) => {
    setSelectedDays(prev => {
      if (prev.includes(day)) {
        return prev.filter(d => d !== day);
      }
      return [...prev, day].sort((a, b) => a - b);
    });
    if (errors.days) {
      setErrors(prev => ({ ...prev, days: '' }));
    }
  };

  const handleClose = () => {
    setErrors({});
    setIsSubmitting(false);
    onClose();
  };

  const totalSlots = calculateTotalSlots(
    selectedDays.length,
    startTime,
    endTime,
    slotLengthMinutes,
  );
  const slotsPerDay = calculateSlotsCount(startTime, endTime, slotLengthMinutes);

  const submitButtonTitle =
    selectedDays.length > 0 && slotsPerDay > 0
      ? `Tạo ${selectedDays.length} khung · ${totalSlots} slot`
      : 'Tạo khung giờ';

  const handleCreate = async () => {
    if (!activeSemester) {
      Alert.alert('Không thể tạo', 'Chưa có thông tin học kỳ hoạt động.');
      return;
    }

    const validation = validateRuleInput({
      days: selectedDays,
      startTime,
      endTime,
      slotLengthMinutes,
      isOnline,
      meetingUrl: isOnline ? meetingUrl : undefined,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});
    setIsSubmitting(true);

    try {
      // Create a rule for each selected day
      for (const day of selectedDays) {
        await createMutation.mutateAsync({
          semesterId: activeSemester.id,
          dayOfWeek: day,
          startTime,
          endTime,
          slotLengthMinutes,
          effectiveFrom: activeSemester.startDate,
          effectiveTo: activeSemester.endDate,
          meetingUrl: isOnline ? meetingUrl.trim() : null,
        });
      }

      handleClose();
    } catch (err) {
      setIsSubmitting(false);
      Alert.alert('Không thể tạo', availabilityErrorMessage(err));
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <Pressable
          style={styles.backdrop}
          onPress={isSubmitting ? undefined : handleClose}
          accessibilityLabel="Đóng bảng thêm khung giờ"
        />

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + space.md },
          ]}
        >
          <View style={styles.handle} />

          <Text style={styles.title}>Khung giờ mới</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            {/* Days multi-chip selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Các ngày lặp lại</Text>
              <View style={styles.chipsRow}>
                {ALL_DAYS.map(d => {
                  const isSelected = selectedDays.includes(d.value);
                  return (
                    <Pressable
                      key={d.value}
                      accessibilityRole="button"
                      accessibilityState={{ selected: isSelected }}
                      accessibilityLabel={d.label}
                      onPress={() => toggleDay(d.value)}
                      style={[styles.chip, isSelected && styles.chipActive]}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {d.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              {errors.days ? (
                <Text style={styles.errorText}>{errors.days}</Text>
              ) : null}
            </View>

            {/* Time selection */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Thời gian rảnh</Text>
              <TimeSelector
                startTime={startTime}
                endTime={endTime}
                onChangeStartTime={setStartTime}
                onChangeEndTime={setEndTime}
                error={errors.endTime || errors.startTime}
              />
            </View>

            {/* Slot Length */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Độ dài slot</Text>
              <Seg
                options={SLOT_LENGTH_OPTIONS}
                value={String(slotLengthMinutes)}
                onChange={val => setSlotLengthMinutes(parseInt(val, 10))}
              />
              {errors.slotLengthMinutes ? (
                <Text style={styles.errorText}>{errors.slotLengthMinutes}</Text>
              ) : null}
            </View>

            {/* Format: in person or online */}
            <View style={styles.formGroup}>
              <Text style={styles.label}>Hình thức</Text>
              <Seg
                options={FORMAT_OPTIONS}
                value={meetingFormat}
                onChange={val => setMeetingFormat(val as 'in_person' | 'online')}
              />
            </View>

            {/* Meeting link field when Online */}
            {isOnline ? (
              <View style={styles.formGroup}>
                <Field
                  label="Link phòng họp online"
                  placeholder="https://zoom.us/j/... hoặc Google Meet"
                  value={meetingUrl}
                  onChangeText={text => {
                    setMeetingUrl(text);
                    if (errors.meetingUrl) {
                      setErrors(prev => ({ ...prev, meetingUrl: '' }));
                    }
                  }}
                  error={errors.meetingUrl}
                />
              </View>
            ) : null}

            {/* Action buttons */}
            <View style={styles.actionButtons}>
              <Button
                variant="primary"
                title={submitButtonTitle}
                loading={isSubmitting}
                disabled={isSubmitting || selectedDays.length === 0}
                onPress={handleCreate}
              />
              <Button
                variant="quiet"
                title="Hủy"
                disabled={isSubmitting}
                onPress={handleClose}
              />
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
  },
  sheet: {
    maxHeight: '92%',
    backgroundColor: colors.s1,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    borderWidth: 1,
    borderColor: colors.line2,
    paddingHorizontal: space.gutter,
    paddingTop: space.md,
  },
  handle: {
    width: 40,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.fg4,
    alignSelf: 'center',
    marginBottom: space.md,
  },
  title: {
    fontSize: 20,
    fontFamily: fonts.bold,
    color: colors.fg,
    marginBottom: space.md,
  },
  scrollContent: {
    gap: space.md,
    paddingBottom: space.lg,
  },
  formGroup: {
    gap: space.xs,
  },
  label: {
    fontSize: 12.5,
    fontFamily: fonts.semibold,
    color: colors.fg3,
    marginBottom: 2,
  },
  chipsRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
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
    fontSize: 13.5,
    fontFamily: fonts.semibold,
    color: colors.fg2,
  },
  chipTextActive: {
    color: colors.onPrimary,
  },
  errorText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.err,
    marginTop: space.xs,
  },
  actionButtons: {
    gap: space.sm,
    marginTop: space.sm,
  },
});
