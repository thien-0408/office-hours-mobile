import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
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
  ToastBanner,
} from '../../components/AuthPrimitives';
import { GlowBackground } from '../../components/GlowBackground';
import { OdometerCountdown } from '../../components/Odometer';
import { colors, fontFamily, typography } from '../../theme/tokens';

interface LoginScreenProps {
  initialEmail?: string;
  onBack?: () => void;
  onGoRegister: () => void;
  onGoForgotPassword: () => void;
  onSubmitLogin: (payload: {
    email: string;
    password: string;
  }) => Promise<{ retryAfterSeconds?: number } | void>;
}

export function LoginScreen({
  initialEmail = '',
  onBack,
  onGoRegister,
  onGoForgotPassword,
  onSubmitLogin,
}: LoginScreenProps) {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [passwordError, setPasswordError] = useState<string | undefined>();
  const [rateLimitLeft, setRateLimitLeft] = useState(0);

  // Đếm lùi khi dính 429 AUTH_RATE_LIMITED
  useEffect(() => {
    if (rateLimitLeft <= 0) return;
    const timer = setInterval(() => {
      setRateLimitLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [rateLimitLeft]);

  const isRateLimited = rateLimitLeft > 0;
  const canSubmit = email.trim().length > 0 && password.length > 0 && !isRateLimited;

  const handleLogin = async () => {
    if (!canSubmit || loading) return;
    setLoading(true);
    setPasswordError(undefined);
    try {
      await onSubmitLogin({ email: email.trim(), password });
    } catch (err: any) {
      if (err?.status === 429) {
        setRateLimitLeft(err?.retryAfter ?? 60);
      } else {
        setPasswordError('Email hoặc mật khẩu không đúng.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <GlowBackground
        tone="brand"
        position="tl"
        opacityOverride={isRateLimited ? 0.2 : 0.34}
      />

      <SafeAreaView style={styles.safe}>
        {/* Toast kính ở trên cùng khi bị giới hạn 429 */}
        {isRateLimited && (
          <ToastBanner
            glyph="warn"
            title="Thử quá nhiều lần"
            subtitle="Chờ một chút rồi đăng nhập lại."
          />
        )}

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            <View style={styles.topNav}>
              {onBack ? <IconButton icon="left" onPress={onBack} /> : <View />}
            </View>

            <RevealView index={0}>
              <Text style={[typography.h1, { marginTop: 16 }]}>
                {'Chào mừng\ntrở lại.'}
              </Text>
            </RevealView>
            <RevealView index={1}>
              <Text style={[typography.sub, { marginTop: 10 }]}>
                Đăng nhập bằng email trường.
              </Text>
            </RevealView>

            <View style={styles.form}>
              <RevealView index={2}>
                <AppField
                  label="Email"
                  placeholder="ten.ho@eiu.edu.vn"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  value={email}
                  onChangeText={(t) => {
                    setEmail(t);
                    if (passwordError) setPasswordError(undefined);
                  }}
                />
              </RevealView>

              <RevealView index={3}>
                <AppField
                  label="Mật khẩu"
                  placeholder="Nhập mật khẩu"
                  isPassword
                  value={password}
                  error={passwordError}
                  onChangeText={(t) => {
                    setPassword(t);
                    if (passwordError) setPasswordError(undefined);
                  }}
                />
              </RevealView>
            </View>

            <RevealView index={4} style={styles.forgotRow}>
              <Pressable onPress={onGoForgotPassword} hitSlop={8}>
                <Text style={[typography.sm, styles.link]}>Quên mật khẩu?</Text>
              </Pressable>
            </RevealView>

            <View style={{ flex: 1, minHeight: 32 }} />

            <RevealView index={5}>
              {isRateLimited ? (
                <PillButton
                  title="Thử lại sau "
                  disabled
                  rightSlot={<OdometerCountdown seconds={rateLimitLeft} />}
                />
              ) : (
                <PillButton
                  title="Đăng nhập"
                  disabled={!canSubmit}
                  loading={loading}
                  withArrow
                  onPress={handleLogin}
                />
              )}
            </RevealView>

            <RevealView index={6} style={styles.footerRow}>
              <Text style={typography.sm}>Chưa có tài khoản? </Text>
              <Pressable onPress={onGoRegister} hitSlop={8}>
                <Text style={[typography.sm, styles.link]}>Tạo tài khoản</Text>
              </Pressable>
            </RevealView>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  topNav: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  form: {
    gap: 10,
    marginTop: 28,
  },
  forgotRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 12,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
  },
  link: {
    fontFamily: fontFamily.bold,
    color: colors.fg,
  },
});