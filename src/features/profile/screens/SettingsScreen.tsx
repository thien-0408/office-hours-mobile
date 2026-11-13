import { useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { SafeAreaView } from 'react-native-safe-area-context';
import { me, updateMe, changePassword } from '../../../api/users';
import type {
  Locale,
  NotificationPrefs,
  UserProfile,
} from '../../../api/types';
import { getLocale, setLocale } from '../../../api/client';
import { useGlass, type GlassQuality } from '../../../components/motion';
import { useAppSession } from '../../../navigation/devSession';
import { Button, Field, Seg, TopNav } from '../../../components';
import { colors, fonts, radius, space } from '../../../theme';
import { ProfileGroup, SectionLabel } from '../components/ProfileGroup';
import { ProfileRow } from '../components/ProfileRow';
import { Toggle } from '../components/Toggle';
import { useLocationConsent } from '../../../campus/consent';
import {
  NOTIFICATION_PREF_ITEMS,
  resolvePasswordError,
  validatePasswordChange,
} from '../profileLogic';

const LANG_OPTIONS = [
  { label: 'Tiếng Việt', value: 'vi' },
  { label: 'English', value: 'en' },
];

const GLASS_OPTIONS = [
  { label: 'Tự động', value: 'auto' },
  { label: 'Cao', value: 'high' },
  { label: 'Thấp', value: 'low' },
  { label: 'Tắt', value: 'solid' },
];

export function SettingsScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const queryClient = useQueryClient();
  const { signOut } = useAppSession();
  const { quality, setQuality } = useGlass();

  const [currentLocale, setCurrentLocale] = useState<Locale>(getLocale());
  const locationConsent = useLocationConsent();
  const locationSharing = locationConsent.status === 'granted';
  const onLocationSharingChange = (next: boolean) => {
    if (next) {
      // the consent screen explains what is shared, then asks the OS permission
      navigation.navigate('LocationConsent');
    } else {
      // TODO(MO-14): also remove own /bookingLive entries once Firebase is wired
      locationConsent.revoke().catch(() => {});
    }
  };

  // Pref update state
  const [prefError, setPrefError] = useState<string | null>(null);

  // Password change state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordErrors, setPasswordErrors] = useState<Record<string, string>>(
    {},
  );
  const [generalPasswordError, setGeneralPasswordError] = useState<
    string | null
  >(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Query user profile
  const { data: user } = useQuery<UserProfile>({
    queryKey: ['me'],
    queryFn: me,
  });

  const prefs = user?.notificationPrefs ?? {
    bookingConfirmed: true,
    bookingDeclined: true,
    waitlistOffer: true,
    reminders: true,
  };

  const handleTogglePref = async (
    key: keyof NotificationPrefs,
    nextVal: boolean,
  ) => {
    setPrefError(null);
    const previousMe = queryClient.getQueryData<UserProfile>(['me']);
    if (!previousMe) {
      return;
    }

    // Cập nhật lạc quan (optimistic update)
    const optimisticMe: UserProfile = {
      ...previousMe,
      notificationPrefs: {
        ...previousMe.notificationPrefs,
        [key]: nextVal,
      },
    };
    queryClient.setQueryData(['me'], optimisticMe);

    try {
      await updateMe({
        notificationPrefs: {
          [key]: nextVal,
        },
      });
    } catch {
      // Hoàn tác khi có lỗi (rollback)
      queryClient.setQueryData(['me'], previousMe);
      setPrefError('Không thể lưu tùy chọn thông báo. Vui lòng thử lại.');
    }
  };

  const handleLocaleChange = (val: string) => {
    const nextLocale = val as Locale;
    setLocale(nextLocale);
    setCurrentLocale(nextLocale);
  };

  const handleGlassChange = (val: string) => {
    setQuality(val as GlassQuality);
  };

  const handleChangePasswordSubmit = async () => {
    setPasswordErrors({});
    setGeneralPasswordError(null);
    setPasswordSuccess(null);

    const validation = validatePasswordChange({
      oldPassword,
      newPassword,
      confirmPassword,
    });

    if (!validation.isValid) {
      const mapped: Record<string, string> = {};
      if (validation.errors.oldPassword) {
        mapped.oldPassword = validation.errors.oldPassword;
      }
      if (validation.errors.newPassword) {
        mapped.newPassword = validation.errors.newPassword;
      }
      if (validation.errors.confirmPassword) {
        mapped.confirmPassword = validation.errors.confirmPassword;
      }
      setPasswordErrors(mapped);
      return;
    }

    setIsChangingPassword(true);
    try {
      await changePassword({
        oldPassword,
        newPassword,
      });
      setPasswordSuccess('Đổi mật khẩu thành công');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch (err: unknown) {
      const resolution = resolvePasswordError(err);
      if (resolution.fieldErrors) {
        setPasswordErrors(resolution.fieldErrors);
      }
      if (resolution.generalError) {
        setGeneralPasswordError(resolution.generalError);
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch {
      // noop
    }
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeRoot}>
      <TopNav title="Cài đặt" onBack={() => navigation.goBack()} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* 1. Thông báo (4 công tắc notificationPrefs) */}
        <SectionLabel title="Thông báo" />
        <ProfileGroup>
          {NOTIFICATION_PREF_ITEMS.map((item, index) => (
            <ProfileRow
              key={item.key}
              divider={index > 0}
              label={item.label}
              description={item.description}
              trailing={
                <Toggle
                  value={Boolean(prefs[item.key])}
                  onValueChange={val => handleTogglePref(item.key, val)}
                  accessibilityLabel={item.label}
                />
              }
            />
          ))}
        </ProfileGroup>
        <Text style={styles.prefNote}>
          * Chỉ áp dụng cho thông báo qua email
        </Text>
        {prefError ? (
          <Text style={styles.prefErrorText}>{prefError}</Text>
        ) : null}

        {/* 2. Vị trí */}
        <SectionLabel title="Vị trí" />
        <ProfileGroup>
          <ProfileRow
            label="Chia sẻ vị trí"
            description="Chỉ chia sẻ trong khung giờ hẹn trực tiếp"
            trailing={
              <Toggle
                value={locationSharing}
                onValueChange={onLocationSharingChange}
                accessibilityLabel="Chia sẻ vị trí"
              />
            }
          />
        </ProfileGroup>

        {/* 3. Hiển thị (Ngôn ngữ + Hiệu ứng kính) */}
        <SectionLabel title="Hiển thị" />
        <View style={styles.controlBox}>
          <Text style={styles.controlTitle}>Ngôn ngữ</Text>
          <Seg
            options={LANG_OPTIONS}
            value={currentLocale}
            onChange={handleLocaleChange}
            style={styles.mt8}
          />

          <View style={styles.controlDivider} />

          <Text style={styles.controlTitle}>Hiệu ứng kính</Text>
          <Seg
            options={GLASS_OPTIONS}
            value={quality}
            onChange={handleGlassChange}
            style={styles.mt8}
          />
        </View>

        {/* 4. Tài khoản (Đổi mật khẩu + Đăng xuất) */}
        <SectionLabel title="Tài khoản" />
        <ProfileGroup>
          <ProfileRow
            label="Đổi mật khẩu"
            showChevron={!showPasswordForm}
            onPress={() => {
              setShowPasswordForm(!showPasswordForm);
              setPasswordSuccess(null);
              setPasswordErrors({});
              setGeneralPasswordError(null);
            }}
          />

          {showPasswordForm ? (
            <View style={styles.passwordFormCard}>
              <Field
                label="Mật khẩu hiện tại"
                value={oldPassword}
                onChangeText={setOldPassword}
                secureTextEntry
                error={passwordErrors.oldPassword}
                placeholder="Nhập mật khẩu hiện tại"
              />

              <View style={styles.fieldSpacer} />

              <Field
                label="Mật khẩu mới"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
                error={passwordErrors.newPassword}
                hint="Từ 8 đến 72 ký tự"
                placeholder="Nhập mật khẩu mới"
              />

              <View style={styles.fieldSpacer} />

              <Field
                label="Nhập lại mật khẩu mới"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
                error={passwordErrors.confirmPassword}
                placeholder="Nhập lại mật khẩu mới"
              />

              {generalPasswordError ? (
                <Text style={styles.passwordErrorText}>
                  {generalPasswordError}
                </Text>
              ) : null}

              {passwordSuccess ? (
                <Text style={styles.passwordSuccessText}>
                  {passwordSuccess}
                </Text>
              ) : null}

              <View style={styles.passwordActions}>
                <Button
                  variant="ghost"
                  title="Đóng"
                  disabled={isChangingPassword}
                  onPress={() => setShowPasswordForm(false)}
                  style={styles.flexBtn}
                />
                <Button
                  variant="primary"
                  title="Cập nhật"
                  loading={isChangingPassword}
                  onPress={handleChangePasswordSubmit}
                  style={styles.flexBtn}
                />
              </View>
            </View>
          ) : null}

          <ProfileRow
            divider
            danger
            label="Đăng xuất"
            onPress={handleSignOut}
            accessibilityLabel="Đăng xuất tài khoản"
          />
        </ProfileGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.gutter,
    paddingBottom: 40,
  },
  prefNote: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.fg3,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  prefErrorText: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.err,
    marginTop: 4,
    paddingHorizontal: 4,
  },
  controlBox: {
    backgroundColor: colors.s1,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 16,
  },
  controlTitle: {
    fontSize: 13,
    fontFamily: fonts.semibold,
    color: colors.fg2,
    marginBottom: 4,
  },
  controlDivider: {
    height: 1,
    backgroundColor: colors.line,
    marginVertical: 14,
  },
  mt8: {
    marginTop: 8,
  },
  passwordFormCard: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
    paddingVertical: 16,
  },
  fieldSpacer: {
    height: 12,
  },
  passwordErrorText: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.err,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  passwordSuccessText: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    color: colors.ok,
    marginTop: 8,
    paddingHorizontal: 4,
  },
  passwordActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  flexBtn: {
    flex: 1,
  },
});
