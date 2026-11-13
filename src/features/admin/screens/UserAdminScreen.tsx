import React, { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useIsFocused,
  useNavigation,
  useNavigationState,
} from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';

import type { AdminUser } from '../../../api/domainTypes';
import { useAdminUsers } from '../../../api/hooks/campusAdmin';
import { Avatar } from '../../../components/Avatar';
import { Button } from '../../../components/Button';
import { Field } from '../../../components/Field';
import { BlurTarget, Skeleton, useTabBarSpace } from '../../../components/motion';
import { Seg, type SegOption } from '../../../components/Seg';
import { TopNav } from '../../../components/TopNav';
import { colors, fonts, ls, space } from '../../../theme';
import { useSession } from '../../auth/session';
import {
  filterAdminUsers,
  formatUserSubtitle,
} from '../components/userAdminLogic';
import { UserEditSheet } from '../components/UserEditSheet';

const ROLE_FILTER_OPTIONS: SegOption[] = [
  { value: 'ALL', label: 'Tất cả' },
  { value: 'STUDENT', label: 'Sinh viên' },
  { value: 'LECTURER', label: 'Giảng viên' },
  { value: 'ADMIN', label: 'Admin' },
];

export function UserAdminScreen() {
  const navigation = useNavigation();
  const { user: currentUser } = useSession();
  const focused = useIsFocused();
  const insets = useSafeAreaInsets();
  const tabSpace = useTabBarSpace();
  const isTabRoot = useNavigationState(s => s.type === 'tab');

  const [selectedRole, setSelectedRole] = useState<
    'ALL' | 'STUDENT' | 'LECTURER' | 'ADMIN'
  >('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);

  // TODO: Backend supports q parameter in GET /users?q=, currently client-side filtering on loaded pages as requested.
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    refetch,
    isRefetching,
  } = useAdminUsers({
    role: selectedRole === 'ALL' ? undefined : selectedRole,
  });

  const allUsers = useMemo(
    () => data?.pages.flatMap(p => p.content) ?? [],
    [data],
  );

  const filteredUsers = useMemo(
    () => filterAdminUsers(allUsers, searchTerm),
    [allUsers, searchTerm],
  );

  const totalElements = data?.pages[0]?.totalElements;

  const renderItem = useCallback(
    ({ item }: { item: AdminUser }) => {
      const isLocked = !item.active;

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${item.fullName}, ${item.role}`}
          onPress={() => setEditingUser(item)}
          style={({ pressed }) => [
            styles.userRow,
            isLocked && styles.lockedRow,
            pressed && styles.rowPressed,
          ]}
        >
          <Avatar id={item.id} size={44} shape="round" />
          <View style={styles.userInfoCol}>
            <Text style={styles.userName} numberOfLines={1}>
              {item.fullName}
            </Text>
            <Text style={styles.userSubtitle} numberOfLines={1}>
              {formatUserSubtitle(item)}
            </Text>
            <Text style={styles.userEmail} numberOfLines={1}>
              {item.email}
            </Text>
          </View>
        </Pressable>
      );
    },
    [],
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.skeletonContainer}>
          {[0, 1, 2, 3, 4, 5].map(idx => (
            <View key={idx} style={styles.skeletonRow}>
              <Skeleton width={44} height={44} borderRadius={22} />
              <View style={styles.skeletonTextCol}>
                <Skeleton width="60%" height={14} borderRadius={4} />
                <Skeleton width="40%" height={12} borderRadius={4} />
                <Skeleton width="50%" height={12} borderRadius={4} />
              </View>
            </View>
          ))}
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Không thể tải danh sách người dùng</Text>
          <Button variant="ghost" title="Thử lại" onPress={() => refetch()} />
        </View>
      );
    }

    return (
      <FlashList
        data={filteredUsers}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            fetchNextPage();
          }
        }}
        onEndReachedThreshold={0.5}
        refreshing={isRefetching}
        onRefresh={refetch}
        ListEmptyComponent={
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {searchTerm.trim().length > 0
                ? 'Không tìm thấy người dùng phù hợp'
                : 'Chưa có người dùng nào'}
            </Text>
          </View>
        }
        ListFooterComponent={
          isFetchingNextPage ? (
            <View style={styles.footerLoader}>
              <ActivityIndicator color={colors.fg2} size="small" />
            </View>
          ) : null
        }
        contentContainerStyle={[
          styles.listContent,
          {
            paddingBottom: isTabRoot ? tabSpace : insets.bottom + space.xl,
          },
        ]}
      />
    );
  };

  const body = (
    <View style={styles.root}>
      <TopNav
        title="Người dùng"
        onBack={navigation.canGoBack() ? () => navigation.goBack() : undefined}
        right={
          totalElements != null ? (
            <Text style={styles.countText}>
              {totalElements.toLocaleString('vi-VN')}
            </Text>
          ) : null
        }
      />

      <View style={styles.controlsContainer}>
        <Field
          label="Tìm kiếm"
          placeholder="Tên hoặc email"
          value={searchTerm}
          onChangeText={setSearchTerm}
        />

        <Seg
          options={ROLE_FILTER_OPTIONS}
          value={selectedRole}
          onChange={val =>
            setSelectedRole(val as 'ALL' | 'STUDENT' | 'LECTURER' | 'ADMIN')
          }
          style={styles.seg}
        />
      </View>

      <View style={styles.content}>{renderContent()}</View>

      <UserEditSheet
        user={editingUser}
        currentUserId={currentUser?.id}
        visible={!!editingUser}
        onClose={() => setEditingUser(null)}
      />
    </View>
  );

  return (
    <View style={styles.root}>
      {isTabRoot ? (
        <BlurTarget active={focused} style={styles.root}>
          {body}
        </BlurTarget>
      ) : (
        body
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  controlsContainer: {
    paddingHorizontal: space.gutter,
    gap: space.md,
    paddingBottom: space.md,
  },
  seg: {
    marginTop: space.xs,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: space.gutter,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.line,
    gap: space.md,
  },
  lockedRow: {
    opacity: 0.45,
  },
  rowPressed: {
    opacity: 0.7,
  },
  userInfoCol: {
    flex: 1,
    gap: 3,
  },
  userName: {
    fontSize: 15,
    fontFamily: fonts.bold,
    color: colors.fg,
    letterSpacing: ls(15, -0.02),
  },
  userSubtitle: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  userEmail: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.fg3,
  },
  countText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.fg2,
    paddingRight: space.xs,
  },
  centerContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.fg2,
  },
  errorText: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.err,
    marginBottom: space.sm,
  },
  footerLoader: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  skeletonContainer: {
    paddingHorizontal: space.gutter,
    gap: space.lg,
    paddingTop: space.sm,
  },
  skeletonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  skeletonTextCol: {
    flex: 1,
    gap: 6,
  },
});
