import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import {
  NavPill,
  SectionHeader,
  StatRow,
} from '../../components/AppPrimitives';
import { RevealView, StatusPill } from '../../components/AuthPrimitives';
import { Glass } from '../../components/Glass';
import { GlowBackground } from '../../components/GlowBackground';
import { OhLogo } from '../../components/Icons';
import { Pressable3D } from '../../components/Pressable3D';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

export interface SuggestedSlotItem {
  id: string;
  lecturerId: string;
  lecturerName: string;
  photoUrl: string;
  timeLabel: string; // VD: "Thứ Năm · 09:30"
}

export interface NextBookingCardData {
  id: string;
  lecturerName: string;
  photoUrl: string;
  timeAndRoom: string; // VD: "Thứ Tư 18/11 · 14:00 · 306.B11"
  topic: string;
  statusLabel: string;
}

interface StudentDashboardScreenProps {
  studentFirstName?: string;
  studentAvatarUrl?: string;
  stats?: { scheduled: number; pending: number; waitlisted: number };
  nextBooking?: NextBookingCardData | null;
  suggestedSlots?: SuggestedSlotItem[];
  onPressAvatar?: () => void;
  onPressNextBooking?: (bookingId: string) => void;
  onPressSeeAllLecturers?: () => void;
  onPressSuggestedSlot?: (item: SuggestedSlotItem) => void;
  onSelectTab?: (tab: string) => void;
}

const DEFAULT_SUGGESTED: SuggestedSlotItem[] = [
  {
    id: 's1',
    lecturerId: 'gv-ha',
    lecturerName: 'TS. Trần Thu Hà',
    photoUrl: 'https://i.pravatar.cc/300?img=47',
    timeLabel: 'Thứ Năm · 09:30',
  },
  {
    id: 's2',
    lecturerId: 'gv-hoang',
    lecturerName: 'ThS. Lê Hoàng',
    photoUrl: 'https://i.pravatar.cc/300?img=12',
    timeLabel: 'Thứ Năm · 13:00',
  },
  {
    id: 's3',
    lecturerId: 'gv-thu',
    lecturerName: 'ThS. Phạm Anh Thư',
    photoUrl: 'https://i.pravatar.cc/300?img=32',
    timeLabel: 'Thứ Sáu · 10:00',
  },
];

export function StudentDashboardScreen({
  studentFirstName = 'Bảo',
  studentAvatarUrl = 'https://i.pravatar.cc/120?img=68',
  stats = { scheduled: 3, pending: 1, waitlisted: 2 },
  nextBooking = {
    id: 'bk-1',
    lecturerName: 'TS. Nguyễn Minh Khoa',
    photoUrl: 'https://i.pravatar.cc/600?img=11',
    timeAndRoom: 'Thứ Tư 18/11 · 14:00 · 306.B11',
    topic: 'Góp ý đề cương đồ án',
    statusLabel: 'Đã xác nhận',
  },
  suggestedSlots = DEFAULT_SUGGESTED,
  onPressAvatar,
  onPressNextBooking,
  onPressSeeAllLecturers,
  onPressSuggestedSlot,
  onSelectTab,
}: StudentDashboardScreenProps) {
  return (
    <View style={styles.root}>
      <GlowBackground tone="indigo" position="tl" />

      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* AppHead */}
          <View style={styles.appHead}>
            <OhLogo size={30} color={colors.fg} />
            <Pressable onPress={onPressAvatar}>
              <Image
                source={{ uri: studentAvatarUrl }}
                style={styles.topAvatar}
                contentFit="cover"
              />
            </Pressable>
          </View>

          <RevealView index={0}>
            <Text style={[typography.sm, { marginTop: 8 }]}>
              Chào {studentFirstName}, tuần này bạn có
            </Text>
          </RevealView>

          <RevealView index={1}>
            <StatRow
              style={{ marginTop: 8 }}
              items={[
                { value: stats.scheduled, label: 'lịch hẹn' },
                { value: stats.pending, label: 'đang chờ duyệt' },
                { value: stats.waitlisted, label: 'trong hàng đợi' },
              ]}
            />
          </RevealView>

          {/* Buổi hẹn tiếp theo (Feature card kiểu hero) */}
          {nextBooking && (
            <>
              <RevealView index={2}>
                <SectionHeader title="Buổi hẹn tiếp theo" />
              </RevealView>

              <RevealView index={3}>
                <Pressable3D
                  maxTilt={3}
                  onPress={() => onPressNextBooking?.(nextBooking.id)}
                >
                  <View style={[styles.featureCard, squircle(24)]}>
                    <Image
                      source={{ uri: nextBooking.photoUrl }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      contentPosition="top"
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.92)']}
                      locations={[0.25, 1]}
                      style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.featureTopRight}>
                      <Glass borderRadius={radius.pill}>
                        <StatusPill
                          glyph="ok"
                          label={nextBooking.statusLabel}
                          tone="done"
                        />
                      </Glass>
                    </View>

                    <View style={styles.featureOverlay}>
                      <Text
                        style={[
                          typography.eyebrow,
                          { color: 'rgba(255,255,255,0.75)' },
                        ]}
                      >
                        {nextBooking.timeAndRoom}
                      </Text>
                      <Text style={[typography.h2, { marginTop: 4 }]}>
                        {nextBooking.lecturerName}
                      </Text>
                      <Text
                        style={[
                          typography.sm,
                          { color: 'rgba(255,255,255,0.7)', marginTop: 2 },
                        ]}
                      >
                        {nextBooking.topic}
                      </Text>
                    </View>
                  </View>
                </Pressable3D>
              </RevealView>
            </>
          )}

          {/* Gợi ý cho bạn (Shelf cuộn ngang) */}
          <RevealView index={4}>
            <SectionHeader
              title="Gợi ý cho bạn"
              showChevron
              onPress={onPressSeeAllLecturers}
            />
          </RevealView>

          <RevealView index={5}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.shelfRow}
              style={{ marginHorizontal: -18 }}
            >
              {suggestedSlots.map((item) => (
                <Pressable3D
                  key={item.id}
                  onPress={() => onPressSuggestedSlot?.(item)}
                >
                  <View style={styles.shelfItem}>
                    <Image
                      source={{ uri: item.photoUrl }}
                      style={[styles.shelfImg, squircle(radius.lg)]}
                      contentFit="cover"
                    />
                    <Text numberOfLines={1} style={styles.shelfName}>
                      {item.lecturerName}
                    </Text>
                    <Text numberOfLines={1} style={styles.shelfSub}>
                      {item.timeLabel}
                    </Text>
                  </View>
                </Pressable3D>
              ))}
            </ScrollView>
          </RevealView>
        </ScrollView>
      </SafeAreaView>

      <NavPill role="sv" activeTab="home" onSelectTab={onSelectTab} />
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
  topAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.s3,
  },
  featureCard: {
    height: 236,
    overflow: 'hidden',
    backgroundColor: colors.s1,
    position: 'relative',
  },
  featureTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
  },
  featureOverlay: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    zIndex: 2,
  },
  shelfRow: {
    paddingHorizontal: 18,
    gap: 12,
  },
  shelfItem: {
    width: 132,
  },
  shelfImg: {
    width: 132,
    height: 150,
    backgroundColor: colors.s2,
  },
  shelfName: {
    fontFamily: fontFamily.bold,
    fontSize: 13.5,
    letterSpacing: ls(13.5, -0.03),
    color: colors.fg,
    marginTop: 8,
  },
  shelfSub: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.fg3,
    marginTop: 2,
  },
});