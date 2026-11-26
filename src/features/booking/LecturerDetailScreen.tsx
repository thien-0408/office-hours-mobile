import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { SectionHeader } from '../../components/AppPrimitives';
import { IconButton, RevealView } from '../../components/AuthPrimitives';
import {
  DayItem,
  DayStrip,
  SlotGrid,
  SlotPillItem,
} from '../../components/BookingPrimitives';
import { Pressable3D } from '../../components/Pressable3D';
import {
  colors,
  fontFamily,
  ls,
  radius,
  typography,
} from '../../theme/tokens';

const WEEK_DAYS: DayItem[] = [
  { key: '2026-11-16', weekday: 'T2', dayNum: '16', disabled: true },
  { key: '2026-11-17', weekday: 'T3', dayNum: '17' },
  { key: '2026-11-18', weekday: 'T4', dayNum: '18' },
  { key: '2026-11-19', weekday: 'T5', dayNum: '19' },
  { key: '2026-11-20', weekday: 'T6', dayNum: '20' },
];

const SAMPLE_SLOTS: SlotPillItem[] = [
  { id: 'sl-1', time: '09:00', status: 'full' },
  { id: 'sl-2', time: '09:20', status: 'available' },
  { id: 'sl-3', time: '09:40', status: 'available' },
  { id: 'sl-4', time: '10:00', status: 'available' },
  { id: 'sl-5', time: '10:20', status: 'full' },
  { id: 'sl-6', time: '10:40', status: 'available' },
];

interface LecturerDetailScreenProps {
  eyebrow?: string;
  displayName?: string;
  photoUrl?: string;
  statusLine?: string;
  weekTitle?: string;
  weekRange?: string;
  onBack?: () => void;
  onPressMore?: () => void;
  onOpenBookSheet?: (slot: SlotPillItem, dayKey: string) => void;
  onOpenWaitlistPrompt?: (slot: SlotPillItem, dayKey: string) => void;
}

export function LecturerDetailScreen({
  eyebrow = 'Tiến sĩ · Khoa CNTT · 306.B11',
  displayName = 'Nguyễn\nMinh Khoa',
  photoUrl = 'https://i.pravatar.cc/800?img=11',
  statusLine = 'Đang ở phòng · trả lời trong ngày',
  weekTitle = 'Tuần 47',
  weekRange = '16–22/11',
  onBack,
  onPressMore,
  onOpenBookSheet,
  onOpenWaitlistPrompt,
}: LecturerDetailScreenProps) {
  const [selectedDay, setSelectedDay] = useState('2026-11-19');
  const [selectedSlotId, setSelectedSlotId] = useState('sl-3');

  const activeSlot = SAMPLE_SLOTS.find((s) => s.id === selectedSlotId);

  const handleSlotPress = (slot: SlotPillItem) => {
    if (slot.status === 'full') {
      // Slot đã có người -> mời vào hàng đợi
      onOpenWaitlistPrompt?.(slot, selectedDay);
      return;
    }
    setSelectedSlotId(slot.id);
  };

  return (
    <View style={styles.root}>
      {/* Cover ảnh tràn viền */}
      <View pointerEvents="none" style={styles.cover}>
        <Image
          source={{ uri: photoUrl }}
          style={StyleSheet.absoluteFill}
          contentFit="cover"
          contentPosition="top"
        />
        <LinearGradient
          colors={[
            'rgba(0,0,0,0.4)',
            'rgba(0,0,0,0)',
            'rgba(0,0,0,0.45)',
            '#000000',
          ]}
          locations={[0, 0.28, 0.66, 1]}
          style={StyleSheet.absoluteFill}
        />
      </View>

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.appHead}>
            <IconButton icon="left" onPress={onBack} />
            <IconButton icon="more" onPress={onPressMore} />
          </View>

          <View style={{ height: 185 }} />

          <RevealView index={0}>
            <Text style={typography.eyebrow}>{eyebrow}</Text>
          </RevealView>
          <RevealView index={1}>
            <Text style={[styles.tName, { marginTop: 8 }]}>{displayName}</Text>
          </RevealView>

          {/* Nút "Đặt lịch" ở chỗ nút Play */}
          <RevealView index={2} style={styles.playRow}>
            <Pressable3D
              onPress={() =>
                activeSlot && onOpenBookSheet?.(activeSlot, selectedDay)
              }
            >
              <View style={styles.lightBtn}>
                <Text style={styles.lightBtnText}>Đặt lịch</Text>
              </View>
            </Pressable3D>
            <Text style={[typography.sm, { flex: 1 }]} numberOfLines={1}>
              {statusLine}
            </Text>
          </RevealView>

          <RevealView index={3}>
            <SectionHeader
              title={weekTitle}
              moreText={weekRange}
              style={{ marginTop: 22 }}
            />
          </RevealView>

          <RevealView index={4}>
            <DayStrip
              days={WEEK_DAYS}
              selectedKey={selectedDay}
              onSelect={setSelectedDay}
            />
          </RevealView>

          <RevealView index={5} style={{ marginTop: 12 }}>
            <SlotGrid
              slots={SAMPLE_SLOTS}
              selectedId={selectedSlotId}
              onSelectSlot={handleSlotPress}
            />
          </RevealView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  cover: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 430,
  },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  appHead: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tName: {
    fontFamily: fontFamily.bold,
    fontSize: 40,
    lineHeight: 39.2,
    letterSpacing: ls(40, -0.06),
    color: colors.fg,
  },
  playRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginTop: 14,
  },
  lightBtn: {
    height: 42,
    paddingHorizontal: 18,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  lightBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    letterSpacing: ls(14, -0.03),
    color: '#000000',
  },
});