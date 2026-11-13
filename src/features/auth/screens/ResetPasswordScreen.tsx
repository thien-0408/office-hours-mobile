import { useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import type {
  NativeStackNavigationProp,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import {
  AppText,
  Button,
  Field,
  StatusPill,
  type FieldInputRef,
} from '../../../components';
import { resetPassword } from '../../../api/auth';
import { colors } from '../../../theme';
import type { AuthStackParamList } from '../../../navigation/types';
import { classifyResetError, MSG } from '../authErrors';
import { setAuthNotice } from '../authNotice';
import { AuthLayout, Spacer } from '../components/AuthLayout';
import { PasswordField } from '../components/PasswordField';
import { PasswordRules } from '../PasswordRules';
import { extractToken, isPasswordValid } from '../validators';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

export function ResetPasswordScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<NativeStackScreenProps<AuthStackParamList, 'ResetPassword'>['route']>();
  const paramToken = route.params?.token?.trim() ?? '';
  const confirmRef = useRef<FieldInputRef>(null);
  const passRef = useRef<FieldInputRef>(null);

  const [pasted, setPasted] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenBad, setTokenBad] = useState(false);
  const [done, setDone] = useState(false);

  const token = paramToken || extractToken(pasted);
  const valid =
    token.length > 0 && isPasswordValid(password) && password === confirm;

  const toLogin = () => {
    setAuthNotice(null);
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  const submit = async () => {
    if (!valid || busy) {
      return;
    }
    setBusy(true);
    setError(null);
    setTokenBad(false);
    try {
      await resetPassword(token, password);
      setDone(true);
    } catch (e) {
      const f = classifyResetError(e);
      if (f === 'invalidToken') {
        setTokenBad(true);
      } else if (f === 'network') {
        setError(MSG.network);
      } else if (f === 'weakPassword') {
        setError('Mật khẩu hoặc mã chưa hợp lệ. Kiểm tra lại rồi thử lại.');
      } else {
        setError(MSG.generic);
      }
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <AuthLayout tone="brand" glowPosition="c">
        <Spacer />
        <StatusPill status="CONFIRMED" label="Xong" style={styles.pill} />
        <AppText variant="hero" style={styles.doneTitle}>
          {'Mật khẩu\nđã được đổi.'}
        </AppText>
        <AppText variant="sub" style={styles.sub}>
          Đăng nhập lại bằng mật khẩu mới để tiếp tục.
        </AppText>
        <Spacer />
        <Button title="Về đăng nhập" onPress={toLogin} />
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      tone="wine"
      glowPosition="tr"
      onBack={() =>
        navigation.canGoBack() ? navigation.goBack() : toLogin()
      }
      right={
        paramToken ? (
          <StatusPill status="CONFIRMED" label="Đã lấy mã từ link" />
        ) : undefined
      }
    >
      <AppText variant="t1" style={styles.title}>
        Đặt mật khẩu mới
      </AppText>
      <AppText variant="sub" style={styles.sub}>
        Sau khi lưu, đăng nhập lại bằng mật khẩu này.
      </AppText>

      {tokenBad ? (
        <View style={styles.bad} accessibilityRole="alert">
          <AppText variant="sm" color={colors.err}>
            {MSG.invalidResetToken}
          </AppText>
          <Button
            variant="ghost"
            title="Gửi link mới"
            style={styles.badBtn}
            onPress={() => navigation.navigate('ForgotPassword')}
          />
        </View>
      ) : null}

      <View style={styles.form}>
        {paramToken ? null : (
          <Field
            label="Mã đặt lại (dán từ link trong email)"
            value={pasted}
            onChangeText={t => {
              setPasted(t);
              setTokenBad(false);
            }}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="next"
            onSubmitEditing={() => passRef.current?.focus()}
            blurOnSubmit={false}
            editable={!busy}
          />
        )}
        <PasswordField
          ref={passRef}
          label="Mật khẩu mới"
          value={password}
          onChangeText={setPassword}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
          onSubmitEditing={() => confirmRef.current?.focus()}
          blurOnSubmit={false}
          editable={!busy}
        />
        <PasswordField
          ref={confirmRef}
          label="Nhập lại"
          placeholder="Nhập lại mật khẩu mới"
          value={confirm}
          onChangeText={setConfirm}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
          editable={!busy}
        />
      </View>
      <PasswordRules password={password} confirm={confirm} />

      {error ? (
        <AppText variant="sm" color={colors.err} style={styles.error}>
          {error}
        </AppText>
      ) : null}

      <Spacer />
      <Button
        title="Lưu mật khẩu mới"
        loading={busy}
        disabled={!valid && !busy}
        onPress={submit}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 16 },
  sub: { marginTop: 10, maxWidth: 300 },
  form: { marginTop: 28, gap: 10 },
  error: { marginTop: 12 },
  bad: { marginTop: 20, gap: 10 },
  badBtn: { alignSelf: 'flex-start', paddingHorizontal: 20 },
  pill: { alignSelf: 'flex-start' },
  doneTitle: { marginTop: 12 },
});
