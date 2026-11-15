import { useCallback, useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlashList } from '@shopify/flash-list';
import { Search, X } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { Lecturer } from '../../../api/domainTypes';
import { useLecturers } from '../../../api/hooks';
import { AppText, Button, Icon, IconButton } from '../../../components';
import {
  Reveal,
  Skeleton,
  useTabBarSpace,
} from '../../../components/motion';
import type { StudentStackParamList } from '../../../navigation/types';
import { colors, fonts, ls, space } from '../../../theme';
import { Chip } from '../components/Chip';
import { LecturerRow } from '../components/LecturerRow';
import {
  DAY_CHIPS,
  EMPTY_FILTERS,
  SEARCH_DEBOUNCE_MS,
  departmentsOf,
  hasActiveFilters,
  toLecturerQuery,
  type LecturerFilters,
} from '../lecturerLogic';
import { departmentLabel } from '../../../api/departments';

type Nav = NativeStackNavigationProp<StudentStackParamList>;

/** Debounced copy of a value. */
function useDebounced<T>(value: T, ms: number): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return v;
}

/** Screen 10: search + filters + infinite lecturer list. */
export function LecturerSearchScreen() {
  const navigation = useNavigation<Nav>();
  const bottomSpace = useTabBarSpace();

  const [text, setText] = useState('');
  const [department, setDepartment] = useState<string | undefined>();
  const [dayOfWeek, setDayOfWeek] = useState<number | undefined>();
  const [availableOnly, setAvailableOnly] = useState(false);
  const [knownDepartments, setKnownDepartments] = useState<string[]>([]);

  const q = useDebounced(text, SEARCH_DEBOUNCE_MS);
  const filters: LecturerFilters = useMemo(
    () => ({ q, department, dayOfWeek, availableOnly }),
    [q, department, dayOfWeek, availableOnly],
  );
  const query = useLecturers(toLecturerQuery(filters));
  const lecturers = useMemo(
    () => query.data?.pages.flatMap(p => p.content) ?? [],
    [query.data],
  );

  // Remember departments seen so the chips stay when a department filter narrows the list.
  useEffect(() => {
    setKnownDepartments(prev => {
      const next = departmentsOf(lecturers, prev);
      return next.length === prev.length ? prev : next;
    });
  }, [lecturers]);

  const reset = useCallback(() => {
    setText('');
    setDepartment(undefined);
    setDayOfWeek(undefined);
    setAvailableOnly(false);
  }, []);

  const open = useCallback(
    (l: Lecturer) => navigation.navigate('LecturerDetail', { lecturerId: l.id }),
    [navigation],
  );

  const filtered = hasActiveFilters({ ...EMPTY_FILTERS, ...filters }) || text.length > 0;

  const header = (
    <View>
      <AppText variant="t1" style={styles.title}>
        Giảng viên
      </AppText>
      <View style={styles.search}>
        <Icon as={Search} size={18} level="muted" />
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder="Tên, khoa, phòng…"
          placeholderTextColor={colors.fg3}
          selectionColor={colors.fg}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Tìm giảng viên"
          style={styles.input}
        />
        {text ? (
          <IconButton
            icon={X}
            iconSize={16}
            size={28}
            accessibilityLabel="Xóa chữ đã nhập"
            onPress={() => setText('')}
          />
        ) : null}
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        <Chip label="Tất cả" on={!filtered} onPress={reset} />
        <Chip
          label="Còn slot"
          on={availableOnly}
          onPress={() => setAvailableOnly(v => !v)}
        />
        {knownDepartments.map(d => (
          <Chip
            key={d}
            label={departmentLabel(d) ?? d}
            on={department === d}
            onPress={() => setDepartment(cur => (cur === d ? undefined : d))}
          />
        ))}
      </ScrollView>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {DAY_CHIPS.map(d => (
          <Chip
            key={d.value}
            label={d.label}
            on={dayOfWeek === d.value}
            onPress={() =>
              setDayOfWeek(cur => (cur === d.value ? undefined : d.value))
            }
          />
        ))}
      </ScrollView>
      <View style={styles.gap} />
    </View>
  );

  let empty: React.ReactElement | null = null;
  if (query.isPending) {
    empty = (
      <View style={styles.skeletons}>
        {[0, 1, 2, 3, 4].map(i => (
          <Skeleton key={i} height={68} borderRadius={20} />
        ))}
      </View>
    );
  } else if (query.isError) {
    empty = (
      <View style={styles.state}>
        <Text style={styles.stateText}>Không tải được danh sách giảng viên.</Text>
        <Button
          variant="ghost"
          title="Thử lại"
          onPress={() => query.refetch()}
        />
      </View>
    );
  } else if (lecturers.length === 0) {
    empty = (
      <View style={styles.state}>
        <Text style={styles.stateText}>
          {filtered
            ? 'Không có giảng viên phù hợp với bộ lọc này.'
            : 'Chưa có giảng viên nào.'}
        </Text>
        {filtered ? (
          <Button variant="ghost" title="Xóa bộ lọc" onPress={reset} />
        ) : null}
      </View>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.root}>
      <FlashList
        data={lecturers}
        keyExtractor={l => l.id}
        renderItem={({ item, index }) => (
          <Reveal id={`lecturer-row-${item.id}`} index={Math.min(index, 8)}>
            <LecturerRow lecturer={item} onPress={open} />
          </Reveal>
        )}
        ListHeaderComponent={header}
        ListEmptyComponent={empty}
        ListFooterComponent={
          query.isFetchingNextPage ? (
            <View style={styles.footer}>
              <Skeleton height={68} borderRadius={20} />
            </View>
          ) : null
        }
        onEndReached={() => {
          if (query.hasNextPage && !query.isFetchingNextPage) {
            query.fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.6}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{
          paddingHorizontal: space.gutter,
          paddingBottom: bottomSpace,
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  title: { marginTop: 12, marginBottom: 14 },
  search: {
    height: 48,
    borderRadius: 999,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingLeft: 16,
    paddingRight: 8,
  },
  input: {
    flex: 1,
    padding: 0,
    fontSize: 15,
    fontFamily: fonts.medium,
    letterSpacing: ls(15, -0.01),
    color: colors.fg,
  },
  chips: { gap: 8, paddingTop: 12, paddingRight: space.gutter },
  gap: { height: 16 },
  skeletons: { gap: 8 },
  footer: { paddingTop: 4 },
  state: { paddingVertical: 32, alignItems: 'center', gap: 8 },
  stateText: {
    fontSize: 14.5,
    fontFamily: fonts.medium,
    color: colors.fg2,
    textAlign: 'center',
  },
});
