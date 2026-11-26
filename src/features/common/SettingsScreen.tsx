import React, { useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppRole,
  MochySwitch,
  NavPill,
  SettingsGroup,
  SettingsRow,
  SubLabel,
} from '../../components/AppPrimitives';
import { RevealView } from '../../components/AuthPrimitives';
import { MonoIcon } from '../../components/Icons';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

export type GlassPreference = 'auto' | 'high' | 'low' | 'solid';

const GLASS_OPTIONS: { key: GlassPreference; label: string }[] = [
  { key: 'auto', label: 'Tự động' },
  { key: 'high', label: 'Cao' },
  { key: 'low', label: 'Thấp' },
  { key: 'solid', label: 'Tắt' },
];

interface SettingsScreenProps {
  role?: AppRole;
  onPressChangePassword?: () => void;
  onPressLogout?: () => void;
  onChangeGlassPreference?: (pref: GlassPreference) => void;
  onChangeLanguage?: (lang: 'vi' | 'en') => void;
  onSelectTab?: (tab: string) => void;
}

export function SettingsScreen({
  role = 'sv',
  onPressChangePassword,
  onPressLogout,
  onChangeGlassPreference,
  onChangeLanguage,
  onSelectTab,
}: SettingsScreenProps) {
  const [statusNoti, setStatusNoti] = useState(true);
  const [reminderNoti, setReminderNoti] = useState(true);
  const [waitlistNoti, setWaitlistNoti] = useState(true);
  const [chatNoti, setChatNoti] = useState(false);

  const [language, setLanguage] = useState<'vi' | 'en'>('vi');
  const [glassPref, setGlassPref] = useState<GlassPreference>('auto');
  const [glassModalOpen, setGlassModalOpen] = useState(false);

  const currentGlassLabel =
    GLASS_OPTIONS.find((g) => g.key === glassPref)?.label ?? 'Tự động';

  return (
    <View style={styles.root}>
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.appHead}>
            <RevealView index={0}>
              <Text style={styles.pageTitle}>Cài đặt</Text>
            </RevealView>
          </View>

          <RevealView index={1}>
            <SubLabel style={{ marginTop: 12 }}>Thông báo</SubLabel>
            <SettingsGroup>
              <SettingsRow
                label="Lịch hẹn đổi trạng thái"
                subtitle="Xác nhận, từ chối, đổi giờ"
                rightSlot={
                  <MochySwitch value={statusNoti} onValueChange={setStatusNoti} />
                }
              />
              <SettingsRow
                label="Nhắc trước buổi hẹn"
                subtitle="60 phút và 10 phút trước"
                rightSlot={
                  <MochySwitch
                    value={reminderNoti}
                    onValueChange={setReminderNoti}
                  />
                }
              />
              <SettingsRow
                label="Có slot từ hàng đợi"
                rightSlot={
                  <MochySwitch
                    value={waitlistNoti}
                    onValueChange={setWaitlistNoti}
                  />
                }
              />
              <SettingsRow
                label="Tin nhắn mới"
                rightSlot={
                  <MochySwitch value={chatNoti} onValueChange={setChatNoti} />
                }
              />
            </SettingsGroup>
          </RevealView>

          <RevealView index={2}>
            <SubLabel>Hiển thị</SubLabel>
            <SettingsGroup>
              <SettingsRow
                label="Ngôn ngữ"
                valueText={language === 'vi' ? 'Tiếng Việt' : 'English'}
                showChevron
                onPress={() => {
                  const next = language === 'vi' ? 'en' : 'vi';
                  setLanguage(next);
                  onChangeLanguage?.(next);
                }}
              />
              <SettingsRow
                label="Hiệu ứng kính"
                valueText={currentGlassLabel}
                showChevron
                onPress={() => setGlassModalOpen(true)}
              />
            </SettingsGroup>
          </RevealView>

          <RevealView index={3}>
            <SubLabel>Tài khoản</SubLabel>
            <SettingsGroup>
              <SettingsRow
                label="Đổi mật khẩu"
                showChevron
                onPress={onPressChangePassword}
              />
              <SettingsRow
                label="Đăng xuất"
                danger
                onPress={onPressLogout}
              />
            </SettingsGroup>
          </RevealView>
        </ScrollView>
      </SafeAreaView>

      {/* Sheet chọn chất lượng hiệu ứng kính */}
      <Modal
        visible={glassModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setGlassModalOpen(false)}
      >
        <Pressable
          style={styles.scrim}
          onPress={() => setGlassModalOpen(false)}
        >
          <View style={[styles.sheet, squircle(radius.sheet)]}>
            <View style={styles.grab} />
            <Text style={[typography.h2, { marginBottom: 12 }]}>
              Hiệu ứng kính
            </Text>
            {GLASS_OPTIONS.map((opt) => {
              const selected = opt.key === glassPref;
              return (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    setGlassPref(opt.key);
                    onChangeGlassPreference?.(opt.key);
                    setGlassModalOpen(false);
                  }}
                  style={styles.optRow}
                >
                  <Text
                    style={[
                      typography.body,
                      !selected && { color: colors.fg2 },
                    ]}
                  >
                    {opt.label}
                  </Text>
                  {selected && (
                    <MonoIcon name="check" size={18} color={colors.fg} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>

      <NavPill role={role} activeTab="me" onSelectTab={onSelectTab} />
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
    paddingBottom: 34,
  },
  grab: {
    width: 40,
    height: 5,
    borderRadius: 5,
    backgroundColor: colors.fg4,
    alignSelf: 'center',
    marginBottom: 18,
  },
  optRow: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
});