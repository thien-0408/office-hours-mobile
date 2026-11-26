import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppRole, NavPill } from '../../components/AppPrimitives';
import { IconButton, RevealView } from '../../components/AuthPrimitives';
import { DayItem, DayStrip } from '../../components/BookingPrimitives';
import { MonoIcon } from '../../components/Icons';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

const START_HOUR = 7;
const END_HOUR = 16;
const HOUR_HEIGHT = 54;

const SCHEDULE_DAYS: DayItem[] = [
  { key: '2026-11-16', weekday: 'T2', dayNum: '16' },
  { key: '2026-11-17', weekday: 'T3', dayNum: '17' },
  { key: '2026-11-18', weekday: 'T4', dayNum: '18' },
  { key: '2026-11-19', weekday: 'T5', dayNum: '19' },
  { key: '2026-11-20', weekday: 'T6', dayNum: '20' },
];

export interface AgendaBlockItem {
  id: string;
  dayKey: string;
  startMinutes: number; // Tính từ 00:00 (VD: 7*60 + 30 = 450)
  endMinutes: number;
  title: string;
  subtitle?: string;
  isBooking?: boolean;
}

const SAMPLE_AGENDA: AgendaBlockItem[] = [
  {
    id: 'ag-1',
    dayKey: '2026-11-18',
    startMinutes: 7 * 60 + 30,
    endMinutes: 9 * 60 + 30,
    title: 'Lập trình Web',
    subtitle: '07:30 – 09:30 · A1.203',
  },
  {
    id: 'ag-2',
    dayKey: '2026-11-18',
    startMinutes: 10 * 60,
    endMinutes: 12 * 60,
    title: 'Cấu trúc dữ liệu',
    subtitle: '10:00 – 12:00 · B11.105',
  },
  {
    id: 'ag-3',
    dayKey: '2026-11-18',
    startMinutes: 14 * 60,
    endMinutes: 14 * 60 + 25,
    title: '14:00 · Hẹn TS. Nguyễn Minh Khoa',
    isBooking: true,
  },
];

interface MyScheduleScreenProps {
  role?: AppRole;
  entries?: AgendaBlockItem[];
  currentTimeMinutes?: number; // VD: 14*60 + 25 = 865
  onOpenManualAdd?: () => void;
  onOpenScanTimetable?: () => void;
  onPressEntry?: (entry: AgendaBlockItem) => void;
  onSelectTab?: (tab: string) => void;
}

export function MyScheduleScreen({
  role = 'sv',
  entries = SAMPLE_AGENDA,
  currentTimeMinutes = 14 * 60 + 25,
  onOpenManualAdd,
  onOpenScanTimetable,
  onPressEntry,
  onSelectTab,
}: MyScheduleScreenProps) {
  const [selectedDay, setSelectedDay] = useState('2026-11-18');
  const [addMenuOpen, setAddMenuOpen] = useState(false);

  const hours = Array.from(
    { length: END_HOUR - START_HOUR + 1 },
    (_, i) => START_HOUR + i,
  );

  const dayEntries = entries.filter((e) => e.dayKey === selectedDay);
  const nowTop = ((currentTimeMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* AppHead */}
          <View style={styles.appHead}>
            <RevealView index={0}>
              <Text style={styles.pageTitle}>Lịch của tôi</Text>
            </RevealView>
            <IconButton icon="plus" onPress={() => setAddMenuOpen(true)} />
          </View>

          <RevealView index={1} style={{ marginTop: 8 }}>
            <DayStrip
              days={SCHEDULE_DAYS}
              selectedKey={selectedDay}
              onSelect={setSelectedDay}
            />
          </RevealView>

          {/* Agenda timeline */}
          <RevealView index={2} style={styles.agendaWrap}>
            {hours.map((h) => (
              <View key={h} style={styles.hourRow}>
                <Text style={styles.hourLabel}>
                  {String(h).padStart(2, '0')}:00
                </Text>
                <View style={styles.hourLine} />
              </View>
            ))}

            {/* Khối giờ học (xám) & lịch hẹn (trắng) */}
            {dayEntries.map((ev) => {
              const top =
                ((ev.startMinutes - START_HOUR * 60) / 60) * HOUR_HEIGHT;
              const height = Math.max(
                22,
                ((ev.endMinutes - ev.startMinutes) / 60) * HOUR_HEIGHT,
              );
              const compact = height <= 28;

              return (
                <Pressable
                  key={ev.id}
                  onPress={() => onPressEntry?.(ev)}
                  style={[
                    styles.eventBlock,
                    squircle(radius.md),
                    { top, height },
                    ev.isBooking && styles.eventBooking,
                    compact && styles.eventCompact,
                  ]}
                >
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.eventTitle,
                      ev.isBooking && { color: '#000000' },
                      compact && { fontSize: 12 },
                    ]}
                  >
                    {ev.title}
                  </Text>
                  {ev.subtitle && !compact && (
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.eventSub,
                        ev.isBooking && { color: 'rgba(0,0,0,0.65)' },
                      ]}
                    >
                      {ev.subtitle}
                    </Text>
                  )}
                </Pressable>
              );
            })}

            {/* Vạch giờ hiện tại */}
            {nowTop >= 0 && nowTop <= hours.length * HOUR_HEIGHT && (
              <View
                pointerEvents="none"
                style={[styles.nowLine, { top: nowTop }]}
              >
                <View style={styles.nowDot} />
              </View>
            )}
          </RevealView>
        </ScrollView>
      </SafeAreaView>

      {/* Menu nút + : Nhập tay hoặc Quét thời khóa biểu */}
      <Modal
        visible={addMenuOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setAddMenuOpen(false)}
      >
        <Pressable
          style={styles.scrim}
          onPress={() => setAddMenuOpen(false)}
        >
          <View style={[styles.sheet, squircle(radius.sheet)]}>
            <View style={styles.grab} />
            <Text style={[typography.h2, { marginBottom: 12 }]}>
              Thêm lịch bận
            </Text>

            <Pressable
              onPress={() => {
                setAddMenuOpen(false);
                onOpenScanTimetable?.();
              }}
              style={styles.menuRow}
            >
              <View style={{ flex: 1 }}>
                <Text style={typography.body}>Quét thời khóa biểu</Text>
                <Text style={typography.xs}>
                  Chụp ảnh TKB từ cổng thông tin, đọc tự động trên máy
                </Text>
              </View>
              <MonoIcon name="right" size={16} color={colors.fg3} />
            </Pressable>

            <Pressable
              onPress={() => {
                setAddMenuOpen(false);
                onOpenManualAdd?.();
              }}
              style={[styles.menuRow, { borderBottomWidth: 0 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={typography.body}>Nhập giờ bận thủ công</Text>
                <Text style={typography.xs}>
                  Thêm một buổi học hoặc lịch cố định hằng tuần
                </Text>
              </View>
              <MonoIcon name="right" size={16} color={colors.fg3} />
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      <NavPill role={role} activeTab="book" onSelectTab={onSelectTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 120,
  },
  appHead: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pageTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    letterSpacing: ls(28, -0.055),
    color: colors.fg,
  },
  agendaWrap: {
    marginTop: 20,
    position: 'relative',
  },
  hourRow: {
    height: HOUR_HEIGHT,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  hourLabel: {
    width: 38,
    fontFamily: fontFamily.medium,
    fontSize: 11,
    fontVariant: ['tabular-nums'],
    color: colors.fg3,
    marginTop: -6,
  },
  hourLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.line,
  },
  eventBlock: {
    position: 'absolute',
    left: 48,
    right: 0,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line2,
    paddingHorizontal: 12,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  eventBooking: {
    backgroundColor: colors.primary,
    borderWidth: 0,
  },
  eventCompact: {
    paddingVertical: 2,
  },
  eventTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 13.5,
    letterSpacing: ls(13.5, -0.025),
    color: colors.fg,
  },
  eventSub: {
    fontFamily: fontFamily.medium,
    fontSize: 11.5,
    color: colors.fg3,
    marginTop: 2,
  },
  nowLine: {
    position: 'absolute',
    left: 48,
    right: 0,
    height: 1.5,
    backgroundColor: colors.fg,
  },
  nowDot: {
    position: 'absolute',
    left: -4,
    top: -3.5,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.fg,
  },
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
    paddingBottom: 34,
  },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.fg4,
    alignSelf: 'center',
    marginBottom: 18,
  },
  menuRow: {
    minHeight: 62,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
});