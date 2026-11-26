import React, { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { AppRole, NavPill } from '../../components/AppPrimitives';
import {
  IconButton,
  PillButton,
  RevealView,
} from '../../components/AuthPrimitives';
import { CampusIsoMap } from '../../components/CampusIsoMap';
import { Glass } from '../../components/Glass';
import { MonoIcon, StatusGlyph } from '../../components/Icons';
import {
  CAMPUS_BUILDINGS,
  CAMPUS_ROOMS,
  getBuildingByCode,
} from '../../data/campusData';
import {
  colors,
  fontFamily,
  ls,
  radius,
  typography,
} from '../../theme/tokens';

interface CampusMapScreenProps {
  role?: AppRole;
  lecturerName?: string;
  lecturerAvatarUrl?: string;
  statusText?: string;
  walkMinutes?: string;
  distanceMeters?: string;
  appointmentTime?: string;
  onPressDirections?: () => void;
  onOpenFloorPlan?: (
    buildingCode: string,
    floor: number,
    roomShortCode?: string,
  ) => void;
  onSelectTab?: (tab: string) => void;
}

export function CampusMapScreen({
  role = 'sv',
  lecturerName = 'TS. Nguyễn Minh Khoa',
  lecturerAvatarUrl = 'https://i.pravatar.cc/120?img=11',
  statusText = 'Có mặt · 306.B11, tầng 3',
  walkMinutes = '1 phút',
  distanceMeters = '90 m',
  appointmentTime = '14:00',
  onPressDirections,
  onOpenFloorPlan,
  onSelectTab,
}: CampusMapScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeBuilding, setActiveBuilding] = useState('B11');
  const [selectedFloor, setSelectedFloor] = useState(3);
  const [selectedRoomShort, setSelectedRoomShort] = useState<string | undefined>('306');
  const [showRoute, setShowRoute] = useState(true);

  const buildingObj = getBuildingByCode(activeBuilding) ?? CAMPUS_BUILDINGS[0];
  const floorNumbers = Array.from(
    { length: buildingObj.floors },
    (_, i) => buildingObj.floors - i,
  );

  // Tìm kiếm trực tiếp trong 133 phòng từ eiu-rooms.json
  const searchMatches = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return CAMPUS_ROOMS.filter(
      (r) =>
        r.code.toLowerCase().includes(q) ||
        r.name.toLowerCase().includes(q) ||
        r.building.toLowerCase().includes(q),
    ).slice(0, 6);
  }, [searchQuery]);

  return (
    <View style={styles.root}>
      {/* Bản đồ 2.5D EIU thật */}
      <CampusIsoMap
        center={buildingObj.centerXZ}
        scale={1.25}
        anchor={[185, 340]}
        highlight={{ code: buildingObj.code, floor: selectedFloor }}
        lines={
          showRoute
            ? [
              {
                pts: [
                  [23, 188.9],
                  [24.6, 179.8],
                  [34.7, 181.2],
                  [38.3, 170.4],
                ],
                dashed: true,
                width: 3.2,
              },
            ]
            : []
        }
        pins={[
          {
            id: 'me',
            x: 23,
            z: 188.9,
            avatarUrl: 'https://i.pravatar.cc/120?img=25',
            accuracyRadius: 9,
            label: 'Bạn',
          },
          {
            id: 'gv',
            x: 58,
            z: 148,
            floor: 3,
            avatarUrl: lecturerAvatarUrl,
            label: '306.B11',
            solid: true,
            lift: 26,
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
        {/* Thanh tìm kiếm kính + nút định vị */}
        <View style={styles.mapTop}>
          <Glass borderRadius={radius.pill} style={styles.searchGlass}>
            <MonoIcon name="search" size={18} color={colors.fg3} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Phòng, giảng viên…"
              placeholderTextColor={colors.fg3}
              selectionColor={colors.fg}
              style={styles.searchInput}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} hitSlop={8}>
                <MonoIcon name="x" size={15} color={colors.fg3} />
              </Pressable>
            )}
          </Glass>
          <IconButton
            icon="locate"
            size={48}
            onPress={() => {
              setActiveBuilding('B11');
              setSelectedFloor(3);
              setShowRoute(true);
            }}
          />
        </View>

        {/* Kết quả gợi ý phòng từ eiu-rooms.json */}
        {searchMatches.length > 0 && (
          <View style={styles.searchDropdownWrap}>
            <Glass borderRadius={radius.lg} style={styles.searchDropdown}>
              <ScrollView keyboardShouldPersistTaps="handled">
                {searchMatches.map((rm, idx) => (
                  <Pressable
                    key={rm.code}
                    onPress={() => {
                      setActiveBuilding(rm.building);
                      setSelectedFloor(rm.floor);
                      setSelectedRoomShort(rm.shortCode);
                      setSearchQuery('');
                    }}
                    style={[
                      styles.searchItem,
                      idx > 0 && {
                        borderTopWidth: 1,
                        borderTopColor: colors.line,
                      },
                    ]}
                  >
                    <Text style={styles.searchCode}>{rm.code}</Text>
                    <Text style={typography.sm}>
                      {rm.name} · Tầng {rm.floor}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
            </Glass>
          </View>
        )}

        {/* Thanh chọn tầng kính dọc */}
        <Glass borderRadius={radius.pill} style={styles.floorsPill}>
          <Text style={styles.floorsLabel}>Tầng</Text>
          {floorNumbers.map((fl) => {
            const isOn = fl === selectedFloor;
            return (
              <Pressable
                key={fl}
                onPress={() => setSelectedFloor(fl)}
                style={[styles.floorDot, isOn && styles.floorDotOn]}
              >
                <Text
                  style={[styles.floorNum, isOn && { color: '#000000' }]}
                >
                  {fl}
                </Text>
              </Pressable>
            );
          })}
        </Glass>

        <View style={{ flex: 1 }} pointerEvents="none" />

        {/* MapCard kính phía trên thanh nav */}
        <RevealView index={0} style={styles.mapCardWrap}>
          <Glass borderRadius={24} style={styles.mapCard}>
            <View style={styles.cardHeader}>
              <Image
                source={{ uri: lecturerAvatarUrl }}
                style={styles.cardAvatar}
                contentFit="cover"
              />
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{lecturerName}</Text>
                <View style={styles.statusRow}>
                  <StatusGlyph type="ok" size={14} color={colors.fg} />
                  <Text style={typography.sm}>{statusText}</Text>
                </View>
              </View>
            </View>

            <View style={styles.metaGrid}>
              <View style={styles.metaCell}>
                <Text style={styles.metaBig}>{walkMinutes}</Text>
                <Text style={typography.xs}>Đi bộ</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaBig}>{distanceMeters}</Text>
                <Text style={typography.xs}>Tới cửa {buildingObj.displayName}</Text>
              </View>
              <View style={styles.metaCell}>
                <Text style={styles.metaBig}>{appointmentTime}</Text>
                <Text style={typography.xs}>Giờ hẹn</Text>
              </View>
            </View>

            <View style={styles.actsRow}>
              <View style={{ flex: 1 }}>
                <PillButton
                  title="Chỉ đường"
                  style={{ height: 42 }}
                  onPress={() => {
                    setShowRoute(true);
                    onPressDirections?.();
                  }}
                />
              </View>
              <View style={{ flex: 1 }}>
                <PillButton
                  title={`Xem tầng ${selectedFloor}`}
                  variant="glass"
                  style={{ height: 42 }}
                  onPress={() =>
                    onOpenFloorPlan?.(
                      buildingObj.code,
                      selectedFloor,
                      selectedRoomShort,
                    )
                  }
                />
              </View>
            </View>
          </Glass>
        </RevealView>
      </SafeAreaView>

      <NavPill role={role} activeTab="map" onSelectTab={onSelectTab} />
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
    height: 320,
  },
  mapTop: {
    paddingHorizontal: 14,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  searchGlass: {
    flex: 1,
    height: 48,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: fontFamily.medium,
    fontSize: 15,
    color: colors.fg,
    padding: 0,
  },
  searchDropdownWrap: {
    paddingHorizontal: 14,
    marginTop: 6,
    zIndex: 30,
  },
  searchDropdown: {
    maxHeight: 220,
    paddingHorizontal: 14,
  },
  searchItem: {
    paddingVertical: 11,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchCode: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.fg,
  },
  floorsPill: {
    position: 'absolute',
    right: 14,
    top: 130,
    padding: 4,
    alignItems: 'center',
    gap: 2,
  },
  floorsLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 9.5,
    letterSpacing: 0.4,
    color: colors.fg3,
    paddingVertical: 4,
  },
  floorDot: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  floorDotOn: {
    backgroundColor: colors.fg,
  },
  floorNum: {
    fontFamily: fontFamily.bold,
    fontSize: 13,
    color: colors.fg2,
  },
  mapCardWrap: {
    paddingHorizontal: 14,
    marginBottom: 94,
  },
  mapCard: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  cardAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.s3,
  },
  cardName: {
    fontFamily: fontFamily.bold,
    fontSize: 16,
    letterSpacing: ls(16, -0.03),
    color: colors.fg,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  metaGrid: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  metaCell: {
    flex: 1,
  },
  metaBig: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    letterSpacing: ls(18, -0.04),
    fontVariant: ['tabular-nums'],
    color: colors.fg,
  },
  actsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 14,
  },
});