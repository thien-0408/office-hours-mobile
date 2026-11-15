import React, { useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useCreateAvailabilityException } from '../../../api/hooks';
import type { AvailabilityExceptionType } from '../../../api/domainTypes';
import { Button } from '../../../components/Button';
import { Field } from '../../../components/Field';
import { Seg, type SegOption } from '../../../components/Seg';
import { Sheet } from '../../../components/motion';
import { colors, fonts, space } from '../../../theme';
import {
  availabilityErrorMessage,
  validateExceptionInput,
} from '../availabilityLogic';
import { TimeSelector } from './TimeSelector';

export interface AddExceptionSheetProps {
  visible: boolean;
  lecturerId: string;
  onClose: () => void;
}

const TYPE_OPTIONS: SegOption[] = [
  { value: 'BLOCK', label: 'Nghỉ' },
  { value: 'ADD', label: 'Thêm giờ' },
];

export function AddExceptionSheet({
  visible,
  lecturerId,
  onClose,
}: AddExceptionSheetProps) {
  const createMutation = useCreateAvailabilityException(lecturerId);

  // Default date to tomorrow in YYYY-MM-DD
  const tomorrowStr = new Date(Date.now() + 24 * 60 * 60 * 1000)
    .toISOString()
    .split('T')[0];

  const [type, setType] = useState<AvailabilityExceptionType>('BLOCK');
  const [date, setDate] = useState(tomorrowStr);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('11:00');
  const [reason, setReason] = useState('');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isAdd = type === 'ADD';

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleSave = () => {
    const trimmedDate = date.trim();
    const trimmedReason = reason.trim();
    const trimmedUrl = meetingUrl.trim();

    const validation = validateExceptionInput({
      date: trimmedDate,
      type,
      startTime,
      endTime,
      reason: trimmedReason.length > 0 ? trimmedReason : undefined,
      meetingUrl: isAdd && trimmedUrl.length > 0 ? trimmedUrl : undefined,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    createMutation.mutate(
      {
        date: trimmedDate,
        type,
        startTime,
        endTime,
        reason: trimmedReason.length > 0 ? trimmedReason : undefined,
        meetingUrl: isAdd && trimmedUrl.length > 0 ? trimmedUrl : null,
      },
      {
        onSuccess: () => {
          setReason('');
          setMeetingUrl('');
          handleClose();
        },
        onError: err => {
          Alert.alert('Không thể thêm ngoại lệ', availabilityErrorMessage(err));
        },
      },
    );
  };

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      dismissable={!createMutation.isPending}
      backdropLabel="Đóng bảng thêm ngoại lệ"
      title="Thêm ngoại lệ"
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Type: Nghỉ / Thêm giờ */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>Loại ngoại lệ</Text>
          <Seg
            options={TYPE_OPTIONS}
            value={type}
            onChange={val => setType(val as AvailabilityExceptionType)}
          />
        </View>

        {/* Date input */}
        <View style={styles.formGroup}>
          <Field
            label="Ngày áp dụng (YYYY-MM-DD)"
            placeholder="VD: 2026-11-20"
            value={date}
            onChangeText={text => {
              setDate(text);
              if (errors.date) {
                setErrors(prev => ({ ...prev, date: '' }));
              }
            }}
            error={errors.date}
          />
        </View>

        {/* Time range */}
        <View style={styles.formGroup}>
          <Text style={styles.label}>
            {isAdd ? 'Khung giờ thêm' : 'Khung giờ nghỉ'}
          </Text>
          <TimeSelector
            startTime={startTime}
            endTime={endTime}
            onChangeStartTime={setStartTime}
            onChangeEndTime={setEndTime}
            error={errors.endTime || errors.startTime}
          />
        </View>

        {/* Reason */}
        <View style={styles.formGroup}>
          <Field
            label="Lý do"
            placeholder={isAdd ? 'VD: Ôn thi cuối kỳ, bù lịch...' : 'VD: Họp khoa, bận việc đột xuất...'}
            value={reason}
            onChangeText={setReason}
            error={errors.reason}
          />
        </View>

        {/* Meeting URL if ADD */}
        {isAdd ? (
          <View style={styles.formGroup}>
            <Field
              label="Link họp online (tuỳ chọn)"
              placeholder="https://zoom.us/j/... hoặc để trống nếu trực tiếp"
              value={meetingUrl}
              onChangeText={setMeetingUrl}
              error={errors.meetingUrl}
            />
          </View>
        ) : null}

        {/* Action buttons */}
        <View style={styles.actionButtons}>
          <Button
            variant="primary"
            title="Lưu ngoại lệ"
            loading={createMutation.isPending}
            disabled={createMutation.isPending}
            onPress={handleSave}
          />
          <Button
            variant="quiet"
            title="Hủy"
            disabled={createMutation.isPending}
            onPress={handleClose}
          />
        </View>
      </ScrollView>
    </Sheet>
  );
}

const styles = StyleSheet.create({
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
  actionButtons: {
    gap: space.sm,
    marginTop: space.sm,
  },
});
