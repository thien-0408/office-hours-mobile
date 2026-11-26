import React, { useEffect, useState } from 'react';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { PillButton, RevealView } from '../../components/AuthPrimitives';
import { CampusIsoMap } from '../../components/CampusIsoMap';
import { Glass } from '../../components/Glass';
import { OdometerCountdown } from '../../components/Odometer';
import {
  colors,
  fontFamily,
  ls,
  radius,
  typography,
} from '../../theme/tokens';
import { FloorOverrideSheet } from './FloorOverrideSheet';

interface LiveMeetingMapScreenProps {
  viewerRole?: 'STUDENT' | 'LECTURER';
  initialSecondsLeft?: number;
  studentHasBarometer?: boolean;
  onPressChat?: () => void;
  onStopSharing?: () => void;
}

export function LiveMeetingMapScreen({
  viewerRole = 'STUDENT',
  initialSecondsLeft = 252, // 4:12
  studentHasBarometer = true,
  onPressChat,
  onStopSharing,
}: LiveMeetingMapScreenProps) {
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft);
  const [studentFloor, setStudentFloor] = useState<number | null>(
    studentHasBarometer ? 2 : null,
  );
  const [floorSource, setFloorSource] = useState<'baro' | 'manual' | null>(
    studentHasBarometer ? 'baro' : null,
  );
  const [floorSheetOpen, setFloorSheetOpen] = useState(false);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = setInterval(() => {
      setSecondsLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(t);
  }, [secondsLeft]);

  const isStudent = viewerRole === 'STUDENT';
  const studentPinLabel = isStudent
    ? studentFloor
      ? `Bạn · tầng ${studentFloor}${floorSource === 'baro' ? '?' : ''}`
      : 'Bạn · tầng ?'
    : studentFloor
      ? `Mai · tầng ${studentFloor}`
      : 'Mai · tầng ?';

  return (
    <View style={styles.root}>
      <CampusIsoMap
        center={[52, 154]}
        scale={2.2}
        anchor={[182, 340]}
        highlight={{ code: 'B11', floor: 3 }}
        pins={[
          {
            id: 'gv',
            x: 58,
            z: 148,
            floor: 3,
            avatarUrl: 'https://i.pravatar.cc/120?img=11',
            label: isStudent ? 'tại 306.B11' : 'Bạn · 306.B11',
            solid: true,
            lift: 26,
          },
          {
            id: 'sv',
            x: isStudent ? 36 : 42,
            z: isStudent ? 166 : 162,
            floor: studentFloor ?? undefined,
            avatarUrl: 'https://i.pravatar.cc/120?img=25',
            accuracyRadius: isStudent ? 7 : 9,
            label: studentPinLabel,
            dashed: floorSource !== 'manual',
          },
        ]}
      />

      <LinearGradient
        pointerEvents="none"
        colors={['rgba(0,0,0,0.88)', 'transparent']}
        style={styles.fadeTop}
      />
      <LinearGradient
        pointerEvents="none"
        colors={['transparent', 'rgba(0,0,0,0.92)']}
        style={styles.fadeBottom}
      />

      <SafeAreaView style={{ flex: 1 }} pointerEvents="box-none">
        {/* Livebar trên cùng */}
        <View style={styles.liveBarWrap}>
          <Glass borderRadius={radius.pill} style={styles.liveBar}>
            <Image
              source={{
                uri: isStudent
                  ? 'https://i.pravatar.cc/120?img=11'
                  : 'https://i.pravatar.cc/120?img=25',
              }}
              style={styles.liveAvatar}
              contentFit="cover"
            />
            <View style={{ flex: 1 }}>
              <Text numberOfLines={1} style={styles.liveTitle}>
                {isStudent
                  ? 'Hẹn TS. Khoa lúc 14:00'
                  : 'Phạm Ngọc Mai đang tới'}
              </Text>
              <Text numberOfLines={1} style={typography.xs}>
                {isStudent
                  ? '306.B11 · tầng 3'
                  : '14:00 · Đề cương đồ án'}
              </Text>
            </View>

            <Glass borderRadius={radius.pill} style={styles.timerPill}>
              <Text style={styles.timerPrefix}>Còn </Text>
              <OdometerCountdown
                seconds={secondsLeft}
                color={colors.fg}
                fadeColor="#161616"
                fontSize={12.5}
              />
            </Glass>
          </Glass>
        </View>

        <View style={{ flex: 1 }} pointerEvents="none" />

        {/* MapCard kính phía dưới */}
        <RevealView index={0} style={styles.bottomWrap}>
          <Glass borderRadius={24} style={styles.mapCard}>
            {isStudent ? (
              <>
                <View style={styles.whoRow}>
                  <Image
                    source={{ uri: 'https://i.pravatar.cc/120?img=11' }}
                    style={styles.whoAvatar}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.whoName}>TS. Nguyễn Minh Khoa</Text>
                    <Text style={typography.xs}>
                      Tại phòng 306.B11 · tầng 3
                    </Text>
                  </View>
                  <Pressable onPress={onPressChat} hitSlop={8}>
                    <Text style={styles.whoLink}>Nhắn</Text>
                  </Pressable>
                </View>

                <View style={styles.whoDivider} />

                <View style={styles.whoRow}>
                  <Image
                    source={{ uri: 'https://i.pravatar.cc/120?img=25' }}
                    style={styles.whoAvatar}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.whoName}>Bạn</Text>
                    <Text style={typography.xs}>
                      Block 11 ·{' '}
                      {studentFloor ? `tầng ${studentFloor}` : 'tầng ?'}{' '}
                      {floorSource === 'baro'
                        ? '(ước lượng)'
                        : floorSource === 'manual'
                          ? '(tự chọn)'
                          : ''}
                    </Text>
                  </View>
                  <Pressable
                    onPress={() => setFloorSheetOpen(true)}
                    hitSlop={8}
                  >
                    <Text style={styles.whoLink}>Sửa tầng</Text>
                  </Pressable>
                </View>
              </>
            ) : (
              <>
                <View style={styles.whoRow}>
                  <Image
                    source={{ uri: 'https://i.pravatar.cc/120?img=25' }}
                    style={styles.whoAvatar}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.whoName}>Phạm Ngọc Mai</Text>
                    <Text style={typography.xs}>
                      Block 11 ·{' '}
                      {studentFloor
                        ? `tầng ${studentFloor}`
                        : 'tầng ? (máy không có barometer)'}
                    </Text>
                  </View>
                  <Pressable onPress={onPressChat} hitSlop={8}>
                    <Text style={styles.whoLink}>Nhắn</Text>
                  </Pressable>
                </View>

                <View style={styles.whoDivider} />

                <View style={styles.whoRow}>
                  <Image
                    source={{ uri: 'https://i.pravatar.cc/120?img=11' }}
                    style={styles.whoAvatar}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.whoName}>Bạn</Text>
                    <Text style={typography.xs}>
                      Tại phòng 306.B11 (phòng làm việc)
                    </Text>
                  </View>
                </View>
              </>
            )}

            <View style={styles.shareFooter}>
              <Text style={typography.xs}>Đang chia sẻ tới 14:35</Text>
              <PillButton
                title="Dừng chia sẻ"
                variant="glass"
                style={{ height: 38, paddingHorizontal: 14 }}
                onPress={onStopSharing}
              />
            </View>
          </Glass>
        </RevealView>
      </SafeAreaView>

      <FloorOverrideSheet
        visible={floorSheetOpen}
        baroEstimatedFloor={2}
        initialSelectedFloor={studentFloor ?? 3}
        onClose={() => setFloorSheetOpen(false)}
        onSaveFloor={(fl) => {
          setStudentFloor(fl);
          setFloorSource('manual');
        }}
        onResetToEstimated={() => {
          setStudentFloor(2);
          setFloorSource('baro');
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  liveBarWrap: {
    paddingHorizontal: 14,
    paddingTop: 8,
  },
  liveBar: {
    height: 54,
    paddingLeft: 8,
    paddingRight: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  liveAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.s3,
  },
  liveTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 13.5,
    letterSpacing: ls(13.5, -0.025),
    color: colors.fg,
  },
  timerPill: {
    height: 36,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  timerPrefix: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.fg2,
  },
  bottomWrap: {
    paddingHorizontal: 14,
    marginBottom: 16,
  },
  mapCard: {
    padding: 16,
  },
  whoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 4,
  },
  whoAvatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.s3,
  },
  whoName: {
    fontFamily: fontFamily.bold,
    fontSize: 13.5,
    letterSpacing: ls(13.5, -0.025),
    color: colors.fg,
  },
  whoLink: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.fg,
  },
  whoDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 8,
  },
  shareFooter: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});