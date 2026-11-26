import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NavPill } from '../../components/AppPrimitives';
import { RevealView } from '../../components/AuthPrimitives';
import { CampusIsoMap } from '../../components/CampusIsoMap';
import {
  colors,
  fontFamily,
  ls,
  typography,
} from '../../theme/tokens';

export interface BlockRankItem {
  id: string;
  label: string;
  count: number;
  lowVolumeNote?: string; // VD: "Dưới 3 buổi ở mỗi block"
}

const SAMPLE_RANKS: BlockRankItem[] = [
  { id: 'b8', label: 'Block 8', count: 12 },
  { id: 'b11', label: 'Block 11', count: 7 },
  { id: 'b3', label: 'Block 3', count: 4 },
  {
    id: 'b45',
    label: 'Block 4, 5',
    count: 2,
    lowVolumeNote: 'Dưới 3 buổi ở mỗi block',
  },
];

interface CampusActivityScreenProps {
  timestampLabel?: string;
  ranks?: BlockRankItem[];
  onSelectTab?: (tab: string) => void;
}

export function CampusActivityScreen({
  timestampLabel = '14:05',
  ranks = SAMPLE_RANKS,
  onSelectTab,
}: CampusActivityScreenProps) {
  const maxCount = Math.max(...ranks.map((r) => r.count), 1);

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
              <Text style={styles.pageTitle}>Campus lúc này</Text>
            </RevealView>
            <Text style={typography.sm}>{timestampLabel}</Text>
          </View>

          <RevealView index={1}>
            <Text style={typography.sm}>
              Buổi hẹn trực tiếp đang diễn ra, đếm theo block của phòng.
            </Text>
          </RevealView>

          {/* Bản đồ 2.5D heatmap đơn sắc theo độ sáng mái block */}
          <RevealView index={2} style={styles.mapFrame}>
            <CampusIsoMap
              center={[75, 95]}
              scale={0.78}
              anchor={[185, 165]}
              buildingCounts={{
                B8: 12,
                B11: 7,
                B3: 4,
                B5: 2,
                B4: 1,
              }}
            />
            <LinearGradient
              pointerEvents="none"
              colors={['transparent', '#000000']}
              style={styles.mapFade}
            />
          </RevealView>

          {/* Danh sách xếp hạng với thanh mảnh */}
          <RevealView index={3}>
            {ranks.map((item, idx) => {
              const isLow = item.count < 3;
              const widthPct = `${Math.round((item.count / maxCount) * 100)}%` as `${number}%`;

              return (
                <React.Fragment key={item.id}>
                  {idx > 0 && <View style={styles.line} />}
                  <View style={styles.rankRow}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.rankTitle}>{item.label}</Text>
                      {isLow && item.lowVolumeNote ? (
                        <Text style={styles.rankSub}>{item.lowVolumeNote}</Text>
                      ) : (
                        <View style={styles.barTrack}>
                          <View
                            style={[styles.barFill, { width: widthPct }]}
                          />
                        </View>
                      )}
                    </View>

                    <Text
                      style={[
                        styles.rankNum,
                        isLow && { color: colors.fg3 },
                      ]}
                    >
                      {isLow ? '< 3' : item.count}
                    </Text>
                  </View>
                </React.Fragment>
              );
            })}
          </RevealView>
        </ScrollView>
      </SafeAreaView>

      <NavPill role="ad" activeTab="campus" onSelectTab={onSelectTab} />
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
  mapFrame: {
    height: 290,
    marginHorizontal: -18,
    marginTop: 6,
    overflow: 'hidden',
    position: 'relative',
  },
  mapFade: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 70,
  },
  line: {
    height: 1,
    backgroundColor: colors.line,
  },
  rankRow: {
    minHeight: 58,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  rankTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    letterSpacing: ls(15, -0.03),
    color: colors.fg,
  },
  rankSub: {
    ...typography.sm,
    fontSize: 12.5,
    marginTop: 2,
  },
  barTrack: {
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.s3,
    overflow: 'hidden',
    marginTop: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.fg,
  },
  rankNum: {
    fontFamily: fontFamily.bold,
    fontSize: 22,
    letterSpacing: ls(22, -0.04),
    fontVariant: ['tabular-nums'],
    color: colors.fg,
  },
});