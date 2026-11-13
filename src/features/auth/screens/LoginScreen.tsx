import { useCallback, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppText,
  Button,
  Field,
  StatusGlyph,
  type FieldInputRef,
} from '../../../components';
import { Odometer } from '../../../components/motion';
import { colors, text } from '../../../theme';
import { setDevRole } from '../../../navigation/devSession';
import type { AuthStackParamList } from '../../../navigation/types';
import { classifyLoginError, MSG } from '../authErrors';
import { consumeAuthNotice } from '../authNotice';
import { AuthLayout, Spacer } from '../components/AuthLayout';
import { PasswordField } from '../components/PasswordField';
import { useCountdown } from '../rateLimit';
import { useSession } from '../session';
import { isValidEmail } from '../validators';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function LoginScreen() {
  const navigation = useNavigation<Nav>();
  const { signIn } = useSession();
  const passwordRef = useRef<FieldInputRef>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const { remaining, start } = useCountdown();

  useFocusEffect(
    useCallback(() => {
      const n = consumeAuthNotice();
      if (n) {
        setNotice(n);
      }
    }, []),
  );

  const limited = remaining > 0;
  const canSubmit =
    isValidEmail(email) && password.length > 0 && !busy && !limited;

  const submit = async () => {
    if (!canSubmit) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      await signIn(email.trim(), password);
      // RootNavigator swaps to the role app once the session is signedIn.
    } catch (e) {
      const f = classifyLoginError(e);
      if (f.kind === 'rateLimited') {
        start(f.retryAfterSeconds);
      } else if (f.kind === 'invalid') {
        setError(MSG.invalidCredentials);
      } else if (f.kind === 'network') {
        setError(MSG.network);
      } else {
        setError(MSG.generic);
      }
      setBusy(false);
    }
  };

  return (
    <AuthLayout tone="brand">
      <AppText variant="t1" style={styles.title}>
        {'Chào mừng\ntrở lại.'}
      </AppText>
      <AppText variant="sub" style={styles.sub}>
        Đăng nhập bằng email trường.
      </AppText>

      {limited ? (
        <View style={styles.banner} accessibilityRole="alert">
          <StatusGlyph kind="warn" size={26} />
          <View style={styles.grow}>
            <AppText variant="t3">{MSG.rateLimited}</AppText>
            <AppText variant="xs">Chờ một chút rồi đăng nhập lại.</AppText>
          </View>
        </View>
      ) : null}
      {notice ? (
        <View style={styles.banner}>
          <StatusGlyph kind="ok" size={26} />
          <AppText variant="sm" color={colors.fg} style={styles.grow}>
            {notice}
          </AppText>
        </View>
      ) : null}

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
          returnKeyType="next"
          onSubmitEditing={() => passwordRef.current?.focus()}
          blurOnSubmit={false}
          editable={!busy}
        />
        <PasswordField
          ref={passwordRef}
          label="Mật khẩu"
          value={password}
          onChangeText={setPassword}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!busy}
          error={error ?? undefined}
        />
      </View>
      <View style={styles.forgot}>
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => navigation.navigate('ForgotPassword')}
        >
          <AppText variant="sm" color={colors.fg} style={styles.link}>
            Quên mật khẩu?
          </AppText>
        </Pressable>
      </View>

      <Spacer />
      <Button
        title={limited ? undefined : 'Đăng nhập'}
        loading={busy}
        disabled={!canSubmit && !busy}
        onPress={submit}
      >
        {limited ? (
          <View style={styles.countdown}>
            <AppText variant="button" color="rgba(255,255,255,0.42)">
              Thử lại sau{' '}
            </AppText>
            <Odometer
              value={remaining}
              format="mm:ss"
              style={odoStyle}
            />
          </View>
        ) : undefined}
      </Button>
      <View style={styles.register}>
        <AppText variant="sm">Chưa có tài khoản? </AppText>
        <Pressable
          accessibilityRole="link"
          hitSlop={8}
          onPress={() => navigation.navigate('Register')}
        >
          <AppText variant="sm" color={colors.fg} style={styles.link}>
            Tạo tài khoản
          </AppText>
        </Pressable>
      </View>

      {__DEV__ ? (
        <View style={styles.dev}>
          <AppText variant="xs">Dev</AppText>
          <Pressable onPress={() => setDevRole('STUDENT')} hitSlop={8}>
            <AppText variant="xs">Vào như SV</AppText>
          </Pressable>
          <Pressable onPress={() => setDevRole('LECTURER')} hitSlop={8}>
            <AppText variant="xs">Vào như GV</AppText>
          </Pressable>
          <Pressable onPress={() => setDevRole('ADMIN')} hitSlop={8}>
            <AppText variant="xs">Vào như AD</AppText>
          </Pressable>
        </View>
      ) : null}
    </AuthLayout>
  );
}

const odoStyle = { ...text.button, color: 'rgba(255,255,255,0.42)' };

const styles = StyleSheet.create({
  grow: { flex: 1 },
  title: { marginTop: 16 },
  sub: { marginTop: 10 },
  form: { marginTop: 28, gap: 10 },
  forgot: { marginTop: 12, alignItems: 'flex-end' },
  link: { fontFamily: text.t3.fontFamily },
  banner: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 18,
    backgroundColor: 'rgba(19,19,19,0.78)',
    borderWidth: 1,
    borderColor: colors.line,
  },
  countdown: { flexDirection: 'row', alignItems: 'center' },
  register: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dev: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 16,
    opacity: 0.5,
  },
});
