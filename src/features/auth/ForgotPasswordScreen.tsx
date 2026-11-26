import React, { useEffect, useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
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
} from '../../components/AuthPrimitives';
import { GlowBackground } from '../../components/GlowBackground';
import { GmailLogo } from '../../components/Icons';
import { OdometerCountdown } from '../../components/Odometer';
import { colors, radius, squircle, typography } from '../../theme/tokens';

interface ForgotPasswordScreenProps {
  initialEmail?: string;
  onBackToLogin: () => void;
  onSubmitForgotPassword: (email: string) => Promise<void>;
}

export function ForgotPasswordScreen({
  initialEmail = '',
  onBackToLogin,
  onSubmitForgotPassword,
}: ForgotPasswordScreenProps) {
  const [email, setEmail] = useState(initialEmail);
  const [step, setStep] = useState<'input' | 'sent'>('input');
  const [loading, setLoading] = useState(false);
  const [resendLeft, setResendLeft] = useState(0);

  useEffect(() => {
    if (resendLeft <= 0) return;
    const timer = setInterval(() => {
      setResendLeft((prev) => (prev > 1 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [resendLeft]);

  const handleSend = async () => {
    if (!email.trim() || loading) return;
    setLoading(true);
    try {
      // Backend luôn trả 202
      await onSubmitForgotPassword(email.trim());
    } finally {
      setLoading(false);
      setStep('sent');
      setResendLeft(60);
    }
  };

  const handleOpenGmail = async () => {
    const gmailUrl = Platform.OS === 'ios' ? 'googlegmail://' : 'intent:#Intent;package=com.google.android.gm;end';
    const supported = await Linking.canOpenURL(gmailUrl).catch(() => false);
    if (supported) {
      await Linking.openURL(gmailUrl);
    } else {
      await Linking.openURL('https://mail.google.com');
    }
  };

  const handleOpenOtherMail = async () => {
    await Linking.openURL('mailto:');
  };

  // Khung 3b: Đã gửi
  if (step === 'sent') {
    return (
      <View style={styles.root}>
        <GlowBackground tone="teal" position="c" />
        <SafeAreaView style={styles.safe}>
          <View style={styles.container}>
            <View style={styles.topNav}>
              <IconButton icon="x" onPress={onBackToLogin} />
            </View>

            <View style={{ flex: 1 }} />

            <View style={{ gap: 12 }}>
              <RevealView index={0}>
                <Text style={typography.hero}>{'Kiểm tra\nhộp thư.'}</Text>
              </RevealView>
              <RevealView index={1}>
                <Text style={[typography.sub, { maxWidth: 300 }]}>
                  Nếu <Text style={{ color: colors.fg }}>{email.trim()}</Text> có trong hệ thống, link đặt lại sẽ đến trong vài phút.
                </Text>
              </RevealView>
            </View>

            <RevealView index={2} style={[styles.infoCard, squircle(radius.card)]}>
              <View style={styles.infoRow}>
                <Text style={typography.sm}>Không thấy? Xem cả thư mục Spam.</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={typography.sm}>
                  Mở link trên điện thoại này để vào thẳng app.
                </Text>
              </View>
            </RevealView>

            <View style={{ flex: 1 }} />

            <RevealView index={3}>
              <PillButton
                title="Mở Gmail"
                variant="primary"
                leftSlot={<GmailLogo size={20} />}
                onPress={handleOpenGmail}
              />
            </RevealView>

            <RevealView index={4} style={{ marginTop: 10 }}>
              <PillButton
                title="Ứng dụng email khác"
                variant="glass"
                onPress={handleOpenOtherMail}
              />
            </RevealView>

            <RevealView index={5} style={{ marginTop: 8 }}>
              {resendLeft > 0 ? (
                <PillButton
                  title="Gửi lại sau "
                  variant="quiet"
                  disabled
                  rightSlot={
                    <OdometerCountdown
                      seconds={resendLeft}
                      color={colors.fg2}
                      fontSize={14}
                    />
                  }
                />
              ) : (
                <PillButton
                  title="Gửi lại email"
                  variant="quiet"
                  loading={loading}
                  onPress={handleSend}
                />
              )}
            </RevealView>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  // Khung 3: Nhập email quên mật khẩu
  return (
    <View style={styles.root}>
      <GlowBackground tone="teal" position="tl" />
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
              <IconButton icon="left" onPress={onBackToLogin} />
            </View>

            <RevealView index={0}>
              <Text style={[typography.h1, { marginTop: 16 }]}>
                Quên mật khẩu?
              </Text>
            </RevealView>
            <RevealView index={1}>
              <Text style={[typography.sub, { marginTop: 10 }]}>
                Nhập email trường. Nếu email có trong hệ thống, bạn sẽ nhận được link đặt lại.
              </Text>
            </RevealView>

            <RevealView index={2} style={{ marginTop: 28 }}>
              <AppField
                label="Email"
                placeholder="bao.pham@eiu.edu.vn"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                clearable
                onClear={() => setEmail('')}
                onChangeText={setEmail}
              />
            </RevealView>

            <View style={{ flex: 1, minHeight: 32 }} />

            <RevealView index={3}>
              <PillButton
                title={loading ? 'Đang gửi' : 'Gửi link đặt lại'}
                disabled={!email.trim()}
                loading={loading}
                onPress={handleSend}
              />
            </RevealView>

            <RevealView index={4} style={{ marginTop: 8 }}>
              <PillButton
                title="Quay lại đăng nhập"
                variant="quiet"
                onPress={onBackToLogin}
              />
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
  container: {
    flexGrow: 1,
    paddingHorizontal: 22,
    paddingBottom: 24,
  },
  topNav: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoCard: {
    marginTop: 28,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  infoRow: {
    minHeight: 52,
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: colors.line,
  },
});