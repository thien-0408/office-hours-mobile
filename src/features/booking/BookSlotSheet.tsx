import React, { useEffect, useState } from 'react';
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
import { Image } from 'expo-image';
import {
  PillButton,
  StatusPill,
} from '../../components/AuthPrimitives';
import {
  DateBlock,
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

interface BookSlotSheetProps {
  visible: boolean;
  initialMode?: 'book' | 'taken';
  lecturerName: string;
  lecturerAvatarUrl: string;
  locationSubtitle: string; // VD: "Trực tiếp tại 306.B11"
  dayNumber: string;        // VD: "19"
  dateLine: string;         // VD: "Thứ Năm, tháng 11"
  timeRange: string;        // VD: "09:40 – 10:00"
  nearbySlots?: SlotPillItem[];
  onClose: () => void;
  onSubmitBooking: (topic: string) => Promise<void>;
  onJoinWaitlist: () => Promise<void>;
  onPickAnotherSlot?: (slot: SlotPillItem) => void;
}

const DEFAULT_NEARBY: SlotPillItem[] = [
  { id: 'sl-3', time: '09:40', status: 'full' },
  { id: 'sl-4', time: '10:00', status: 'available' },
  { id: 'sl-6', time: '10:40', status: 'available' },
];

export function BookSlotSheet({
  visible,
  initialMode = 'book',
  lecturerName,
  lecturerAvatarUrl,
  locationSubtitle,
  dayNumber,
  dateLine,
  timeRange,
  nearbySlots = DEFAULT_NEARBY,
  onClose,
  onSubmitBooking,
  onJoinWaitlist,
  onPickAnotherSlot,
}: BookSlotSheetProps) {
  const [mode, setMode] = useState<'book' | 'taken'>(initialMode);
  const [topic, setTopic] = useState('');
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible) setMode(initialMode);
  }, [visible, initialMode]);

  const handleBook = async () => {
    if (!topic.trim() || loading) return;
    setLoading(true);
    try {
      await onSubmitBooking(topic.trim());
      onClose();
    } catch (err: any) {
      // 409 với details.waitlistAvailable: true
      if (err?.status === 409 && err?.details?.waitlistAvailable) {
        setMode('taken');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWaitlist = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await onJoinWaitlist();
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

          {mode === 'taken' ? (
            /* Khung 12b: Slot vừa có người */
            <View>
              <View style={{ alignSelf: 'flex-start', marginBottom: 14 }}>
                <StatusPill
                  glyph="warn"
                  label="Slot đã có người"
                  tone="done"
                />
              </View>

              <Text style={typography.h1}>
                {'Có người vừa\nđặt slot này.'}
              </Text>
              <Text style={[typography.sub, { marginTop: 10 }]}>
                Thứ Năm {dayNumber}/11 · {timeRange.split(' ')[0]}. Vào hàng đợi để được mời ngay khi slot trống, hoặc chọn giờ khác.
              </Text>

              <SlotGrid
                slots={nearbySlots}
                onSelectSlot={(s) => {
                  if (s.status === 'available') {
                    onPickAnotherSlot?.(s);
                    setMode('book');
                  }
                }}
                style={{ marginTop: 20 }}
              />

              <PillButton
                title="Vào hàng đợi"
                loading={loading}
                onPress={handleWaitlist}
                style={{ marginTop: 20 }}
              />
              <PillButton
                title="Chọn giờ khác"
                variant="quiet"
                onPress={onClose}
                style={{ marginTop: 8 }}
              />
            </View>
          ) : (
            /* Khung 12: Đặt lịch */
            <View>
              <View style={styles.lecRow}>
                <Image
                  source={{ uri: lecturerAvatarUrl }}
                  style={[styles.lecAvatar, squircle(14)]}
                  contentFit="cover"
                />
                <View style={{ flex: 1 }}>
                  <Text style={[typography.h3, { fontFamily: fontFamily.bold }]}>
                    {lecturerName}
                  </Text>
                  <Text style={typography.xs}>{locationSubtitle}</Text>
                </View>
              </View>

              <DateBlock
                dayNumber={dayNumber}
                line1={dateLine}
                timeRange={timeRange}
                style={{ marginTop: 20 }}
              />

              {/* Textarea */}
              <View
                style={[
                  styles.textareaBox,
                  squircle(radius.lg),
                  focused && styles.textareaFocus,
                ]}
              >
                <Text
                  style={[
                    styles.fieldLabel,
                    focused && { color: colors.fg2 },
                  ]}
                >
                  Bạn muốn trao đổi gì?
                </Text>
                <TextInput
                  multiline
                  value={topic}
                  onChangeText={setTopic}
                  onFocus={() => setFocused(true)}
                  onBlur={() => setFocused(false)}
                  placeholder="Góp ý phần thiết kế cơ sở dữ liệu trong đề cương đồ án"
                  placeholderTextColor={colors.fg4}
                  selectionColor={colors.fg}
                  style={styles.textareaInput}
                />
              </View>

              <Text style={styles.hint}>
                Giảng viên duyệt xong bạn sẽ nhận thông báo. Có thể hủy trước 24 giờ.
              </Text>

              <PillButton
                title="Gửi yêu cầu"
                disabled={!topic.trim()}
                loading={loading}
                onPress={handleBook}
                style={{ marginTop: 20 }}
              />
            </View>
          )}
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
  lecRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  lecAvatar: {
    width: 48,
    height: 48,
    backgroundColor: colors.s3,
  },
  textareaBox: {
    marginTop: 20,
    minHeight: 96,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 10,
  },
  textareaFocus: {
    borderColor: colors.focus,
  },
  fieldLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11.5,
    color: colors.fg3,
    marginBottom: 4,
  },
  textareaInput: {
    fontFamily: fontFamily.medium,
    fontSize: 15,
    lineHeight: 21.5,
    letterSpacing: ls(15, -0.015),
    color: colors.fg,
    padding: 0,
    textAlignVertical: 'top',
  },
  hint: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.fg3,
    paddingHorizontal: 4,
    paddingTop: 8,
  },
});