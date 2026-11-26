import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
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
} from '../../components/AuthPrimitives';
import { GlowBackground } from '../../components/GlowBackground';
import { MonoIcon } from '../../components/Icons';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

export type RegisterRole = 'STUDENT' | 'LECTURER';

const EIU_DEPARTMENTS = [
  'Công nghệ thông tin',
  'Quản trị kinh doanh',
  'Kỹ thuật điện - Điện tử',
  'Điều dưỡng',
  'Ngôn ngữ Anh',
];

interface RegisterScreenProps {
  onBackToLogin: () => void;
  onSubmitRegister: (payload: {
    role: RegisterRole;
    fullName: string;
    email: string;
    department: string;
    password: string;
  }) => Promise<void>;
}

export function RegisterScreen({
  onBackToLogin,
  onSubmitRegister,
}: RegisterScreenProps) {
  const [role, setRole] = useState<RegisterRole>('STUDENT');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [department, setDepartment] = useState('Công nghệ thông tin');
  const [password, setPassword] = useState('');
  const [deptSheetOpen, setDeptSheetOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Thanh độ mạnh mật khẩu 4 mức (8–72 ký tự theo RegisterRequest)
  const strength = useMemo(() => {
    let score = 0;
    if (password.length >= 4) score++;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password) && /[0-9]/.test(password)) score++;
    if (password.length >= 12 || /[^A-Za-z0-9]/.test(password)) score++;
    return score;
  }, [password]);

  const missingChars = Math.max(0, 8 - password.length);
  const isFormValid =
    fullName.trim().length > 0 &&
    email.trim().length > 0 &&
    department.length > 0 &&
    password.length >= 8 &&
    password.length <= 72;

  const handleRegister = async () => {
    if (!isFormValid || loading) return;
    setLoading(true);
    setFieldErrors({});
    try {
      await onSubmitRegister({
        role,
        fullName: fullName.trim(),
        email: email.trim(),
        department,
        password,
      });
    } catch (err: any) {
      // Đọc lỗi theo từng field từ details.errors[] của 400 VALIDATION_FAILED
      if (Array.isArray(err?.details?.errors)) {
        const mapped: Record<string, string> = {};
        for (const item of err.details.errors) {
          if (item.field && item.message) mapped[item.field] = item.message;
        }
        setFieldErrors(mapped);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      <GlowBackground tone="indigo" position="tr" />
      <SafeAreaView style={styles.safe}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={{ flex: 1 }}
        >
          <ScrollView
            contentContainerStyle={styles.scroll}
            keyboardShouldPersistTaps="handled"
          >
            {/* Topbar */}
            <View style={styles.topNav}>
              <IconButton icon="left" onPress={onBackToLogin} />
              <View style={styles.rowCenter}>
                <Text style={typography.xs}>Đã có tài khoản? </Text>
                <Pressable onPress={onBackToLogin} hitSlop={8}>
                  <Text style={[typography.xs, styles.link]}>Đăng nhập</Text>
                </Pressable>
              </View>
            </View>

            <RevealView index={0}>
              <Text style={[typography.h1, { marginTop: 8 }]}>Tạo tài khoản</Text>
            </RevealView>

            {/* Chọn vai trò: viên thuốc trượt như tab bar */}
            <RevealView index={1} style={styles.segWrap}>
              <Pressable
                onPress={() => setRole('STUDENT')}
                style={[styles.segTab, role === 'STUDENT' && styles.segTabOn]}
              >
                <MonoIcon
                  name="grad"
                  size={15}
                  color={role === 'STUDENT' ? colors.fg : colors.fg3}
                />
                <Text
                  style={[
                    styles.segText,
                    role === 'STUDENT' && styles.segTextOn,
                  ]}
                >
                  Sinh viên
                </Text>
              </Pressable>

              <Pressable
                onPress={() => setRole('LECTURER')}
                style={[styles.segTab, role === 'LECTURER' && styles.segTabOn]}
              >
                <MonoIcon
                  name="teach"
                  size={15}
                  color={role === 'LECTURER' ? colors.fg : colors.fg3}
                />
                <Text
                  style={[
                    styles.segText,
                    role === 'LECTURER' && styles.segTextOn,
                  ]}
                >
                  Giảng viên
                </Text>
              </Pressable>
            </RevealView>

            {/* Form */}
            <View style={styles.form}>
              <RevealView index={2}>
                <AppField
                  label="Họ và tên"
                  placeholder="Phạm Gia Bảo"
                  value={fullName}
                  error={fieldErrors.fullName}
                  onChangeText={setFullName}
                />
              </RevealView>

              <RevealView index={3}>
                <AppField
                  label="Email trường"
                  placeholder="bao.pham@eiu.edu.vn"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  error={fieldErrors.email}
                  onChangeText={setEmail}
                />
              </RevealView>

              <RevealView index={4}>
                <AppField
                  label="Khoa"
                  value={department}
                  rightIcon="down"
                  error={fieldErrors.department}
                  onPressField={() => setDeptSheetOpen(true)}
                />
              </RevealView>

              <RevealView index={5}>
                <AppField
                  label="Mật khẩu"
                  placeholder="Tối thiểu 8 ký tự"
                  isPassword
                  value={password}
                  error={fieldErrors.password}
                  onChangeText={setPassword}
                />
                {/* 4 vạch độ mạnh */}
                <View style={styles.meter}>
                  {[1, 2, 3, 4].map((idx) => (
                    <View
                      key={idx}
                      style={[
                        styles.meterBar,
                        idx <= strength && styles.meterBarOn,
                      ]}
                    />
                  ))}
                </View>
                <Text style={styles.meterHint}>
                  {missingChars > 0
                    ? `Cần ít nhất 8 ký tự, còn thiếu ${missingChars}.`
                    : password.length > 72
                      ? 'Mật khẩu không được quá 72 ký tự.'
                      : 'Độ dài hợp lệ.'}
                </Text>
              </RevealView>
            </View>

            <View style={{ flex: 1, minHeight: 28 }} />

            <RevealView index={6}>
              <PillButton
                title="Tạo tài khoản"
                disabled={!isFormValid}
                loading={loading}
                onPress={handleRegister}
              />
            </RevealView>
          </ScrollView>
        </KeyboardAvoidingView>

        {/* Bottom sheet chọn Khoa */}
        <Modal
          visible={deptSheetOpen}
          transparent
          animationType="fade"
          onRequestClose={() => setDeptSheetOpen(false)}
        >
          <Pressable
            style={styles.scrim}
            onPress={() => setDeptSheetOpen(false)}
          >
            <View style={[styles.sheet, squircle(radius.sheet)]}>
              <View style={styles.grab} />
              <Text style={[typography.h2, { marginBottom: 14 }]}>Chọn khoa</Text>
              {EIU_DEPARTMENTS.map((dept) => {
                const selected = dept === department;
                return (
                  <Pressable
                    key={dept}
                    onPress={() => {
                      setDepartment(dept);
                      setDeptSheetOpen(false);
                    }}
                    style={styles.deptRow}
                  >
                    <Text
                      style={[
                        typography.body,
                        !selected && { color: colors.fg2 },
                      ]}
                    >
                      {dept}
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
    justifyContent: 'space-between',
  },
  rowCenter: { flexDirection: 'row', alignItems: 'center' },
  link: { fontFamily: fontFamily.bold, color: colors.fg },
  segWrap: {
    marginTop: 20,
    flexDirection: 'row',
    padding: 4,
    borderRadius: radius.pill,
    backgroundColor: colors.s2,
    borderWidth: 1,
    borderColor: colors.line,
  },
  segTab: {
    flex: 1,
    height: 40,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  segTabOn: {
    backgroundColor: colors.glassHi,
    borderWidth: 1,
    borderColor: colors.glassLine,
  },
  segText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 14,
    color: colors.fg3,
  },
  segTextOn: {
    color: colors.fg,
  },
  form: {
    gap: 10,
    marginTop: 16,
  },
  meter: {
    flexDirection: 'row',
    gap: 5,
    paddingHorizontal: 4,
    paddingTop: 10,
  },
  meterBar: {
    flex: 1,
    height: 4,
    borderRadius: 4,
    backgroundColor: colors.fg4,
  },
  meterBarOn: {
    backgroundColor: colors.fg,
  },
  meterHint: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    letterSpacing: ls(12, -0.005),
    color: colors.fg3,
    paddingHorizontal: 4,
    paddingTop: 6,
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
  deptRow: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: colors.line,
  },
});