import React, { useEffect, useState } from 'react';
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useDeleteAvailabilityRule,
  useUpdateAvailabilityRule,
} from '../../../api/hooks';
import type { AvailabilityRule } from '../../../api/domainTypes';
import { Button } from '../../../components/Button';
import { Field } from '../../../components/Field';
import { Sheet, useSheetItem } from '../../../components/motion';
import { colors, fonts, space } from '../../../theme';
import {
  availabilityErrorMessage,
  dayOfWeekName,
  validateRuleInput,
} from '../availabilityLogic';
import { TimeSelector } from './TimeSelector';

export interface EditAvailabilityRuleSheetProps {
  rule: AvailabilityRule | null;
  visible: boolean;
  onClose: () => void;
}

export function EditAvailabilityRuleSheet({
  rule: ruleProp,
  visible,
  onClose,
}: EditAvailabilityRuleSheetProps) {
  // Keeps the rule on screen while the sheet slides away after close.
  const rule = useSheetItem(ruleProp);
  const updateMutation = useUpdateAvailabilityRule();
  const deleteMutation = useDeleteAvailabilityRule();

  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('10:00');
  const [meetingUrl, setMeetingUrl] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (rule) {
      setStartTime(rule.startTime);
      setEndTime(rule.endTime);
      setMeetingUrl(rule.meetingUrl ?? '');
      setErrors({});
    }
  }, [rule]);

  if (!rule) {
    return null;
  }

  const isBusy = updateMutation.isPending || deleteMutation.isPending;

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleSave = () => {
    const trimmedUrl = meetingUrl.trim();
    const isOnline = trimmedUrl.length > 0;

    const validation = validateRuleInput({
      days: [rule.dayOfWeek],
      startTime,
      endTime,
      slotLengthMinutes: rule.slotLengthMinutes,
      isOnline,
      meetingUrl: isOnline ? trimmedUrl : undefined,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    updateMutation.mutate(
      {
        id: rule.id,
        patch: {
          startTime,
          endTime,
          meetingUrl: trimmedUrl.length > 0 ? trimmedUrl : null,
        },
      },
      {
        onSuccess: () => {
          handleClose();
        },
        onError: err => {
          Alert.alert('Không thể cập nhật', availabilityErrorMessage(err));
        },
      },
    );
  };

  const handleDelete = () => {
    Alert.alert(
      'Xóa khung giờ',
      `Bạn có chắc chắn muốn xóa khung giờ ${rule.startTime} – ${rule.endTime} của ${dayOfWeekName(rule.dayOfWeek)}?`,
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: () => {
            deleteMutation.mutate(rule.id, {
              onSuccess: () => {
                handleClose();
              },
              onError: err => {
                Alert.alert('Không thể xóa', availabilityErrorMessage(err));
              },
            });
          },
        },
      ],
    );
  };

  return (
    <Sheet
      visible={visible}
      onClose={handleClose}
      dismissable={!isBusy}
      backdropLabel="Đóng bảng sửa khung giờ"
      title={`Khung giờ ${dayOfWeekName(rule.dayOfWeek)}`}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={styles.scrollContent}
      >
        {/* Time range */}
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

        {/* Meeting link */}
        <View style={styles.formGroup}>
          <Field
            label="Link phòng họp online (tuỳ chọn)"
            placeholder="https://zoom.us/j/... hoặc để trống nếu trực tiếp"
            value={meetingUrl}
            onChangeText={setMeetingUrl}
            error={errors.meetingUrl}
          />
        </View>

        {/* Actions */}
        <View style={styles.actionButtons}>
          <Button
            variant="primary"
            title="Lưu thay đổi"
            loading={updateMutation.isPending}
            disabled={isBusy}
            onPress={handleSave}
          />
          <Button
            variant="quiet"
            title="Xóa khung giờ này"
            loading={deleteMutation.isPending}
            disabled={isBusy}
            onPress={handleDelete}
            textStyle={styles.deleteButtonText}
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
  deleteButtonText: {
    color: colors.err,
  },
});
