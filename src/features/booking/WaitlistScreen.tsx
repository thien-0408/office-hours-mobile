import React, { useEffect, useState } from 'react';
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
import { SectionHeader } from '../../components/AppPrimitives';
import {
  IconButton,
  RevealView,
  StatusPill,
} from '../../components/AuthPrimitives';
import { Glass } from '../../components/Glass';
import { GlowBackground } from '../../components/GlowBackground';
import { OdometerCountdown } from '../../components/Odometer';
import { Pressable3D } from '../../components/Pressable3D';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

export interface WaitlistOfferData {
  id: string;
  lecturerName: string;
  photoUrl: string;
  slotLabel: string; // VD: "Thứ Năm 19/11 · 09:30 · B4.110"
  secondsRemaining: number;
}

export interface WaitingEntryItem {
  id: string;
  lecturerName: string;
  photoUrl: string;
  slotLabel: string;
  position: number;
}

interface WaitlistScreenProps {
  offer?: WaitlistOfferData | null;
  waitingList?: WaitingEntryItem[];
  onBack?: () => void;
  onAcceptOffer?: (offerId: string) => Promise<void>;
  onDeclineOffer?: (offerId: string) => Promise<void>;
  onLeaveWaitlist?: (entryId: string) => void;
}

const SAMPLE_OFFER: WaitlistOfferData = {
  id: 'wl-offer-1',
  lecturerName: 'TS. Trần Thu Hà',
  photoUrl: 'https://i.pravatar.cc/600?img=47',
  slotLabel: 'Thứ Năm 19/11 · 09:30 · B4.110',
  secondsRemaining: 581, // 9:41
};

const SAMPLE_WAITING: WaitingEntryItem[] = [
  {
    id: 'wl-2',
    lecturerName: 'TS. Nguyễn Minh Khoa',
    photoUrl: 'https://i.pravatar.cc/120?img=11',
    slotLabel: 'Thứ Sáu 20/11 · 14:40',
    position: 2,
  },
  {
    id: 'wl-3',
    lecturerName: 'PGS. Đỗ Văn Sơn',
    photoUrl: 'https://i.pravatar.cc/120?img=53',
    slotLabel: 'Thứ Hai 23/11 · 08:00',
    position: 5,
  },
];

export function WaitlistScreen({
  offer = SAMPLE_OFFER,
  waitingList = SAMPLE_WAITING,
  onBack,
  onAcceptOffer,
  onDeclineOffer,
  onLeaveWaitlist,
}: WaitlistScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(
    offer?.secondsRemaining ?? 0,
  );

  useEffect(() => {
    if (!offer || secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [offer, secondsLeft]);

  return (
    <View style={styles.root}>
      <GlowBackground tone="brand" position="c" opacityOverride={0.28} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.appHead}>
            <IconButton icon="left" onPress={onBack} />
          </View>

          <RevealView index={0}>
            <Text style={[typography.h1, { marginTop: 8 }]}>Hàng đợi</Text>
          </RevealView>

          {/* Offer hero card */}
          {offer && (
            <>
              <RevealView index={1}>
                <Pressable3D maxTilt={3}>
                  <View style={[styles.offerCard, squircle(24)]}>
                    <Image
                      source={{ uri: offer.photoUrl }}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                      contentPosition="top"
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.92)']}
                      locations={[0.25, 1]}
                      style={StyleSheet.absoluteFill}
                    />

                    <View style={styles.offerTopRight}>
                      <Glass borderRadius={radius.pill}>
                        <StatusPill
                          glyph="offer"
                          label="Có slot cho bạn"
                          tone="done"
                        />
                      </Glass>
                    </View>

                    <View style={styles.offerOverlay}>
                      <Text
                        style={[
                          typography.eyebrow,
                          { color: 'rgba(255,255,255,0.75)' },
                        ]}
                      >
                        {offer.slotLabel}
                      </Text>
                      <Text style={[typography.h2, { marginTop: 4 }]}>
                        {offer.lecturerName}
                      </Text>

                      <View style={styles.offerActions}>
                        <Pressable
                          onPress={() => onAcceptOffer?.(offer.id)}
                          style={styles.acceptBtn}
                        >
                          <Text style={styles.acceptBtnText}>Nhận slot</Text>
                        </Pressable>

                        <Pressable onPress={() => onDeclineOffer?.(offer.id)}>
                          <Glass borderRadius={radius.pill} style={styles.declineBtn}>
                            <Text style={styles.declineBtnText}>Bỏ qua</Text>
                          </Glass>
                        </Pressable>
                      </View>
                    </View>
                  </View>
                </Pressable3D>
              </RevealView>

              <RevealView index={2} style={styles.countdownRow}>
                <Text style={typography.sm}>Slot được giữ cho bạn thêm </Text>
                <OdometerCountdown
                  seconds={secondsLeft}
                  color={colors.fg}
                  fadeColor={colors.bg}
                  fontSize={13.5}
                />
                <Text style={typography.sm}> phút.</Text>
              </RevealView>
            </>
          )}

          {/* Danh sách đang chờ */}
          <RevealView index={3}>
            <SectionHeader title="Đang chờ" />
            {waitingList.map((item, idx) => (
              <React.Fragment key={item.id}>
                {idx > 0 && <View style={styles.rowDivider} />}
                <Pressable
                  onLongPress={() => onLeaveWaitlist?.(item.id)}
                  style={styles.waitRow}
                >
                  <Image
                    source={{ uri: item.photoUrl }}
                    style={[styles.rowAvatar, squircle(14)]}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.rowName}>
                      {item.lecturerName}
                    </Text>
                    <Text numberOfLines={1} style={styles.rowSub}>
                      {item.slotLabel}
                    </Text>
                  </View>
                  <Text style={styles.posNumber}>#{item.position}</Text>
                </Pressable>
              </React.Fragment>
            ))}
          </RevealView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    paddingHorizontal: 18,
    paddingBottom: 32,
  },
  appHead: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
  },
  offerCard: {
    marginTop: 16,
    height: 250,
    overflow: 'hidden',
    backgroundColor: colors.s1,
    position: 'relative',
  },
  offerTopRight: {
    position: 'absolute',
    top: 14,
    right: 14,
    zIndex: 2,
  },
  offerOverlay: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    zIndex: 2,
  },
  offerActions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  acceptBtn: {
    flex: 1,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    letterSpacing: ls(14, -0.03),
    color: '#000000',
  },
  declineBtn: {
    height: 42,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineBtnText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    letterSpacing: ls(14, -0.03),
    color: colors.fg,
  },
  countdownRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  rowDivider: {
    height: 1,
    backgroundColor: colors.line,
  },
  waitRow: {
    minHeight: 66,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowAvatar: {
    width: 48,
    height: 48,
    backgroundColor: colors.s3,
  },
  rowName: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    letterSpacing: ls(15, -0.03),
    color: colors.fg,
  },
  rowSub: {
    ...typography.sm,
    fontSize: 12.5,
    marginTop: 2,
  },
  posNumber: {
    fontFamily: fontFamily.bold,
    fontSize: 20,
    letterSpacing: ls(20, -0.04),
    fontVariant: ['tabular-nums'],
    color: colors.fg,
  },
});