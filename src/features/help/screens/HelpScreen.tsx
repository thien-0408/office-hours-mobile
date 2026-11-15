import { useState } from 'react';
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {
  useNavigation,
  type NavigationProp,
  type ParamListBase,
} from '@react-navigation/native';
import { ChevronDown, ChevronUp } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TopNav, Icon } from '../../../components';
import { colors, fonts, ls, space, text } from '../../../theme';
import { ProfileGroup, SectionLabel } from '../../profile/components/ProfileGroup';
import { ProfileRow } from '../../profile/components/ProfileRow';
import { APP_INFO, FAQS, PRIVACY_POINTS } from '../helpData';

export function HelpScreen() {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const [expandedFaqId, setExpandedFaqId] = useState<string | null>('cancel');
  const [showPrivacyDetails, setShowPrivacyDetails] = useState(false);

  const toggleFaq = (id: string) => {
    setExpandedFaqId(prev => (prev === id ? null : id));
  };

  const handleOpenMapAttribution = () => {
    Linking.openURL(APP_INFO.mapUrl).catch(() => {
      // noop
    });
  };

  return (
    <SafeAreaView edges={['top']} style={styles.safeRoot}>
      <TopNav
        title="Trợ giúp và Giới thiệu"
        onBack={() => navigation.goBack()}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.headerTitle}>Trợ giúp</Text>

        {/* 1. Câu hỏi thường gặp */}
        <SectionLabel title="Câu hỏi thường gặp" />
        <ProfileGroup>
          {FAQS.map((faq, index) => {
            const isExpanded = expandedFaqId === faq.id;
            return (
              <Pressable
                key={faq.id}
                onPress={() => toggleFaq(faq.id)}
                accessibilityRole="button"
                accessibilityLabel={faq.question}
                accessibilityState={{ expanded: isExpanded }}
                style={({ pressed }) => [
                  styles.faqRow,
                  index > 0 && styles.faqDivider,
                  pressed && styles.pressed,
                ]}
              >
                <View style={styles.faqHeader}>
                  <Text style={styles.faqQuestion}>{faq.question}</Text>
                  <Icon
                    as={isExpanded ? ChevronUp : ChevronDown}
                    size={16}
                    level="muted"
                  />
                </View>

                {isExpanded ? (
                  <Text style={styles.faqAnswer}>{faq.answer}</Text>
                ) : null}
              </Pressable>
            );
          })}
        </ProfileGroup>

        {/* 2. Quyền riêng tư vị trí */}
        <SectionLabel title="Quyền riêng tư vị trí" />
        <ProfileGroup>
          <Pressable
            onPress={() => setShowPrivacyDetails(!showPrivacyDetails)}
            accessibilityRole="button"
            accessibilityLabel="Nguyên tắc quyền riêng tư vị trí"
            accessibilityState={{ expanded: showPrivacyDetails }}
            style={({ pressed }) => [
              styles.privacyRow,
              pressed && styles.pressed,
            ]}
          >
            <View style={styles.faqHeader}>
              <Text style={styles.faqQuestion}>Nguyên tắc bảo vệ dữ liệu vị trí</Text>
              <Icon
                as={showPrivacyDetails ? ChevronUp : ChevronDown}
                size={16}
                level="muted"
              />
            </View>

            {showPrivacyDetails ? (
              <View style={styles.privacyList}>
                {PRIVACY_POINTS.map((pt, idx) => (
                  <View key={idx} style={styles.privacyItem}>
                    <Text style={styles.bullet}>•</Text>
                    <Text style={styles.privacyText}>{pt}</Text>
                  </View>
                ))}
              </View>
            ) : (
              <Text style={styles.privacySummary}>
                Chỉ chia sẻ trong khung giờ hẹn, tối đa 15 phút sau, chỉ khi cả hai cùng bật và không lưu lên máy chủ.
              </Text>
            )}
          </Pressable>
        </ProfileGroup>

        {/* 3. Giới thiệu */}
        <SectionLabel title="Giới thiệu" />
        <ProfileGroup>
          <ProfileRow
            label="Phiên bản"
            value={APP_INFO.version}
          />

          <ProfileRow
            divider
            label="Dữ liệu bản đồ"
            value={APP_INFO.mapAttribution}
            showChevron
            onPress={handleOpenMapAttribution}
            accessibilityLabel="Mở liên kết bản quyền OpenStreetMap"
          />
        </ProfileGroup>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>{APP_INFO.footer}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeRoot: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: space.gutter,
    paddingBottom: 40,
  },
  headerTitle: {
    ...text.t1,
    marginTop: 8,
    marginBottom: 4,
  },
  faqRow: {
    paddingVertical: 14,
  },
  faqDivider: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  faqHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  faqQuestion: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.fg,
    letterSpacing: ls(15, -0.025),
    flex: 1,
  },
  faqAnswer: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.fg2,
    lineHeight: 19,
    marginTop: 8,
    letterSpacing: ls(13, -0.01),
  },
  privacyRow: {
    paddingVertical: 14,
  },
  privacySummary: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.fg3,
    lineHeight: 18,
    marginTop: 6,
  },
  privacyList: {
    marginTop: 10,
    gap: 8,
  },
  privacyItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  bullet: {
    fontSize: 13,
    color: colors.fg3,
    lineHeight: 18,
  },
  privacyText: {
    fontSize: 13,
    fontFamily: fonts.medium,
    color: colors.fg2,
    lineHeight: 18,
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  footer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 36,
    marginBottom: 16,
  },
  footerText: {
    ...text.xs,
    color: colors.fg3,
    textAlign: 'center',
  },
});
