import React, { useState } from 'react';
import {
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  SettingsGroup,
  SettingsRow,
  SubLabel,
} from '../../components/AppPrimitives';
import { IconButton, RevealView } from '../../components/AuthPrimitives';
import { GlowBackground } from '../../components/GlowBackground';
import { MonoIcon, OhLogo } from '../../components/Icons';
import {
  colors,
  fontFamily,
  ls,
  radius,
  squircle,
  typography,
} from '../../theme/tokens';

if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const FAQ_ITEMS = [
  {
    q: 'Đặt lịch với giảng viên thế nào?',
    a: 'Vào mục Giảng viên, chọn người cần gặp và khung giờ còn trống, nhập nội dung trao đổi rồi gửi yêu cầu. Giảng viên sẽ xác nhận trên hệ thống.',
  },
  {
    q: 'Vì sao không hủy được lịch hẹn?',
    a: 'Trong vòng 24 giờ trước buổi hẹn, lịch không hủy hay đổi được trên app. Hãy nhắn tin cho giảng viên trong phòng chat của buổi hẹn.',
  },
  {
    q: 'Hàng đợi hoạt động ra sao?',
    a: 'Khi slot đã kín chỗ, bạn có thể vào hàng đợi. Nếu có người hủy, hệ thống sẽ giữ chỗ trong một khoảng thời gian ngắn để bạn xác nhận.',
  },
  {
    q: 'App dùng vị trí của tôi khi nào?',
    a: 'Chỉ khi đến giờ hẹn trực tiếp và cả hai bên cùng bật chia sẻ vị trí trên bản đồ campus. Dữ liệu không lưu lại sau khi buổi hẹn kết thúc.',
  },
];

interface HelpScreenProps {
  onBack?: () => void;
  onPressPrivacy?: () => void;
}

export function HelpScreen({ onBack, onPressPrivacy }: HelpScreenProps) {
  // Mở sẵn mục 1 ("Vì sao không hủy được lịch hẹn?") giống mock
  const [openIndex, setOpenIndex] = useState<number | null>(1);

  const toggleFaq = (idx: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenIndex((prev) => (prev === idx ? null : idx));
  };

  return (
    <View style={styles.root}>
      <GlowBackground tone="brand" position="tl" opacityOverride={0.22} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.appHead}>
            <IconButton icon="left" onPress={onBack} />
          </View>

          <RevealView index={0}>
            <Text style={[typography.h1, { marginTop: 8 }]}>Trợ giúp</Text>
          </RevealView>

          {/* Nhóm FAQ mở rộng tại chỗ */}
          <RevealView
            index={1}
            style={[styles.faqGroup, squircle(radius.card)]}
          >
            {FAQ_ITEMS.map((item, idx) => {
              const expanded = openIndex === idx;
              return (
                <React.Fragment key={idx}>
                  {idx > 0 && <View style={styles.line} />}
                  <Pressable
                    onPress={() => toggleFaq(idx)}
                    style={styles.faqRow}
                  >
                    <View style={styles.faqHeader}>
                      <Text style={styles.faqQuestion}>{item.q}</Text>
                      {!expanded && (
                        <MonoIcon name="down" size={15} color={colors.fg3} />
                      )}
                    </View>
                    {expanded && (
                      <Text style={styles.faqAnswer}>{item.a}</Text>
                    )}
                  </Pressable>
                </React.Fragment>
              );
            })}
          </RevealView>

          <RevealView index={2}>
            <SubLabel>Giới thiệu</SubLabel>
            <SettingsGroup>
              <SettingsRow label="Phiên bản" valueText="0.1.0 (beta)" />
              <SettingsRow
                label="Dữ liệu bản đồ"
                valueText="© OpenStreetMap"
              />
              <SettingsRow
                label="Quyền riêng tư"
                showChevron
                onPress={onPressPrivacy}
              />
            </SettingsGroup>
          </RevealView>

          <View style={{ flex: 1, minHeight: 32 }} />

          <RevealView index={3} style={styles.footer}>
            <OhLogo size={20} color={colors.fg3} />
            <Text style={typography.xs}>officehours · EIU · CSW434</Text>
          </RevealView>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: 18,
    paddingBottom: 28,
  },
  appHead: {
    height: 54,
    flexDirection: 'row',
    alignItems: 'center',
  },
  faqGroup: {
    marginTop: 20,
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
  },
  line: {
    height: 1,
    backgroundColor: colors.line,
  },
  faqRow: {
    minHeight: 52,
    paddingVertical: 14,
    justifyContent: 'center',
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    flex: 1,
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    letterSpacing: ls(15, -0.025),
    color: colors.fg,
  },
  faqAnswer: {
    fontFamily: fontFamily.medium,
    fontSize: 13,
    lineHeight: 19.5,
    letterSpacing: ls(13, -0.005),
    color: colors.fg3,
    marginTop: 6,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
  },
});