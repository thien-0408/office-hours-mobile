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
import { useAddScheduleEntry } from '../../../api/hooks';
import type { ScheduleLocationType } from '../../../api/domainTypes';
import { Button } from '../../../components/Button';
import { Field } from '../../../components/Field';
import { Seg, type SegOption } from '../../../components/Seg';
import { colors, fonts, radius, space } from '../../../theme';
import {
  scheduleErrorMessage,
  validateScheduleEntryInput,
} from '../scheduleLogic';
import { TimeSelector } from './TimeSelector';

export interface AddScheduleEntrySheetProps {
  visible: boolean;
  defaultDayOfWeek?: number;
  onClose: () => void;
}

const DAY_OPTIONS: SegOption[] = [
  { value: '1', label: 'T2' },
  { value: '2', label: 'T3' },
  { value: '3', label: 'T4' },
  { value: '4', label: 'T5' },
  { value: '5', label: 'T6' },
  { value: '6', label: 'T7' },
  { value: '7', label: 'CN' },
];

const LOCATION_OPTIONS: SegOption[] = [
  { value: 'ROOM', label: 'Phòng học' },
  { value: 'LAB', label: 'Thực hành' },
  { value: 'ONLINE', label: 'Online' },
];

export function AddScheduleEntrySheet({
  visible,
  defaultDayOfWeek = 1,
  onClose,
}: AddScheduleEntrySheetProps) {
  const insets = useSafeAreaInsets();
  const addMutation = useAddScheduleEntry();

  const [dayOfWeek, setDayOfWeek] = useState<number>(defaultDayOfWeek);
  const [startTime, setStartTime] = useState('07:30');
  const [endTime, setEndTime] = useState('09:30');
  const [title, setTitle] = useState('');
  const [room, setRoom] = useState('');
  const [locationType, setLocationType] = useState<ScheduleLocationType>('ROOM');
  const [lecturerName, setLecturerName] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleDayChange = (val: string) => {
    setDayOfWeek(parseInt(val, 10));
  };

  const handleClose = () => {
    setErrors({});
    onClose();
  };

  const handleSave = () => {
    const trimmedTitle = title.trim();
    const trimmedRoom = room.trim();
    const trimmedLecturer = lecturerName.trim();

    const validation = validateScheduleEntryInput({
      title: trimmedTitle,
      dayOfWeek,
      startTime,
      endTime,
      room: trimmedRoom,
    });

    if (!validation.valid) {
      setErrors(validation.errors);
      return;
    }

    setErrors({});

    addMutation.mutate(
      {
        title: trimmedTitle,
        dayOfWeek,
        startTime,
        endTime,
        room: trimmedRoom, // backend accepts empty string
        locationType,
        lecturerName: trimmedLecturer.length > 0 ? trimmedLecturer : undefined,
      },
      {
        onSuccess: () => {
          setTitle('');
          setRoom('');
          setLecturerName('');
          handleClose();
        },
        onError: err => {
          Alert.alert('Không thể thêm', scheduleErrorMessage(err));
        },
      },
    );
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
          onPress={addMutation.isPending ? undefined : handleClose}
          accessibilityLabel="Đóng bảng thêm lịch"
        />

        <View
          style={[
            styles.sheet,
            { paddingBottom: Math.max(insets.bottom, 16) + space.md },
          ]}
        >
          <View style={styles.handle} />

          <Text style={styles.title}>Thêm lịch bận</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
          >
            <View style={styles.formGroup}>
              <Text style={styles.label}>Thứ trong tuần</Text>
              <Seg
                options={DAY_OPTIONS}
                value={String(dayOfWeek)}
                onChange={handleDayChange}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Khung giờ</Text>
              <TimeSelector
                startTime={startTime}
                endTime={endTime}
                onChangeStartTime={setStartTime}
                onChangeEndTime={setEndTime}
                error={errors.endTime || errors.startTime}
              />
            </View>

            <View style={styles.formGroup}>
              <Field
                label="Tiêu đề môn học / công việc"
                placeholder="VD: Lập trình Web, Họp đồ án..."
                value={title}
                onChangeText={text => {
                  setTitle(text);
                  if (errors.title) {
                    setErrors(prev => ({ ...prev, title: '' }));
                  }
                }}
                error={errors.title}
              />
            </View>

            <View style={styles.formGroup}>
              <Field
                label="Phòng học / Vị trí"
                placeholder="VD: A1.203, B11.105 (tuỳ chọn)"
                value={room}
                onChangeText={setRoom}
                error={errors.room}
              />
            </View>

            <View style={styles.formGroup}>
              <Text style={styles.label}>Hình thức</Text>
              <Seg
                options={LOCATION_OPTIONS}
                value={locationType}
                onChange={val => setLocationType(val as ScheduleLocationType)}
              />
            </View>

            <View style={styles.formGroup}>
              <Field
                label="Giảng viên phụ trách (tuỳ chọn)"
                placeholder="VD: TS. Nguyễn Minh Khoa"
                value={lecturerName}
                onChangeText={setLecturerName}
              />
            </View>

            <View style={styles.actionButtons}>
              <Button
                variant="primary"
                title="Lưu lịch bận"
                loading={addMutation.isPending}
                disabled={addMutation.isPending}
                onPress={handleSave}
              />
              <Button
                variant="quiet"
                title="Hủy"
                disabled={addMutation.isPending}
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
    maxHeight: '90%',
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
  actionButtons: {
    gap: space.sm,
    marginTop: space.sm,
  },
});
