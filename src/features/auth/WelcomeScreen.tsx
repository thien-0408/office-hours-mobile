import React, { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import {
  PillButton,
  RevealView,
  StatusPill,
} from '../../components/AuthPrimitives';
import { Glass } from '../../components/Glass';
import { GlowBackground } from '../../components/GlowBackground';
import { MonoIcon, OhLogo } from '../../components/Icons';
import { Pressable3D } from '../../components/Pressable3D';
import {
  colors,
  fontFamily,
  ls,
  radius,
  typography,
} from '../../theme/tokens';

interface WelcomeScreenProps {
  onGoLogin: () => void;
  onGoRegister: () => void;
}

export function WelcomeScreen({ onGoLogin, onGoRegister }: WelcomeScreenProps) {
  const [lang, setLang] = useState<'VI' | 'EN'>('VI');

  return (
    <View style={styles.root}>
      <GlowBackground position="dual-auth" />
      <SafeAreaView style={styles.safe}>
        {/* Topbar */}
        <View style={styles.topNav}>
          <View style={styles.brandRow}>
            <OhLogo size={30} color={colors.fg} />
            <Text style={styles.wordmark}>officehours</Text>
          </View>
          <Pressable3D onPress={() => setLang((l) => (l === 'VI' ? 'EN' : 'VI'))}>
            <Glass borderRadius={radius.pill} style={styles.langPill}>
              <MonoIcon name="globe" size={14} color={colors.fg} />
              <Text style={styles.langText}>{lang}</Text>
            </Glass>
          </Pressable3D>
        </View>

        {/* Hero Stack: 3 thẻ lịch hẹn xếp lớp */}
        <View style={styles.heroStack}>
          {/* Thẻ sau cùng (back1) */}
          <Glass borderRadius={radius.toast} style={[styles.heroCard, styles.back1]}>
            <View style={styles.rowCenter}>
              <View style={styles.miniAvatar} />
              <Text numberOfLines={1} style={[typography.sm, { flex: 1 }]}>
                ThS. Lê Hoàng · T5 09:30
              </Text>
              <StatusPill glyph="wait" label="Chờ duyệt" tone="soft" />
            </View>
          </Glass>

          {/* Thẻ giữa (back2) */}
          <Glass borderRadius={radius.toast} style={[styles.heroCard, styles.back2]}>
            <View style={styles.rowCenter}>
              <View style={styles.miniAvatar} />
              <Text numberOfLines={1} style={[typography.sm, { flex: 1 }]}>
                TS. Trần Hà · T3 10:00
              </Text>
              <StatusPill glyph="queue" label="Hàng đợi" tone="soft" />
            </View>
          </Glass>

          {/* Thẻ trước (front) — nghiêng tối đa 6° như thiết kế */}
          <RevealView index={0} style={styles.frontWrap}>
            <Pressable3D maxTilt={6}>
              <Glass borderRadius={radius.toast} style={styles.heroCard}>
                <View style={styles.rowCenter}>
                  <Image
                    source={{ uri: 'https://i.pravatar.cc/120?img=11' }}
                    style={styles.avatar}
                    contentFit="cover"
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={typography.h3}>TS. Nguyễn Minh Khoa</Text>
                    <Text style={typography.xs}>Khoa CNTT · phòng 306.B11</Text>
                  </View>
                  <View style={styles.chatBubbleIcon}>
                    <MonoIcon name="message" size={15} color={colors.fg} />
                  </View>
                </View>

                <View style={[styles.rowCenter, { marginTop: 16 }]}>
                  <Text style={typography.sm}>Thứ Tư 18/11 · 14:00</Text>
                  <View style={{ flex: 1 }} />
                  <StatusPill glyph="ok" label="Đã xác nhận" tone="done" />
                </View>
              </Glass>
            </Pressable3D>
          </RevealView>
        </View>

        <View style={{ flex: 1 }} />

        {/* Nội dung chính */}
        <RevealView index={1}>
          <Text style={typography.eyebrow}>EIU · Office hours</Text>
        </RevealView>
        <RevealView index={2}>
          <Text style={[typography.hero, { marginTop: 8 }]}>
            {'Gặp giảng viên,\nkhông cần xếp hàng.'}
          </Text>
        </RevealView>
        <RevealView index={3}>
          <Text style={[typography.sub, { marginTop: 12 }]}>
            Xem lịch rảnh, đặt slot và nhận xác nhận ngay trên điện thoại.
          </Text>
        </RevealView>

        {/* Dots */}
        <RevealView index={4} style={styles.dots}>
          <View style={[styles.dot, styles.dotOn]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </RevealView>

        {/* CTA Buttons */}
        <RevealView index={5} style={styles.ctaGroup}>
          <PillButton title="Đăng nhập" variant="primary" onPress={onGoLogin} />
          <PillButton
            title="Tạo tài khoản"
            variant="glass"
            onPress={onGoRegister}
          />
        </RevealView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  safe: { flex: 1, paddingHorizontal: 22, paddingBottom: 24 },
  topNav: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  wordmark: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    letterSpacing: ls(18, -0.055),
    color: colors.fg,
  },
  langPill: {
    height: 30,
    paddingHorizontal: 11,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  langText: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12,
    color: colors.fg2,
  },
  heroStack: {
    height: 270,
    marginTop: 12,
    position: 'relative',
  },
  heroCard: {
    padding: 14,
  },
  back1: {
    position: 'absolute',
    top: 0,
    left: 16,
    right: 16,
    opacity: 0.55,
    transform: [{ scale: 0.92 }],
  },
  back2: {
    position: 'absolute',
    top: 66,
    left: 8,
    right: 8,
    opacity: 0.8,
    transform: [{ scale: 0.96 }],
  },
  frontWrap: {
    position: 'absolute',
    top: 138,
    left: 0,
    right: 0,
  },
  rowCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.s3,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.s3,
  },
  chatBubbleIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.glassHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 20,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 6,
    backgroundColor: colors.fg4,
  },
  dotOn: {
    width: 18,
    backgroundColor: colors.fg,
  },
  ctaGroup: {
    gap: 10,
    marginTop: 24,
  },
});