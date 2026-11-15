import { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useIsFocused,
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { me, updateMe } from '../../../api/users';
import type { UpdateProfilePayload, UserProfile } from '../../../api/types';
import { ApiError } from '../../../api/errors';
import { errorText, fieldErrorMap } from '../../../api/errorText';
import { useSession } from '../../auth/session';
import { useAppSession } from '../../../navigation/devSession';
import {
  Avatar,
  Button,
  DepartmentPicker,
  Field,
  TopNav,
} from '../../../components';
import { useDepartmentLabel } from '../../../api/hooks/departments';
import {
  BlurTarget,
  Skeleton,
  useTabBarSpace,
} from '../../../components/motion';
import { colors, fonts, radius, space, text } from '../../../theme';
import { ProfileGroup, SectionLabel } from '../components/ProfileGroup';
import { ProfileRow } from '../components/ProfileRow';
import { formatRole, validateProfileUpdate } from '../profileLogic';

export function ProfileScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const isFocused = useIsFocused();
  const tabBarSpace = useTabBarSpace();
  const deptLabel = useDepartmentLabel();
  const queryClient = useQueryClient();
  const { reloadUser } = useSession();
  const { signOut } = useAppSession();

  const handleSignOut = () => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất khỏi OfficeHours?', [
      { text: 'Hủy', style: 'cancel' },
      {
        text: 'Đăng xuất',
        style: 'destructive',
        onPress: () => {
          signOut().catch(() => undefined);
        },
      },
    ]);
  };

  const [isEditing, setIsEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [department, setDepartment] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);

  const {
    data: user,
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<UserProfile, ApiError>({
    queryKey: ['me'],
    queryFn: me,
  });

  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setDepartment(user.department || '');
    }
  }, [user]);

  const updateMutation = useMutation({
    mutationFn: (payload: UpdateProfilePayload) => updateMe(payload),
    onSuccess: updated => {
      queryClient.setQueryData(['me'], updated);
      // keep the session's copy (greeting, role) in sync; no-op failure in dev-role mode
      reloadUser().catch(() => {});
      setIsEditing(false);
      setFieldErrors({});
      setGeneralError(null);
    },
    onError: (err: unknown) => {
      if (err instanceof ApiError) {
        if (err.fieldErrors && err.fieldErrors.length > 0) {
          setFieldErrors(fieldErrorMap(err));
          return;
        }
        setGeneralError('Không thể cập nhật hồ sơ. Thử lại sau.');
      } else {
        setGeneralError('Lỗi kết nối. Vui lòng thử lại.');
      }
    },
  });

  const handleStartEdit = () => {
    if (user) {
      setFullName(user.fullName || '');
      setDepartment(user.department || '');
    }
    setFieldErrors({});
    setGeneralError(null);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    if (user) {
      setFullName(user.fullName || '');
      setDepartment(user.department || '');
    }
    setFieldErrors({});
    setGeneralError(null);
    setIsEditing(false);
  };

  const handleSave = () => {
    setFieldErrors({});
    setGeneralError(null);

    const validation = validateProfileUpdate({
      fullName,
      department: department.trim() || null,
    });

    if (!validation.isValid) {
      const mapped: Record<string, string> = {};
      if (validation.errors.fullName) {
        mapped.fullName = validation.errors.fullName;
      }
      if (validation.errors.department) {
        mapped.department = validation.errors.department;
      }
      setFieldErrors(mapped);
      return;
    }

    updateMutation.mutate({
      fullName: fullName.trim(),
      department: department.trim() || null,
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeRoot}>
      <KeyboardAvoidingView style={styles.flexOne} behavior="padding">
      <BlurTarget active={isFocused} style={styles.flexOne}>
        <TopNav
          title="Hồ sơ"
          right={
            user && !isEditing ? (
              <Button
                variant="quiet"
                title="Sửa"
                onPress={handleStartEdit}
                style={styles.navEditBtn}
              />
            ) : null
          }
        />

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <View style={styles.skeletonHero}>
              <Skeleton width={88} height={88} borderRadius={18} />
              <Skeleton
                width={90}
                height={16}
                borderRadius={8}
                style={styles.mt12}
              />
              <Skeleton
                width={200}
                height={32}
                borderRadius={8}
                style={styles.mt8}
              />
              <Skeleton
                width={150}
                height={18}
                borderRadius={8}
                style={styles.mt8}
              />
            </View>
            <View style={styles.mt24}>
              <Skeleton width="100%" height={160} borderRadius={radius.card} />
            </View>
            <View style={styles.mt16}>
              <Skeleton width="100%" height={160} borderRadius={radius.card} />
            </View>
          </View>
        ) : isError || !user ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>Không thể tải hồ sơ</Text>
            <Text style={styles.errorSubtitle}>{errorText(error)}</Text>
            <Button
              variant="primary"
              title="Thử lại"
              onPress={() => refetch()}
              style={styles.retryButton}
            />
          </View>
        ) : (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[
              styles.scrollContent,
              { paddingBottom: tabBarSpace + 32 },
            ]}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header thông tin người dùng */}
            <View style={styles.heroSection}>
              <Avatar
                id={user.id}
                size={88}
                shape="squircle"
                style={styles.avatar}
              />

              <Text style={styles.eyebrow}>{formatRole(user.role)}</Text>
              <Text style={styles.fullName}>{user.fullName}</Text>
              <Text style={styles.department}>
                {deptLabel(user.department) ?? 'Chưa cập nhật khoa'}
              </Text>
            </View>

            {/* Khối chỉnh sửa hồ sơ */}
            {isEditing ? (
              <View style={styles.editSection}>
                <SectionLabel title="Chỉnh sửa thông tin" />
                <View style={styles.editCard}>
                  <Field
                    label="Họ và tên"
                    value={fullName}
                    onChangeText={setFullName}
                    error={fieldErrors.fullName}
                    autoCapitalize="words"
                    placeholder="Nguyễn Văn A"
                  />

                  <View style={styles.fieldSpacer} />

                  <DepartmentPicker
                    label="Khoa"
                    value={department}
                    onChange={code => setDepartment(code ?? '')}
                    error={fieldErrors.department}
                  />

                  {generalError ? (
                    <Text style={styles.generalErrorText}>{generalError}</Text>
                  ) : null}

                  <View style={styles.editActions}>
                    <Button
                      variant="ghost"
                      title="Hủy"
                      disabled={updateMutation.isPending}
                      onPress={handleCancelEdit}
                      style={styles.flexBtn}
                    />
                    <Button
                      variant="primary"
                      title="Lưu"
                      loading={updateMutation.isPending}
                      onPress={handleSave}
                      style={styles.flexBtn}
                    />
                  </View>
                </View>
              </View>
            ) : null}

            {/* Nhóm thông tin chi tiết */}
            <SectionLabel title="Thông tin tài khoản" />
            <ProfileGroup>
              <ProfileRow label="Email" value={user.email} />

              {user.role === 'LECTURER' ? (
                // TODO(MO-05): Chọn phòng làm việc từ /campus/rooms
                <ProfileRow
                  divider
                  label="Phòng làm việc"
                  value="Chưa chọn"
                  description="TODO(MO-05)"
                />
              ) : null}
            </ProfileGroup>

            {/* Nhóm điều hướng các màn liên quan */}
            <SectionLabel title="Tùy chọn" />
            <ProfileGroup>
              {user.role !== 'ADMIN' ? (
                <ProfileRow
                  label="Lịch bận của tôi"
                  showChevron
                  onPress={() => navigation.navigate('MySchedule')}
                />
              ) : null}

              <ProfileRow
                divider={user.role !== 'ADMIN'}
                label="Cài đặt"
                showChevron
                onPress={() => navigation.navigate('Settings')}
              />

              <ProfileRow
                divider
                label="Trợ giúp và Giới thiệu"
                showChevron
                onPress={() => navigation.navigate('Help')}
              />
            </ProfileGroup>

            <ProfileGroup style={styles.mt24}>
              <ProfileRow
                testID="profile-sign-out"
                label="Đăng xuất"
                danger
                onPress={handleSignOut}
              />
            </ProfileGroup>
          </ScrollView>
        )}
      </BlurTarget>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  flexOne: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.gutter,
  },
  navEditBtn: {
    paddingHorizontal: 12,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 8,
  },
  avatar: {
    marginBottom: 16,
  },
  eyebrow: {
    ...text.eyebrow,
    color: colors.fg2,
    marginBottom: 6,
  },
  fullName: {
    ...text.t1,
    textAlign: 'center',
    marginBottom: 4,
  },
  department: {
    ...text.sm,
    color: colors.fg3,
    textAlign: 'center',
  },
  editSection: {
    marginTop: 8,
  },
  editCard: {
    backgroundColor: colors.s1,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  fieldSpacer: {
    height: 12,
  },
  generalErrorText: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.err,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  editActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  flexBtn: {
    flex: 1,
  },
  loadingContainer: {
    paddingHorizontal: space.gutter,
    paddingTop: 16,
  },
  skeletonHero: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  mt8: {
    marginTop: 8,
  },
  mt12: {
    marginTop: 12,
  },
  mt16: {
    marginTop: 16,
  },
  mt24: {
    marginTop: 24,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: space.gutter,
  },
  errorTitle: {
    ...text.t2,
    color: colors.fg,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorSubtitle: {
    ...text.sub,
    color: colors.fg3,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    minWidth: 140,
  },
});
