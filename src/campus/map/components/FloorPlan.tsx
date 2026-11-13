import { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AppText, Seg, TopNav } from '../../../components';
import { colors, fonts, ls, radius, space } from '../../../theme';
import type { Block, Room } from '../../campusData';

export type FloorPlanProps = {
  block: Block;
  rooms: readonly Room[];
  /** Destination room code ("306.B11"); highlighted. */
  targetCode?: string | null;
  initialFloor?: number | null;
  onBack: () => void;
};

/** Rooms of one floor of a block, from campusData. */
export function roomsOnFloor(
  rooms: readonly Room[],
  blockCode: string,
  floor: number,
): Room[] {
  return rooms
    .filter(r => r.building === blockCode && r.floor === floor)
    .sort((a, b) => a.code.localeCompare(b.code, undefined, { numeric: true }));
}

export function countRooms(rooms: readonly Room[], blockCode: string): number {
  return rooms.filter(r => r.building === blockCode).length;
}

/** Screen 20b: simple 2D floor list, a Seg of floors 1..N, rooms as rows. */
export function FloorPlan({
  block,
  rooms,
  targetCode = null,
  initialFloor = null,
  onBack,
}: FloorPlanProps) {
  const [floor, setFloor] = useState(
    initialFloor && initialFloor >= 1 && initialFloor <= block.floors
      ? initialFloor
      : 1,
  );
  const options = useMemo(
    () =>
      Array.from({ length: block.floors }, (_, i) => ({
        value: String(i + 1),
        label: `Tầng ${i + 1}`,
      })),
    [block.floors],
  );
  const list = useMemo(
    () => roomsOnFloor(rooms, block.code, floor),
    [rooms, block.code, floor],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.root} testID="floor-plan">
      <View style={styles.pad}>
        <TopNav title={block.name} onBack={onBack} />
        <AppText variant="sm" style={styles.sub}>
          {`${block.floors} tầng · ${countRooms(rooms, block.code)} phòng`}
        </AppText>
        <Seg options={options} value={String(floor)} onChange={v => setFloor(Number(v))} />
      </View>
      <ScrollView contentContainerStyle={styles.list}>
        {list.length === 0 ? (
          <AppText variant="sm" style={styles.empty}>
            Chưa có dữ liệu phòng ở tầng này.
          </AppText>
        ) : (
          list.map(room => {
            const on = room.code === targetCode;
            return (
              <View
                key={room.code}
                style={[styles.row, on && styles.rowOn]}
                accessibilityState={{ selected: on }}
              >
                <Text style={[styles.code, on && styles.codeOn]}>
                  {room.code.split('.')[0]}
                </Text>
                <Text
                  style={[styles.name, on && styles.nameOn]}
                  numberOfLines={1}
                >
                  {room.name}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { ...StyleSheet.absoluteFill, backgroundColor: colors.bg, zIndex: 20 },
  pad: { paddingHorizontal: space.gutter },
  sub: { marginBottom: space.md, color: colors.fg2 },
  list: { padding: space.gutter, gap: 8, paddingBottom: 120 },
  empty: { color: colors.fg3, paddingVertical: space.xl },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 54,
    paddingHorizontal: 16,
    borderRadius: radius.md,
    backgroundColor: colors.s2,
  },
  rowOn: { backgroundColor: colors.fg },
  code: {
    width: 56,
    fontSize: 17,
    fontFamily: fonts.bold,
    letterSpacing: ls(17, -0.03),
    color: colors.fg,
  },
  codeOn: { color: colors.onPrimary },
  name: {
    flex: 1,
    fontSize: 14.5,
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  nameOn: { color: colors.onPrimary },
});
