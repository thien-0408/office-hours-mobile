import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { X } from 'lucide-react-native';
import { AppText, Button, Card, Field, IconButton } from '../../../components';
import { Odometer } from '../../../components/motion';
import { forgotPassword } from '../../../api/auth';
import { ApiError, NetworkError } from '../../../api/errors';
import { colors, text } from '../../../theme';
import type { AuthStackParamList } from '../../../navigation/types';
import { MSG } from '../authErrors';
import { AuthLayout, Spacer } from '../components/AuthLayout';
import { GmailButton } from '../components/GmailButton';
import { useCountdown } from '../rateLimit';
import { isValidEmail } from '../validators';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

const RESEND_SECONDS = 60;

export function ForgotPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const [email, setEmail] = useState('');
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { remaining, start } = useCountdown();

  const send = async (override?: string) => {
    const target = (override ?? email).trim();
    if (!isValidEmail(target) || busy || remaining > 0) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await forgotPassword(target);
      setSentTo(target);
      start(RESEND_SECONDS);
    } catch (e) {
      if (e instanceof ApiError && e.status === 429) {
        // Same result screen: do not reveal anything, just honour the wait.
        setSentTo(target);
        start(e.retryAfterSeconds ?? RESEND_SECONDS);
      } else {
        setError(e instanceof NetworkError ? MSG.network : MSG.generic);
      }
    } finally {
      setBusy(false);
    }
  };

  if (sentTo) {
    return (
      <AuthLayout tone="teal" glowPosition="c">
        <View style={styles.close}>
          <IconButton
            icon={X}
            accessibilityLabel="Đóng"
            onPress={() => navigation.navigate('Login')}
          />
        </View>
        <Spacer />
        <AppText variant="hero">{'Kiểm tra\nhộp thư.'}</AppText>
        <AppText variant="sub" style={styles.sentSub}>
          {'Nếu '}
          <AppText variant="sub" color={colors.fg}>
            {sentTo}
          </AppText>
          {' có trong hệ thống, link đặt lại sẽ đến trong vài phút.'}
        </AppText>
        <Card style={styles.tips}>
          <AppText variant="sm">Không thấy? Xem cả thư mục Spam.</AppText>
          <View style={styles.sep} />
          <AppText variant="sm">
            Link trong email mở trang web của OfficeHours. Copy mã trong link rồi
            dán vào màn đặt lại mật khẩu trong app.
          </AppText>
        </Card>
        <Spacer />
        <GmailButton />
        <Button
          variant="quiet"
          style={styles.gap}
          disabled={remaining > 0}
          loading={busy}
          title={remaining > 0 ? undefined : 'Gửi lại'}
          onPress={() => send(sentTo)}
        >
          {remaining > 0 ? (
            <View style={styles.row}>
              <AppText variant="sm">Gửi lại sau </AppText>
              <Odometer
                value={remaining}
                format="mm:ss"
                style={{ ...text.sm, color: colors.fg2 }}
              />
            </View>
          ) : undefined}
        </Button>
        <Button
          variant="quiet"
          title="Nhập mã đặt lại"
          onPress={() => navigation.navigate('ResetPassword')}
        />
        <Button
          variant="quiet"
          title="Quay lại đăng nhập"
          onPress={() => navigation.navigate('Login')}
        />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout tone="teal" onBack={() => navigation.goBack()}>
      <AppText variant="t1" style={styles.title}>
        Quên mật khẩu?
      </AppText>
      <AppText variant="sub" style={styles.sub}>
        Nhập email trường. Nếu email có trong hệ thống, bạn sẽ nhận được link
        đặt lại.
      </AppText>
      <View style={styles.form}>
        <Field
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="username"
          returnKeyType="send"
          onSubmitEditing={() => send()}
          editable={!busy}
          error={error ?? undefined}
        />
      </View>
      <Spacer />
      <Button
        title="Gửi link đặt lại"
        loading={busy}
        disabled={!isValidEmail(email) && !busy}
        onPress={() => send()}
      />
      <Button
        variant="quiet"
        title="Quay lại đăng nhập"
        style={styles.gap}
        onPress={() => navigation.navigate('Login')}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 16 },
  sub: { marginTop: 10 },
  form: { marginTop: 28 },
  gap: { marginTop: 8 },
  close: { position: 'absolute', top: 6, left: 0 },
  sentSub: { marginTop: 12, maxWidth: 320 },
  tips: { marginTop: 28, gap: 12 },
  sep: { height: 1, backgroundColor: colors.line },
  row: { flexDirection: 'row', alignItems: 'center' },
});
