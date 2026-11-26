import React, { useMemo, useState } from 'react';
import {
  Modal,
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
import {
  AppField,
  PillButton,
  RevealView,
} from '../../components/AuthPrimitives';
import { MonoIcon } from '../../components/Icons';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

export type SystemUserRole = 'STUDENT' | 'LECTURER' | 'ADMIN';

export interface AdminUserItem {
  id: string;
  fullName: string;
  email: string;
  role: SystemUserRole;
  department: string;
  officeRoom?: string;
  avatarUrl: string;
  locked: boolean;
}

const ROLE_CHIPS: { key: 'ALL' | SystemUserRole; label: string }[] = [
  { key: 'ALL', label: 'Tất cả' },
  { key: 'STUDENT', label: 'Sinh viên' },
  { key: 'LECTURER', label: 'Giảng viên' },
  { key: 'ADMIN', label: 'Admin' },
];

const SAMPLE_USERS: AdminUserItem[] = [
  {
    id: 'u-1',
    fullName: 'TS. Nguyễn Minh Khoa',
    email: 'khoa.nguyen@eiu.edu.vn',
    role: 'LECTURER',
    department: 'CNTT',
    officeRoom: '306.B11',
    avatarUrl: 'https://i.pravatar.cc/120?img=11',
    locked: false,
  },
  {
    id: 'u-2',
    fullName: 'TS. Trần Thu Hà',
    email: 'ha.tran@eiu.edu.vn',
    role: 'LECTURER',
    department: 'Kinh tế',
    officeRoom: 'B4.110',
    avatarUrl: 'https://i.pravatar.cc/120?img=47',
    locked: false,
  },
  {
    id: 'u-3',
    fullName: 'Phạm Gia Bảo',
    email: 'bao.pham@eiu.edu.vn',
    role: 'STUDENT',
    department: 'CNTT',
    avatarUrl: 'https://i.pravatar.cc/120?img=68',
    locked: false,
  },
  {
    id: 'u-4',
    fullName: 'Lê Khánh Linh',
    email: 'linh.le@eiu.edu.vn',
    role: 'STUDENT',
    department: 'Kinh tế',
    avatarUrl: 'https://i.pravatar.cc/120?img=29',
    locked: false,
  },
  {
    id: 'u-5',
    fullName: 'Võ Minh Tuấn',
    email: 'tuan.vo@eiu.edu.vn',
    role: 'STUDENT',
    department: 'Kỹ thuật',
    avatarUrl: 'https://i.pravatar.cc/120?img=14',
    locked: true,
  },
];

function formatRoleSubtitle(u: AdminUserItem): string {
  const roleLabel =
    u.role === 'LECTURER'
      ? 'Giảng viên'
      : u.role === 'ADMIN'
        ? 'Admin'
        : 'Sinh viên';
  const base = [roleLabel, u.department, u.officeRoom]
    .filter(Boolean)
    .join(' · ');
  return u.locked ? `Đã khóa · ${base}` : base;
}

interface UserManagementScreenProps {
  totalUsersLabel?: string;
  initialUsers?: AdminUserItem[];
  onUpdateUser?: (user: AdminUserItem) => Promise<void>;
  onToggleLockUser?: (userId: string, nextLocked: boolean) => Promise<void>;
  onSelectTab?: (tab: string) => void;
}

export function UserManagementScreen({
  totalUsersLabel = '1.284',
  initialUsers = SAMPLE_USERS,
  onUpdateUser,
  onToggleLockUser,
  onSelectTab,
}: UserManagementScreenProps) {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | SystemUserRole>('ALL');
  const [users, setUsers] = useState(initialUsers);
  const [editingUser, setEditingUser] = useState<AdminUserItem | null>(null);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      if (roleFilter !== 'ALL' && u.role !== roleFilter) return false;
      if (!query.trim()) return true;
      const q = query.toLowerCase();
      return (
        u.fullName.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q)
      );
    });
  }, [users, roleFilter, query]);

  const handleSaveUser = async () => {
    if (!editingUser) return;
    await onUpdateUser?.(editingUser);
    setUsers((prev) =>
      prev.map((u) => (u.id === editingUser.id ? editingUser : u)),
    );
    setEditingUser(null);
  };

  const handleToggleLock = async () => {
    if (!editingUser) return;
    const nextLocked = !editingUser.locked;
    await onToggleLockUser?.(editingUser.id, nextLocked);
    setUsers((prev) =>
      prev.map((u) =>
        u.id === editingUser.id ? { ...u, locked: nextLocked } : u,
      ),
    );
    setEditingUser(null);
  };

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
              <Text style={styles.pageTitle}>Người dùng</Text>
            </RevealView>
            <Text style={typography.sm}>{totalUsersLabel}</Text>
          </View>

          {/* Thanh tìm kiếm */}
          <RevealView index={1} style={styles.searchBar}>
            <MonoIcon name="search" size={18} color={colors.fg3} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Tên hoặc email"
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

          {/* Chips lọc vai trò */}
          <RevealView index={2}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -18, marginTop: 12 }}
              contentContainerStyle={styles.chipsRow}
            >
              {ROLE_CHIPS.map((chip) => {
                const isOn = chip.key === roleFilter;
                return (
                  <Pressable
                    key={chip.key}
                    onPress={() => setRoleFilter(chip.key)}
                    style={[styles.chip, isOn && styles.chipOn]}
                  >
                    <Text
                      style={[styles.chipText, isOn && styles.chipTextOn]}
                    >
                      {chip.label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </RevealView>

          {/* Danh sách người dùng */}
          <RevealView index={3} style={{ marginTop: 8 }}>
            {filteredUsers.map((user, idx) => (
              <React.Fragment key={user.id}>
                {idx > 0 && <View style={styles.line} />}
                <Pressable
                  onPress={() => setEditingUser({ ...user })}
                  style={({ pressed }) => [
                    styles.userRow,
                    user.locked && { opacity: 0.45 },
                    pressed && { opacity: 0.7 },
                  ]}
                >
                  <Image
                    source={{ uri: user.avatarUrl }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text numberOfLines={1} style={styles.userName}>
                      {user.fullName}
                    </Text>
                    <Text numberOfLines={1} style={styles.userSub}>
                      {formatRoleSubtitle(user)}
                    </Text>
                  </View>
                  <MonoIcon name="more" size={18} color={colors.fg3} />
                </Pressable>
              </React.Fragment>
            ))}
          </RevealView>
        </ScrollView>
      </SafeAreaView>

      {/* Sheet chỉnh sửa vai trò / phòng / khóa tài khoản */}
      <Modal
        visible={Boolean(editingUser)}
        transparent
        animationType="slide"
        onRequestClose={() => setEditingUser(null)}
      >
        <View style={styles.scrim}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => setEditingUser(null)}
          />
          {editingUser && (
            <View style={[styles.sheet, squircle(radius.sheet)]}>
              <View style={styles.grab} />
              <Text style={typography.h2}>{editingUser.fullName}</Text>
              <Text style={[typography.xs, { marginTop: 2 }]}>
                {editingUser.email}
              </Text>

              {/* Segmented chọn vai trò */}
              <View style={styles.roleSeg}>
                {(
                  [
                    ['STUDENT', 'Sinh viên'],
                    ['LECTURER', 'Giảng viên'],
                    ['ADMIN', 'Admin'],
                  ] as [SystemUserRole, string][]
                ).map(([rKey, rLabel]) => {
                  const isOn = editingUser.role === rKey;
                  return (
                    <Pressable
                      key={rKey}
                      onPress={() =>
                        setEditingUser({ ...editingUser, role: rKey })
                      }
                      style={[styles.segTab, isOn && styles.segTabOn]}
                    >
                      <Text
                        style={[styles.segText, isOn && styles.segTextOn]}
                      >
                        {rLabel}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={{ gap: 10, marginTop: 14 }}>
                <AppField
                  label="Khoa"
                  value={editingUser.department}
                  onChangeText={(t) =>
                    setEditingUser({ ...editingUser, department: t })
                  }
                />
                {editingUser.role === 'LECTURER' && (
                  <AppField
                    label="Phòng làm việc"
                    value={editingUser.officeRoom ?? ''}
                    placeholder="306.B11"
                    onChangeText={(t) =>
                      setEditingUser({ ...editingUser, officeRoom: t })
                    }
                  />
                )}
              </View>

              <PillButton
                title="Lưu thay đổi"
                onPress={handleSaveUser}
                style={{ marginTop: 18 }}
              />

              <Pressable onPress={handleToggleLock} style={styles.lockBtn}>
                <Text
                  style={[
                    styles.lockText,
                    !editingUser.locked && { color: colors.err },
                  ]}
                >
                  {editingUser.locked ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}
                </Text>
              </Pressable>
            </View>
          )}
        </View>
      </Modal>

      <NavPill role="ad" activeTab="users" onSelectTab={onSelectTab} />
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
  line: {
    height: 1,
    backgroundColor: colors.line,
  },
  userRow: {
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
  userName: {
    fontFamily: fontFamily.bold,
    fontSize: 15,
    letterSpacing: ls(15, -0.03),
    color: colors.fg,
  },
  userSub: {
    ...typography.sm,
    fontSize: 12.5,
    marginTop: 2,
  },
  scrim: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.64)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#121212',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderTopWidth: 1,
    borderColor: colors.line2,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 30,
  },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.fg4,
    alignSelf: 'center',
    marginBottom: 18,
  },
  roleSeg: {
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
    fontSize: 13.5,
    color: colors.fg3,
  },
  segTextOn: {
    color: colors.fg,
  },
  lockBtn: {
    height: 44,
    marginTop: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockText: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    color: colors.fg2,
  },
});