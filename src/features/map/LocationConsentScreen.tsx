import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import {
  IconButton,
  PillButton,
  RevealView,
} from '../../components/AuthPrimitives';
import { CampusIsoMap } from '../../components/CampusIsoMap';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

interface LocationConsentScreenProps {
  peerName?: string;
  timeWindowLabel?: string;
  onClose?: () => void;
  onEnableSharing?: () => Promise<void>;
  onSkip?: () => void;
}

export function LocationConsentScreen({
  peerName = 'Chỉ TS. Nguyễn Minh Khoa',
  timeWindowLabel = '14:00 – 14:35, thứ Tư 18/11',
  onClose,
  onEnableSharing,
  onSkip,
}: LocationConsentScreenProps) {
  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.topNav}>
            <IconButton icon="x" onPress={onClose ?? onSkip} />
          </View>

          {/* Minh họa là chính bản đồ 2.5D */}
          <RevealView index={0} style={styles.artWrap}>
            <CampusIsoMap
              center={[50, 162]}
              scale={1.45}
              anchor={[175, 115]}
              highlight={{ code: 'B11', floor: 3 }}
              showLabels={false}
              lines={[{ pts: [[23, 188.9], [38.3, 170.4]], dashed: true, width: 3 }]}
              pins={[
                {
                  id: 'me',
                  x: 23,
                  z: 188.9,
                  avatarUrl: 'https://i.pravatar.cc/120?img=25',
                  accuracyRadius: 8,
                },
                {
                  id: 'gv',
                  x: 58,
                  z: 148,
                  floor: 3,
                  avatarUrl: 'https://i.pravatar.cc/120?img=11',
                  lift: 26,
                },
              ]}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['transparent', '#000000']}
              style={styles.artFade}
            />
          </RevealView>

          <RevealView index={1}>
            <Text style={typography.h1}>Chia sẻ vị trí trong buổi hẹn</Text>
            <Text style={[typography.sub, { marginTop: 8 }]}>
              Để hai bên tìm thấy nhau khi gặp trực tiếp. Bạn tắt được bất cứ lúc nào.
            </Text>
          </RevealView>

          {/* 3 dòng giải thích dạng nhãn & giá trị */}
          <RevealView
            index={2}
            style={[styles.factsGroup, squircle(radius.card)]}
          >
            <View style={styles.factRow}>
              <Text style={styles.factKey}>Ai thấy</Text>
              <View style={styles.factValCol}>
                <Text style={styles.factVal}>{peerName}</Text>
                <Text style={typography.xs}>
                  Người trong buổi hẹn này, khi cả hai cùng bật.
                </Text>
              </View>
            </View>

            <View style={styles.line} />

            <View style={styles.factRow}>
              <Text style={styles.factKey}>Khi nào</Text>
              <View style={styles.factValCol}>
                <Text style={styles.factVal}>{timeWindowLabel}</Text>
                <Text style={typography.xs}>
                  Từ giờ bắt đầu tới 15 phút sau giờ kết thúc. Chỉ khi app đang mở.
                </Text>
              </View>
            </View>

            <View style={styles.line} />

            <View style={styles.factRow}>
              <Text style={styles.factKey}>Gửi gì</Text>
              <View style={styles.factValCol}>
                <Text style={styles.factVal}>
                  Block, vị trí trong campus, tầng ước lượng
                </Text>
                <Text style={typography.xs}>
                  Không lưu lại. Tự xóa khi hết giờ.
                </Text>
              </View>
            </View>
          </RevealView>

          <View style={{ flex: 1, minHeight: 24 }} />

          <RevealView index={3}>
            <PillButton
              title="Bật chia sẻ vị trí"
              onPress={() => {
                onEnableSharing?.();
              }}
            />
            <PillButton
              title="Để sau"
              variant="quiet"
              onPress={onSkip}
              style={{ marginTop: 4 }}
            />
          </RevealView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 24,
  },
  topNav: {
    height: 54,
    justifyContent: 'center',
  },
  artWrap: {
    height: 200,
    marginHorizontal: -18,
    overflow: 'hidden',
    position: 'relative',
  },
  artFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 110,
  },
  factsGroup: {
    marginTop: 16,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
  },
  line: {
    height: 1,
    backgroundColor: colors.line,
  },
  factRow: {
    paddingVertical: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  factKey: {
    width: 68,
    fontFamily: fontFamily.medium,
    fontSize: 13,
    color: colors.fg3,
    paddingTop: 1,
  },
  factValCol: {
    flex: 1,
    gap: 2,
  },
  factVal: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14.5,
    letterSpacing: ls(14.5, -0.02),
    color: colors.fg,
  },
});