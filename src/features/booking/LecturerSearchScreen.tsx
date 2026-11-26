import React, { useMemo, useState } from 'react';
import {
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { NavPill } from '../../components/AppPrimitives';
import { RevealView } from '../../components/AuthPrimitives';
import { MonoIcon } from '../../components/Icons';
import { Pressable3D } from '../../components/Pressable3D';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
} from '../../theme/tokens';

export interface LecturerCardItem {
  id: string;
  name: string;
  department: string;
  locationLabel: string; // VD: "CNTT · 306.B11" hoặc "CNTT · Online"
  photoUrl: string;
  nextFreeLabel?: string; // VD: "Rảnh Thứ Năm 09:00"
  hasSlotThisWeek?: boolean;
}

const FILTER_CHIPS = ['Tất cả', 'Còn slot tuần này', 'CNTT', 'Kinh tế'];

const SAMPLE_LECTURERS: LecturerCardItem[] = [
  {
    id: 'gv-khoa',
    name: 'TS. Nguyễn Minh Khoa',
    department: 'CNTT',
    locationLabel: 'CNTT · 306.B11',
    photoUrl: 'https://i.pravatar.cc/500?img=11',
    nextFreeLabel: 'Rảnh Thứ Năm 09:00',
    hasSlotThisWeek: true,
  },
  {
    id: 'gv-ha',
    name: 'TS. Trần Thu Hà',
    department: 'Kinh tế',
    locationLabel: 'Kinh tế · B4.110',
    photoUrl: 'https://i.pravatar.cc/500?img=47',
    nextFreeLabel: 'Rảnh hôm nay 15:30',
    hasSlotThisWeek: true,
  },
  {
    id: 'gv-hoang',
    name: 'ThS. Lê Hoàng',
    department: 'CNTT',
    locationLabel: 'CNTT · Online',
    photoUrl: 'https://i.pravatar.cc/500?img=12',
    hasSlotThisWeek: false,
  },
  {
    id: 'gv-son',
    name: 'PGS. Đỗ Văn Sơn',
    department: 'Kỹ thuật',
    locationLabel: 'Kỹ thuật · B8.301',
    photoUrl: 'https://i.pravatar.cc/500?img=53',
    hasSlotThisWeek: false,
  },
];

interface LecturerSearchScreenProps {
  lecturers?: LecturerCardItem[];
  onSelectLecturer?: (lecturer: LecturerCardItem) => void;
  onSelectTab?: (tab: string) => void;
}

export function LecturerSearchScreen({
  lecturers = SAMPLE_LECTURERS,
  onSelectLecturer,
  onSelectTab,
}: LecturerSearchScreenProps) {
  const [query, setQuery] = useState('');
  const [activeChip, setActiveChip] = useState('Tất cả');

  const filtered = useMemo(() => {
    return lecturers.filter((item) => {
      if (activeChip === 'Còn slot tuần này' && !item.hasSlotThisWeek) {
        return false;
      }
      if (
        activeChip !== 'Tất cả' &&
        activeChip !== 'Còn slot tuần này' &&
        item.department !== activeChip
      ) {
        return false;
      }
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        item.name.toLowerCase().includes(q) ||
        item.locationLabel.toLowerCase().includes(q)
      );
    });
  }, [lecturers, activeChip, query]);

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.gridRow}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View style={{ marginBottom: 16 }}>
              <View style={styles.appHead}>
                <RevealView index={0}>
                  <Text style={styles.pageTitle}>Giảng viên</Text>
                </RevealView>
              </View>

              {/* Ô tìm kiếm: ngoại lệ duy nhất giữ icon đầu ô */}
              <RevealView index={1} style={styles.searchBar}>
                <MonoIcon name="search" size={18} color={colors.fg3} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Tên, môn, phòng…"
                  placeholderTextColor={colors.fg3}
                  selectionColor={colors.fg}
                  style={styles.searchInput}
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery('')} hitSlop={8}>
                    <MonoIcon name="x" size={15} color={colors.fg3} />
                  </Pressable>
                )}
              </RevealView>

              {/* Chips lọc chỉ có chữ */}
              <RevealView index={2}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginHorizontal: -18, marginTop: 12 }}
                  contentContainerStyle={styles.chipsRow}
                >
                  {FILTER_CHIPS.map((chip) => {
                    const isOn = chip === activeChip;
                    return (
                      <Pressable
                        key={chip}
                        onPress={() => setActiveChip(chip)}
                        style={[styles.chip, isOn && styles.chipOn]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            isOn && styles.chipTextOn,
                          ]}
                        >
                          {chip}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </RevealView>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.gridCol}>
              <Pressable3D onPress={() => onSelectLecturer?.(item)}>
                <Image
                  source={{ uri: item.photoUrl }}
                  style={[styles.portraitImg, squircle(radius.card)]}
                  contentFit="cover"
                />
                <Text numberOfLines={1} style={styles.lecName}>
                  {item.name}
                </Text>
                <Text numberOfLines={1} style={styles.lecMeta}>
                  {item.locationLabel}
                </Text>
                {item.nextFreeLabel && (
                  <Text numberOfLines={1} style={styles.lecFree}>
                    {item.nextFreeLabel}
                  </Text>
                )}
              </Pressable3D>
            </View>
          )}
        />
      </SafeAreaView>

      <NavPill role="sv" activeTab="find" onSelectTab={onSelectTab} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  listContent: {
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
  searchBar: {
    marginTop: 8,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
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
  chipsRow: {
    paddingHorizontal: 18,
    gap: 8,
  },
  chip: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: {
    backgroundColor: colors.fg,
    borderWidth: 0,
  },
  chipText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 13.5,
    color: colors.fg2,
  },
  chipTextOn: {
    fontFamily: fontFamily.bold,
    color: '#000000',
  },
  gridRow: {
    justifyContent: 'space-between',
    marginBottom: 18,
  },
  gridCol: {
    width: '48.2%',
  },
  portraitImg: {
    width: '100%',
    height: 168,
    backgroundColor: colors.s2,
  },
  lecName: {
    fontFamily: fontFamily.bold,
    fontSize: 14.5,
    letterSpacing: ls(14.5, -0.035),
    color: colors.fg,
    marginTop: 9,
  },
  lecMeta: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    color: colors.fg3,
    marginTop: 1,
  },
  lecFree: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
    color: colors.fg,
    marginTop: 3,
  },
});