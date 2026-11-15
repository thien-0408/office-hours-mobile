import { useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppText,
  Button,
  DepartmentPicker,
  Field,
  Seg,
  type FieldInputRef,
} from '../../../components';
import { register } from '../../../api/auth';
import { colors, text } from '../../../theme';
import type { AuthStackParamList } from '../../../navigation/types';
import { classifyRegisterError } from '../authErrors';
import { setAuthNotice } from '../authNotice';
import { AuthLayout, Spacer } from '../components/AuthLayout';
import { PasswordField } from '../components/PasswordField';
import { PasswordRules } from '../PasswordRules';
import {
  isPasswordValid,
  validateEmail,
  validateFullName,
} from '../validators';

type Nav = NativeStackNavigationProp<AuthStackParamList>;
type Role = 'STUDENT' | 'LECTURER';
type Errors = Partial<
  Record<'fullName' | 'email' | 'password' | 'confirm' | 'department', string>
>;

const ROLE_OPTIONS = [
  { value: 'STUDENT', label: 'Sinh viên' },
  { value: 'LECTURER', label: 'Giảng viên' },
];

export function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const emailRef = useRef<FieldInputRef>(null);
  const passRef = useRef<FieldInputRef>(null);
  const confirmRef = useRef<FieldInputRef>(null);

  const [role, setRole] = useState<Role>('STUDENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const valid =
    validateFullName(fullName) === null &&
    validateEmail(email) === null &&
    isPasswordValid(password) &&
    password === confirm;

  const clear = (key: keyof Errors) =>
    setErrors(prev => (prev[key] ? { ...prev, [key]: undefined } : prev));

  const submit = async () => {
    if (!valid || busy) {
      return;
    }
    setBusy(true);
    setFormError(null);
    try {
      await register({
        email: email.trim(),
        password,
        fullName: fullName.trim(),
        role,
        department: department ?? undefined,
      });
      setAuthNotice('Đã tạo tài khoản. Đăng nhập để tiếp tục.');
      navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
    } catch (e) {
      const f = classifyRegisterError(e);
      setErrors(f.fields);
      setFormError(f.form ?? null);
      setBusy(false);
    }
  };

  return (
    <AuthLayout
      tone="indigo"
      glowPosition="tr"
      onBack={() => navigation.goBack()}
      right={
        <View style={styles.have}>
          <AppText variant="xs">Đã có tài khoản? </AppText>
          <Pressable
            accessibilityRole="link"
            hitSlop={8}
            onPress={() => navigation.navigate('Login')}
          >
            <AppText variant="xs" color={colors.fg} style={styles.link}>
              Đăng nhập
            </AppText>
          </Pressable>
        </View>
      }
    >
      <AppText variant="t1" style={styles.title}>
        Tạo tài khoản
      </AppText>

      <Seg
        style={styles.seg}
        options={ROLE_OPTIONS}
        value={role}
        onChange={v => setRole(v as Role)}
      />

      <View style={styles.form}>
        <Field
          label="Họ và tên"
          value={fullName}
          onChangeText={t => {
            setFullName(t);
            clear('fullName');
          }}
          autoComplete="name"
          textContentType="name"
          autoCapitalize="words"
          returnKeyType="next"
          onSubmitEditing={() => emailRef.current?.focus()}
          blurOnSubmit={false}
          maxLength={150}
          error={errors.fullName}
        />
        <Field
          ref={emailRef}
          label="Email trường"
          value={email}
          onChangeText={t => {
            setEmail(t);
            clear('email');
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          textContentType="emailAddress"
          returnKeyType="next"
          onSubmitEditing={() => passRef.current?.focus()}
          blurOnSubmit={false}
          error={errors.email}
        />
        <DepartmentPicker
          label="Khoa (không bắt buộc)"
          value={department}
          onChange={code => {
            setDepartment(code);
            clear('department');
          }}
          error={errors.department}
        />
        <View>
          <PasswordField
            ref={passRef}
            label="Mật khẩu"
            value={password}
            onChangeText={t => {
              setPassword(t);
              clear('password');
            }}
            autoComplete="new-password"
            textContentType="newPassword"
            returnKeyType="next"
            onSubmitEditing={() => confirmRef.current?.focus()}
            blurOnSubmit={false}
            error={errors.password}
          />
          <PasswordRules password={password} showMeter />
        </View>
        <PasswordField
          ref={confirmRef}
          label="Nhập lại mật khẩu"
          value={confirm}
          onChangeText={setConfirm}
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          onSubmitEditing={submit}
          error={
            confirm.length > 0 && confirm !== password
              ? 'Hai mật khẩu chưa khớp.'
              : undefined
          }
        />
      </View>

      {formError ? (
        <AppText variant="sm" color={colors.err} style={styles.formError}>
          {formError}
        </AppText>
      ) : null}

      <Spacer />
      <Button
        title="Tạo tài khoản"
        loading={busy}
        disabled={!valid && !busy}
        onPress={submit}
      />
    </AuthLayout>
  );
}

const styles = StyleSheet.create({
  title: { marginTop: 8 },
  seg: { marginTop: 20 },
  form: { marginTop: 16, gap: 10 },
  have: { flexDirection: 'row', alignItems: 'center' },
  link: { fontFamily: text.t3.fontFamily },
  formError: { marginTop: 12 },
});
