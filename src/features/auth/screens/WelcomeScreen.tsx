import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  AppText,
  Avatar,
  Button,
  Screen,
  StatusPill,
} from '../../../components';
import { Glow, PressableCard } from '../../../components/motion';
import { colors, radius, space } from '../../../theme';
import type { AuthStackParamList } from '../../../navigation/types';
import { markWelcomeSeen } from '../../../navigation/welcomeFlag';

type Nav = NativeStackNavigationProp<AuthStackParamList>;

// Static illustration, no API. Names are made up.
function MiniCard({
  id,
  line,
  status,
  label,
  style,
}: {
  id: string;
  line: string;
  status: string;
  label: string;
  style: object;
}) {
  return (
    <View style={[styles.card, styles.back, style]}>
      <Avatar id={id} size={28} />
      <AppText variant="sm" style={styles.grow} numberOfLines={1}>
        {line}
      </AppText>
      <StatusPill status={status} label={label} />
    </View>
  );
}

export function WelcomeScreen() {
  const navigation = useNavigation<Nav>();

  const start = () => {
    markWelcomeSeen();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  };

  return (
    <View style={styles.root}>
      <Glow tone="indigo" position="tl" />
      <Glow tone="brand" position="tr" />
      <Screen edges={['top', 'bottom']} style={styles.transparent}>
        <View style={styles.brandRow}>
          <AppText variant="t2" style={styles.wordmark}>
            officehours
          </AppText>
        </View>

        <View style={styles.stack}>
          <MiniCard
            id="demo-1"
            line="ThS. Lê Hoàng · T5 09:30"
            status="PENDING"
            label="Chờ duyệt"
            style={styles.back1}
          />
          <MiniCard
            id="demo-2"
            line="TS. Trần Hà · T3 10:00"
            status="WAITING"
            label="Hàng đợi"
            style={styles.back2}
          />
          <PressableCard style={[styles.card, styles.front]}>
            <View style={styles.frontRow}>
              <Avatar id="demo-3" size={40} />
              <View style={styles.grow}>
                <AppText variant="t3">TS. Nguyễn Minh Khoa</AppText>
                <AppText variant="xs">Khoa CNTT · phòng 306.B11</AppText>
              </View>
            </View>
            <View style={[styles.frontRow, styles.frontBottom]}>
              <AppText variant="sm" style={styles.grow}>
                Thứ Tư 18/11 · 14:00
              </AppText>
              <StatusPill status="CONFIRMED" label="Đã xác nhận" />
            </View>
          </PressableCard>
        </View>

        <View style={styles.grow} />
        <AppText variant="eyebrow">EIU · Office hours</AppText>
        <AppText variant="hero" style={styles.title}>
          {'Gặp giảng viên,\nkhông cần xếp hàng.'}
        </AppText>
        <AppText variant="sub" style={styles.sub}>
          Xem lịch rảnh, đặt slot và nhận xác nhận ngay trên điện thoại.
        </AppText>
        <View style={styles.cta}>
          <Button title="Bắt đầu" onPress={start} />
        </View>
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  transparent: { backgroundColor: 'transparent' },
  grow: { flex: 1 },
  brandRow: { height: 52, justifyContent: 'center' },
  wordmark: { fontSize: 18 },
  stack: { marginTop: space.xxl, height: 210 },
  card: {
    backgroundColor: 'rgba(19,19,19,0.78)',
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.line,
    padding: 14,
  },
  back: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  back1: { top: 0, transform: [{ scale: 0.92 }], opacity: 0.55 },
  back2: { top: 28, transform: [{ scale: 0.96 }], opacity: 0.8 },
  front: { position: 'absolute', left: 0, right: 0, top: 70, padding: 16 },
  frontRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  frontBottom: { marginTop: 16 },
  title: { marginTop: 8 },
  sub: { marginTop: 12 },
  cta: { marginTop: space.xxl },
});
