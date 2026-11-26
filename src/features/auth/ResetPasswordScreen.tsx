import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AppField,
  IconButton,
  PillButton,
  RevealView,
  StatusPill,
} from '../../components/AuthPrimitives';
import { Glass } from '../../components/Glass';
import { GlowBackground } from '../../components/GlowBackground';
import { MonoIcon, StatusGlyph } from '../../components/Icons';
import { colors, fontFamily, ls, radius, typography } from '../../theme/tokens';

interface ResetPasswordScreenProps {
  deepLinkToken?: string;
  onCloseToLogin: () => void;
  onTokenInvalid: () => void;
  onSubmitResetPassword: (payload: {
    token: string;
    newPassword: string;
  }) => Promise<void>;
}

export function ResetPasswordScreen({
  deepLinkToken,
  onCloseToLogin,
  onTokenInvalid,
  onSubmitResetPassword,
}: ResetPasswordScreenProps) {
  const [manualToken, setManualToken] = useState(deepLinkToken ?? '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const token = (deepLinkToken ?? manualToken).trim();

  // 3 luật theo ResetPasswordRequest
  const ruleMin8 = newPassword.length >= 8;
  const ruleMax72 = newPassword.length > 0 && newPassword.length <= 72;
  const ruleMatch = newPassword.length > 0 && newPassword === confirmPassword;
  const canSave = token.length > 0 && ruleMin8 && ruleMax72 && ruleMatch;

  const handleSave = async () => {
    if (!canSave || loading) return;
    setLoading(true);
    try {
      await onSubmitResetPassword({ token, newPassword });
      setDone(true);
    } catch {
      // Token sai hoặc hết hạn -> quay về màn 3 với thông báo
      onTokenInvalid();
    } finally {
      setLoading(false);
    }
  };

  // Khung 4b: Thành công
  if (done) {
    return (
      <View style={styles.root}>
        <GlowBackground tone="brand" position="c" />
        <SafeAreaView style={styles.safe}>
          <View style={styles.container}>
            <View style={{ flex: 1 }} />

            <View style={{ gap: 12 }}>
              <RevealView index={0} style={{ alignSelf: 'flex-start' }}>
                <StatusPill glyph="ok" label="Xong" tone="done" />
              </RevealView>
              <RevealView index={1}>
                <Text style={typography.hero}>
                  {'Mật khẩu\nđã được đổi.'}
                </Text>
              </RevealView>
              <RevealView index={2}>
                <Text style={[typography.sub, { maxWidth: 290 }]}>
                  Đăng nhập lại bằng mật khẩu mới để tiếp tục.
                </Text>
              </RevealView>
            </View>

            <View style={{ flex: 1 }} />

            <RevealView index={3}>
              <PillButton
                title="Về đăng nhập"
                variant="primary"
                onPress={onCloseToLogin}
              />
            </RevealView>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Khung 4: Đặt mật khẩu mới
  return (
    <View style={styles.root}>
      <GlowBackground tone="wine" position="tr" />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.container}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.topNav}>
              <IconButton icon="x" onPress={onCloseToLogin} />
              {Boolean(deepLinkToken) && (
                <Glass borderRadius={radius.pill} style={styles.tokenPill}>
                  <StatusGlyph type="ok" size={15} color={colors.fg} />
                  <Text style={styles.tokenPillText}>Đã lấy mã từ link</Text>
                </Glass>
              )}
            </View>

            <RevealView index={0}>
              <Text style={[typography.h1, { marginTop: 16 }]}>
                Đặt mật khẩu mới
              </Text>
            </RevealView>
            <RevealView index={1}>
              <Text style={[typography.sub, { marginTop: 10 }]}>
                Sau khi lưu, đăng nhập lại bằng mật khẩu này.
              </Text>
            </RevealView>

            <View style={styles.form}>
              {!deepLinkToken && (
                <RevealView index={2}>
                  <AppField
                    label="Mã đặt lại từ email"
                    placeholder="Dán token từ email"
                    autoCapitalize="none"
                    value={manualToken}
                    onChangeText={setManualToken}
                  />
                </RevealView>
              )}

              <RevealView index={3}>
                <AppField
                  label="Mật khẩu mới"
                  placeholder="Nhập mật khẩu mới"
                  isPassword
                  value={newPassword}
                  onChangeText={setNewPassword}
                />
              </RevealView>

              <RevealView index={4}>
                <AppField
                  label="Nhập lại"
                  placeholder="Nhập lại mật khẩu mới"
                  isPassword
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </RevealView>
            </View>

            {/* 3 luật: vòng tròn rỗng -> vòng trắng đặc có dấu tick */}
            <RevealView index={5} style={styles.rules}>
              <RuleItem ok={ruleMin8} label="Ít nhất 8 ký tự" />
              <RuleItem ok={ruleMax72} label="Không quá 72 ký tự" />
              <RuleItem ok={ruleMatch} label="Hai ô khớp nhau" />
            </RevealView>

            <View style={{ flex: 1, minHeight: 32 }} />

            <RevealView index={6}>
              <PillButton
                title="Lưu mật khẩu mới"
                disabled={!canSave}
                loading={loading}
                onPress={handleSave}
              />
            </RevealView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

function RuleItem({ ok, label }: { ok: boolean; label: string }) {
  return (
    <View style={styles.ruleRow}>
      <View style={[styles.ruleDot, ok && styles.ruleDotOk]}>
        {ok && <MonoIcon name="check" size={11} color="#000" strokeWidth={3} />}
      </View>
      <Text style={[styles.ruleText, ok && styles.ruleTextOk]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  topNav: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tokenPill: {
    height: 28,
    paddingHorizontal: 10,
    paddingLeft: 7,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tokenPillText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.fg,
  },
  form: {
    gap: 10,
    marginTop: 28,
  },
  rules: {
    gap: 9,
    paddingHorizontal: 4,
    paddingTop: 14,
  },
  ruleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ruleDot: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: colors.fg4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ruleDotOk: {
    backgroundColor: colors.fg,
    borderWidth: 0,
  },
  ruleText: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    letterSpacing: ls(13, -0.01),
    color: colors.fg3,
  },
  ruleTextOk: {
    color: colors.fg,
  },
});