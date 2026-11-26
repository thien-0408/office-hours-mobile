import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { PillButton } from '../../components/AuthPrimitives';
import {
  DayItem,
  DayStrip,
  SlotGrid,
  SlotPillItem,
} from '../../components/BookingPrimitives';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

const RESCHEDULE_DAYS: DayItem[] = [
  { key: 'Thứ Tư', weekday: 'T4', dayNum: '18' },
  { key: 'Thứ Năm', weekday: 'T5', dayNum: '19' },
  { key: 'Thứ Sáu', weekday: 'T6', dayNum: '20' },
  { key: 'Thứ Hai', weekday: 'T2', dayNum: '23' },
  { key: 'Thứ Ba', weekday: 'T3', dayNum: '24' },
];

const RESCHEDULE_SLOTS: SlotPillItem[] = [
  { id: 'rs-1', time: '14:00', status: 'available' },
  { id: 'rs-2', time: '14:20', status: 'available' },
  { id: 'rs-3', time: '14:40', status: 'full' },
  { id: 'rs-4', time: '15:00', status: 'available' },
  { id: 'rs-5', time: '15:20', status: 'available' },
  { id: 'rs-6', time: '15:40', status: 'full' },
];

interface RescheduleSheetProps {
  visible: boolean;
  currentSlotLabel: string; // VD: "Thứ Năm 19/11 · 15:00"
  onClose: () => void;
  onConfirmReschedule: (newSlotId: string) => Promise<void>;
}

export function RescheduleSheet({
  visible,
  currentSlotLabel = 'Thứ Năm 19/11 · 15:00',
  onClose,
  onConfirmReschedule,
}: RescheduleSheetProps) {
  const [selectedDay, setSelectedDay] = useState('Thứ Sáu');
  const [selectedSlotId, setSelectedSlotId] = useState('rs-2');
  const [loading, setLoading] = useState(false);

  const chosenSlot = RESCHEDULE_SLOTS.find((s) => s.id === selectedSlotId);

  const handleConfirm = async () => {
    if (!chosenSlot || loading) return;
    setLoading(true);
    try {
      await onConfirmReschedule(chosenSlot.id);
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
      <View style={styles.scrim}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

        <View style={[styles.sheet, squircle(radius.sheet)]}>
          <View style={styles.grab} />

          <Text style={typography.h2}>Đổi sang giờ khác</Text>
          <Text style={[typography.sm, { marginTop: 4 }]}>
            Cùng giảng viên. Giờ mới cần được duyệt lại.
          </Text>

          <DayStrip
            days={RESCHEDULE_DAYS}
            selectedKey={selectedDay}
            onSelect={setSelectedDay}
            style={{ marginTop: 16 }}
          />

          <SlotGrid
            slots={RESCHEDULE_SLOTS}
            selectedId={selectedSlotId}
            onSelectSlot={(s) => {
              if (s.status === 'available') setSelectedSlotId(s.id);
            }}
            style={{ marginTop: 12 }}
          />

          <View style={[styles.noteBox, squircle(radius.lg)]}>
            <Text style={styles.noteText}>
              Giờ hiện tại <Text style={styles.noteBold}>{currentSlotLabel}</Text> sẽ bị hủy ngay khi bạn đổi. Giờ mới cần giảng viên duyệt lại.
            </Text>
          </View>

          <PillButton
            title={
              chosenSlot
                ? `Đổi sang ${selectedDay} ${chosenSlot.time}`
                : 'Chọn giờ mới'
            }
            disabled={!chosenSlot}
            loading={loading}
            onPress={handleConfirm}
            style={{ marginTop: 16 }}
          />
        </View>
      </View>
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
  noteBox: {
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
  },
  noteText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 19.5,
    letterSpacing: ls(13, -0.01),
    color: colors.fg2,
  },
  noteBold: {
    fontFamily: fontFamily.bold,
    color: colors.fg,
  },
});