import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { SubLabel } from '../../components/AppPrimitives';
import { IconButton, RevealView } from '../../components/AuthPrimitives';
import { StatusGlyph } from '../../components/Icons';
import {
  CampusRoom,
  getBuildingByCode,
  getRoomsForBuilding,
  splitFloorRoomsIntoRows,
} from '../../data/campusData';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

interface RoomLecturerItem {
  id: string;
  name: string;
  avatarUrl: string;
  statusSub: string;
  available: boolean;
}

const SAMPLE_ROOM_LECTURERS: RoomLecturerItem[] = [
  {
    id: 'gv-khoa',
    name: 'TS. Nguyễn Minh Khoa',
    avatarUrl: 'https://i.pravatar.cc/120?img=11',
    statusSub: 'Có mặt · hẹn bạn lúc 14:00',
    available: true,
  },
  {
    id: 'gv-ha',
    name: 'ThS. Trần Thu Hà',
    avatarUrl: 'https://i.pravatar.cc/120?img=47',
    statusSub: 'Vắng tới 15:30',
    available: false,
  },
];

interface FloorPlanScreenProps {
  buildingCode?: string;
  initialFloor?: number;
  initialSelectedRoom?: string;
  onBack?: () => void;
  onPressLecturer?: (lecturerId: string) => void;
}

export function FloorPlanScreen({
  buildingCode = 'B11',
  initialFloor = 3,
  initialSelectedRoom = '306',
  onBack,
  onPressLecturer,
}: FloorPlanScreenProps) {
  const building = getBuildingByCode(buildingCode);
  const allBuildingRooms = useMemo(
    () => getRoomsForBuilding(buildingCode),
    [buildingCode],
  );
  const totalFloors = building?.floors ?? 4;

  const [floor, setFloor] = useState(initialFloor);
  const [selectedRoom, setSelectedRoom] = useState(initialSelectedRoom);

  const { topRow, bottomRow } = useMemo(
    () => splitFloorRoomsIntoRows(buildingCode, floor),
    [buildingCode, floor],
  );

  const currentRoomObj = useMemo(
    () =>
      [...topRow, ...bottomRow].find((r) => r.shortCode === selectedRoom) ??
      topRow[0] ??
      bottomRow[0],
    [topRow, bottomRow, selectedRoom],
  );

  const handleSelectFloor = (fl: number) => {
    setFloor(fl);
    const next = splitFloorRoomsIntoRows(buildingCode, fl);
    const first = next.topRow[0] ?? next.bottomRow[0];
    if (first) setSelectedRoom(first.shortCode);
  };

  const renderRoomRow = (rooms: CampusRoom[]) => {
    const scrollable = rooms.length > 6;
    const content = (
      <View style={[styles.roomRow, scrollable && { paddingRight: 6 }]}>
        {rooms.map((rm) => {
          const isOn = rm.shortCode === currentRoomObj?.shortCode;
          return (
            <Pressable
              key={rm.code}
              onPress={() => setSelectedRoom(rm.shortCode)}
              style={[
                styles.roomCell,
                scrollable ? { width: 58 } : { flex: 1 },
                squircle(11),
                isOn && styles.roomCellOn,
              ]}
            >
              <Text
                style={[styles.roomCode, isOn && { color: '#000000' }]}
              >
                {rm.shortCode}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.roomSmall,
                  isOn && { color: 'rgba(0,0,0,0.6)' },
                ]}
              >
                {rm.name}
              </Text>
            </Pressable>
          );
        })}
      </View>
    );

    if (scrollable) {
      return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {content}
        </ScrollView>
      );
    }
    return content;
  };

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          {/* AppHead */}
          <View style={styles.appHead}>
            <IconButton icon="left" onPress={onBack} />
            <Text style={typography.sm}>
              {totalFloors} tầng · {allBuildingRooms.length} phòng
            </Text>
          </View>

          <RevealView index={0}>
            <Text style={[typography.h1, { marginTop: 8 }]}>
              {building?.displayName ?? 'Block 11'}
            </Text>
          </RevealView>

          {/* Segmented theo số tầng thật */}
          <RevealView index={1} style={styles.segBar}>
            {Array.from({ length: totalFloors }, (_, i) => i + 1).map((fl) => {
              const isOn = fl === floor;
              return (
                <Pressable
                  key={fl}
                  onPress={() => handleSelectFloor(fl)}
                  style={[styles.segTab, isOn && styles.segTabOn]}
                >
                  <Text style={[styles.segText, isOn && styles.segTextOn]}>
                    Tầng {fl}
                  </Text>
                </Pressable>
              );
            })}
          </RevealView>

          {/* Sơ đồ tầng phẳng */}
          <RevealView index={2} style={[styles.planBox, squircle(radius.card)]}>
            {topRow.length > 0 ? (
              renderRoomRow(topRow)
            ) : (
              <Text style={[typography.sm, { textAlign: 'center', paddingVertical: 16 }]}>
                Chưa có sơ đồ chi tiết tầng {floor}
              </Text>
            )}

            {/* Hành lang ở giữa */}
            <View style={styles.hallBar}>
              <Text style={styles.hallText}>Cầu thang</Text>
              <Text style={styles.hallText}>Hành lang</Text>
              <Text style={styles.hallText}>Thang máy</Text>
            </View>

            {bottomRow.length > 0 && renderRoomRow(bottomRow)}
          </RevealView>

          {/* Thông tin phòng đang chọn & giảng viên */}
          {currentRoomObj && (
            <RevealView index={3}>
              <SubLabel>
                Phòng {currentRoomObj.shortCode} · {currentRoomObj.name}
                {currentRoomObj.capacity
                  ? ` (${currentRoomObj.capacity} chỗ)`
                  : ''}
              </SubLabel>

              {SAMPLE_ROOM_LECTURERS.map((lec, idx) => (
                <React.Fragment key={lec.id}>
                  {idx > 0 && <View style={styles.line} />}
                  <Pressable
                    onPress={() => onPressLecturer?.(lec.id)}
                    style={({ pressed }) => [
                      styles.lecRow,
                      pressed && { opacity: 0.7 },
                    ]}
                  >
                    <Image
                      source={{ uri: lec.avatarUrl }}
                      style={styles.avatar}
                      contentFit="cover"
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={styles.lecName}>{lec.name}</Text>
                      <Text style={styles.lecSub}>{lec.statusSub}</Text>
                    </View>
                    <StatusGlyph
                      type={lec.available ? 'ok' : 'off'}
                      size={18}
                      color={lec.available ? colors.fg : colors.fg3}
                    />
                  </Pressable>
                </React.Fragment>
              ))}
            </RevealView>
          )}
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
    justifyContent: 'space-between',
  },
  segBar: {
    marginTop: 16,
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
    fontSize: 13,
    color: colors.fg3,
  },
  segTextOn: {
    color: colors.fg,
  },
  planBox: {
    marginTop: 16,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  roomRow: {
    flexDirection: 'row',
    gap: 6,
  },
  roomCell: {
    height: 54,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  roomCellOn: {
    backgroundColor: colors.fg,
    borderWidth: 0,
  },
  roomCode: {
    fontFamily: fontFamily.bold,
    fontSize: 12,
    fontVariant: ['tabular-nums'],
    color: colors.fg2,
  },
  roomSmall: {
    fontFamily: fontFamily.medium,
    fontSize: 9.5,
    color: colors.fg3,
    marginTop: 2,
  },
  hallBar: {
    height: 28,
    marginVertical: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.line2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  hallText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 11,
    color: colors.fg3,
  },
  line: {
    height: 1,
    backgroundColor: colors.line,
  },
  lecRow: {
    minHeight: 66,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.s3,
  },
  lecName: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    letterSpacing: ls(15, -0.03),
    color: colors.fg,
  },
  lecSub: {
    ...typography.sm,
    fontSize: 12.5,
    marginTop: 2,
  },
});