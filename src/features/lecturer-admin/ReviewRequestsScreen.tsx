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
import { Image } from 'expo-image';
import { NavPill } from '../../components/AppPrimitives';
import {
  AppField,
  PillButton,
  RevealView,
  ToastBanner,
} from '../../components/AuthPrimitives';
import { Glass } from '../../components/Glass';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

export interface PendingBookingRequest {
  id: string;
  studentName: string;
  studentAvatarUrl: string;
  slotAndAge: string; // VD: "Thứ Năm 19/11 · 09:00 · gửi 2 giờ trước"
  reasonQuote: string;
}

export interface SlotWaitlistGroup {
  id: string;
  slotLabel: string;
  waitingCount: number;
  firstStudentName: string;
}

const SAMPLE_REQUESTS: PendingBookingRequest[] = [
  {
    id: 'req-1',
    studentName: 'Võ Minh Tuấn',
    studentAvatarUrl: 'https://i.pravatar.cc/120?img=14',
    slotAndAge: 'Thứ Năm 19/11 · 09:00 · gửi 2 giờ trước',
    reasonQuote: 'Em muốn hỏi về cách chia module cho đồ án nhóm 4 người.',
  },
  {
    id: 'req-2',
    studentName: 'Nguyễn Ngọc Anh',
    studentAvatarUrl: 'https://i.pravatar.cc/120?img=26',
    slotAndAge: 'Thứ Năm 19/11 · 09:20 · gửi 3 giờ trước',
    reasonQuote: 'Xin góp ý chủ đề khóa luận.',
  },
];

const SAMPLE_WAITLIST: SlotWaitlistGroup[] = [
  {
    id: 'sw-1',
    slotLabel: 'Thứ Năm 19/11 · 09:00',
    waitingCount: 2,
    firstStudentName: 'Trần Quang Minh đang đứng #1',
  },
  {
    id: 'sw-2',
    slotLabel: 'Thứ Năm 19/11 · 10:20',
    waitingCount: 1,
    firstStudentName: 'Lê Khánh Linh đang đứng #1',
  },
];

interface ReviewRequestsScreenProps {
  initialRequests?: PendingBookingRequest[];
  waitlistGroups?: SlotWaitlistGroup[];
  onConfirmRequest?: (bookingId: string) => Promise<void>;
  onDeclineRequest?: (bookingId: string, reason: string) => Promise<void>;
  onSelectTab?: (tab: string) => void;
}

export function ReviewRequestsScreen({
  initialRequests = SAMPLE_REQUESTS,
  waitlistGroups = SAMPLE_WAITLIST,
  onConfirmRequest,
  onDeclineRequest,
  onSelectTab,
}: ReviewRequestsScreenProps) {
  const [tab, setTab] = useState<'PENDING' | 'WAITLIST'>('PENDING');
  const [requests, setRequests] = useState(initialRequests);
  const [decliningItem, setDecliningItem] =
    useState<PendingBookingRequest | null>(null);
  const [declineReason, setDeclineReason] = useState('');
  const [conflictToast, setConflictToast] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const handleConfirm = async (item: PendingBookingRequest) => {
    if (busyId) return;
    setBusyId(item.id);
    setConflictToast(null);
    try {
      await onConfirmRequest?.(item.id);
      setRequests((prev) => prev.filter((r) => r.id !== item.id));
    } catch (err: any) {
      if (err?.code === 'SLOT_ALREADY_CONFIRMED') {
        setConflictToast('Slot này vừa được xác nhận cho người khác.');
      } else if (err?.code === 'SLOT_HELD_FOR_WAITLIST') {
        setConflictToast('Slot đang được giữ ưu tiên cho người trong hàng đợi.');
      }
    } finally {
      setBusyId(null);
    }
  };

  const handleConfirmDecline = async () => {
    if (!decliningItem || busyId) return;
    setBusyId(decliningItem.id);
    try {
      await onDeclineRequest?.(decliningItem.id, declineReason.trim());
      setRequests((prev) => prev.filter((r) => r.id !== decliningItem.id));
      setDecliningItem(null);
      setDeclineReason('');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        {conflictToast && (
          <ToastBanner
            glyph="warn"
            title="Không thể duyệt"
            subtitle={conflictToast}
          />
        )}

        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.appHead}>
            <RevealView index={0}>
              <Text style={styles.pageTitle}>Duyệt</Text>
            </RevealView>
          </View>

          {/* Segmented 2 tab */}
          <RevealView index={1} style={styles.seg2}>
            <Pressable
              onPress={() => setTab('PENDING')}
              style={[styles.segTab, tab === 'PENDING' && styles.segTabOn]}
            >
              <Text
                style={[
                  styles.segText,
                  tab === 'PENDING' && styles.segTextOn,
                ]}
              >
                Chờ duyệt{' '}
                <Text style={{ color: colors.fg3 }}>{requests.length}</Text>
              </Text>
            </Pressable>

            <Pressable
              onPress={() => setTab('WAITLIST')}
              style={[styles.segTab, tab === 'WAITLIST' && styles.segTabOn]}
            >
              <Text
                style={[
                  styles.segText,
                  tab === 'WAITLIST' && styles.segTextOn,
                ]}
              >
                Hàng đợi{' '}
                <Text style={{ color: colors.fg3 }}>
                  {waitlistGroups.reduce((acc, g) => acc + g.waitingCount, 0)}
                </Text>
              </Text>
            </Pressable>
          </RevealView>

          {tab === 'PENDING' ? (
            <View style={{ marginTop: 16, gap: 10 }}>
              {requests.map((item, idx) => (
                <RevealView
                  key={item.id}
                  index={idx + 2}
                  style={[styles.card, squircle(radius.card)]}
                >
                  <View style={styles.cardHeader}>
                    <Image
                      source={{ uri: item.studentAvatarUrl }}
                      style={[styles.avatarMd, squircle(14)]}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[typography.h3, { fontFamily: fontFamily.bold }]}
                      >
                        {item.studentName}
                      </Text>
                      <Text style={typography.xs}>{item.slotAndAge}</Text>
                    </View>
                  </View>

                  <Text style={styles.quoteText}>
                    "{item.reasonQuote}"
                  </Text>

                  <View style={styles.btnRow}>
                    <Pressable
                      onPress={() => {
                        setDecliningItem(item);
                        setDeclineReason('');
                      }}
                      style={{ flex: 1 }}
                    >
                      <Glass borderRadius={radius.pill} style={styles.smBtn}>
                        <Text style={styles.ghostBtnText}>Từ chối</Text>
                      </Glass>
                    </Pressable>

                    <Pressable
                      onPress={() => handleConfirm(item)}
                      style={[styles.smBtn, styles.lightBtn, { flex: 1 }]}
                    >
                      <Text style={styles.lightBtnText}>Duyệt</Text>
                    </Pressable>
                  </View>
                </RevealView>
              ))}
            </View>
          ) : (
            <View style={{ marginTop: 16, gap: 10 }}>
              {waitlistGroups.map((wl, idx) => (
                <RevealView
                  key={wl.id}
                  index={idx + 2}
                  style={[styles.card, squircle(radius.card)]}
                >
                  <View style={styles.wlHeader}>
                    <Text style={[typography.h3, { fontFamily: fontFamily.bold }]}>
                      {wl.slotLabel}
                    </Text>
                    <Text style={styles.wlCount}>
                      {wl.waitingCount} người
                    </Text>
                  </View>
                  <Text style={[typography.sm, { marginTop: 4 }]}>
                    {wl.firstStudentName}
                  </Text>
                </RevealView>
              ))}
            </View>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* Sheet nhập lý do từ chối */}
      <Modal
        visible={Boolean(decliningItem)}
        transparent
        animationType="slide"
        onRequestClose={() => setDecliningItem(null)}
      >
        <View style={styles.scrim}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setDecliningItem(null)}
          />
          {decliningItem && (
            <View style={[styles.sheet, squircle(radius.sheet)]}>
              <View style={styles.grab} />
              <Text style={typography.h2}>Từ chối yêu cầu</Text>
              <Text style={[typography.sm, { marginTop: 4 }]}>
                Gửi lý do ngắn cho {decliningItem.studentName} để bạn ấy đặt slot khác.
              </Text>

              <View style={{ marginTop: 16 }}>
                <AppField
                  label="Lý do từ chối"
                  placeholder="Trùng lịch họp khoa, em đặt sang thứ Sáu nhé"
                  value={declineReason}
                  onChangeText={setDeclineReason}
                />
              </View>

              <PillButton
                title="Xác nhận từ chối"
                disabled={!declineReason.trim()}
                loading={busyId === decliningItem.id}
                onPress={handleConfirmDecline}
                style={{ marginTop: 18 }}
              />
            </View>
          )}
        </View>
      </Modal>

      <NavPill
        role="gv"
        activeTab="review"
        badges={{ review: requests.length }}
        onSelectTab={onSelectTab}
      />
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
    justifyContent: 'center',
  },
  pageTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 28,
    letterSpacing: ls(28, -0.055),
    color: colors.fg,
  },
  seg2: {
    marginTop: 8,
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
  card: {
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarMd: {
    width: 48,
    height: 48,
    backgroundColor: colors.s3,
  },
  quoteText: {
    ...typography.sm,
    color: colors.fg,
    marginTop: 12,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
  smBtn: {
    height: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.fg,
  },
  lightBtn: {
    backgroundColor: '#FFFFFF',
  },
  lightBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: '#000000',
  },
  wlHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  wlCount: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    color: colors.fg,
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
});