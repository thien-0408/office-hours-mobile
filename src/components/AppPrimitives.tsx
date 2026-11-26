import React, { useEffect } from 'react';
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { Image } from 'expo-image';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  colors,
  fontFamily,
  ls,
  radius,
  springs,
  squircle,
  typography,
} from '../theme/tokens';
import { Glass, GlassQuality } from './Glass';
import { MonoIcon, MonoIconName } from './Icons';
import { Pressable3D } from './Pressable3D';

export type AppRole = 'sv' | 'gv' | 'ad';

interface TabDef {
  key: string;
  label: string;
  icon: MonoIconName;
  badge?: number;
}

const ROLE_TABS: Record<AppRole, TabDef[]> = {
  sv: [
    { key: 'home', label: 'Trang chủ', icon: 'home' },
    { key: 'find', label: 'Giảng viên', icon: 'search' },
    { key: 'book', label: 'Lịch hẹn', icon: 'calendar' },
    { key: 'map', label: 'Bản đồ', icon: 'map' },
    { key: 'me', label: 'Tôi', icon: 'user' },
  ],
  gv: [
    { key: 'home', label: 'Trang chủ', icon: 'home' },
    { key: 'review', label: 'Duyệt', icon: 'inbox' },
    { key: 'book', label: 'Lịch', icon: 'calendar' },
    { key: 'map', label: 'Bản đồ', icon: 'map' },
    { key: 'me', label: 'Tôi', icon: 'user' },
  ],
  ad: [
    { key: 'users', label: 'Người dùng', icon: 'users' },
    { key: 'campus', label: 'Campus', icon: 'map' },
    { key: 'noti', label: 'Thông báo', icon: 'bell' },
    { key: 'me', label: 'Tôi', icon: 'user' },
  ],
};

/** Thanh nav viên thuốc nổi phía dưới màn hình */
export function NavPill({
  role,
  activeTab,
  onSelectTab,
  badges = {},
  glassQuality,
}: {
  role: AppRole;
  activeTab: string;
  onSelectTab?: (tabKey: string) => void;
  badges?: Record<string, number>;
  glassQuality?: GlassQuality;
}) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + 8;
  const tabs = ROLE_TABS[role];

  return (
    <View style={[styles.navWrap, { bottom: bottomOffset }]}>
      <Glass
        borderRadius={radius.pill}
        quality={glassQuality}
        style={styles.navPill}
      >
        {tabs.map((tab) => {
          const isOn = tab.key === activeTab;
          const badgeCount = badges[tab.key] ?? tab.badge;

          return (
            <Pressable
              key={tab.key}
              onPress={() => onSelectTab?.(tab.key)}
              style={[styles.tabBtn, isOn && styles.tabBtnOn]}
            >
              <MonoIcon
                name={tab.icon}
                size={21}
                color={isOn ? colors.fg : colors.fg2}
              />
              {isOn && <Text style={styles.tabLabel}>{tab.label}</Text>}
              {!isOn && Boolean(badgeCount && badgeCount > 0) && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>{badgeCount}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </Glass>
    </View>
  );
}

/** Thẻ "buổi hẹn sắp tới" nổi phía trên thanh nav (đóng vai mini player) */
export function NowCard({
  avatarUrl,
  name,
  subtitle,
  onPress,
  onPressChat,
  glassQuality,
}: {
  avatarUrl: string;
  name: string;
  subtitle: string;
  onPress?: () => void;
  onPressChat?: () => void;
  glassQuality?: GlassQuality;
}) {
  const insets = useSafeAreaInsets();
  const bottomOffset = Math.max(insets.bottom, 12) + 8 + 64 + 10;

  return (
    <View style={[styles.nowWrap, { bottom: bottomOffset }]}>
      <Pressable3D maxTilt={3} onPress={onPress}>
        <Glass
          borderRadius={22}
          quality={glassQuality}
          style={styles.nowCard}
        >
          <Image
            source={{ uri: avatarUrl }}
            style={[styles.nowAvatar, squircle(14)]}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1} style={styles.nowName}>
              {name}
            </Text>
            <Text numberOfLines={1} style={styles.nowSub}>
              {subtitle}
            </Text>
          </View>
          <Pressable
            onPress={onPressChat ?? onPress}
            hitSlop={8}
            style={styles.nowAct}
          >
            <MonoIcon name="message" size={18} color={colors.fg} />
          </Pressable>
        </Glass>
      </Pressable3D>
    </View>
  );
}

/** Cụm 3 số lớn thay cho chart trên Dashboard */
export function StatRow({
  items,
  style,
}: {
  items: { value: number | string; label: string }[];
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[styles.statsRow, style]}>
      {items.map((item, idx) => (
        <View key={idx}>
          <Text style={styles.statValue}>{item.value}</Text>
          <Text style={styles.statLabel}>{item.label}</Text>
        </View>
      ))}
    </View>
  );
}

/** Tiêu đề mục: cả dòng là vùng chạm */
export function SectionHeader({
  title,
  showChevron = false,
  moreText,
  onPress,
  style,
}: {
  title: string;
  showChevron?: boolean;
  moreText?: string;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.hsec,
        pressed && onPress && { opacity: 0.7 },
        style,
      ]}
    >
      <Text style={styles.hsecTitle}>{title}</Text>
      {showChevron && (
        <MonoIcon name="right" size={18} color={colors.fg3} />
      )}
      {moreText && <Text style={styles.hsecMore}>{moreText}</Text>}
    </Pressable>
  );
}

/** Nhãn nhóm phía trên SettingsGroup */
export function SubLabel({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return <Text style={[styles.subLabel, style]}>{children}</Text>;
}

/** Khung nhóm cài đặt bo góc 20px nền #0D0D0D */
export function SettingsGroup({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const items = React.Children.toArray(children).filter(Boolean);
  return (
    <View style={[styles.group, squircle(radius.card), style]}>
      {items.map((child, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <View style={styles.groupLine} />}
          {child}
        </React.Fragment>
      ))}
    </View>
  );
}

/** Dòng trong SettingsGroup (không có icon đầu dòng) */
export function SettingsRow({
  label,
  subtitle,
  valueText,
  showChevron = false,
  danger = false,
  rightSlot,
  onPress,
}: {
  label: string;
  subtitle?: string;
  valueText?: string;
  showChevron?: boolean;
  danger?: boolean;
  rightSlot?: React.ReactNode;
  onPress?: () => void;
}) {
  return (
    <Pressable
      disabled={!onPress}
      onPress={onPress}
      style={({ pressed }) => [
        styles.groupRow,
        pressed && onPress && { opacity: 0.65 },
      ]}
    >
      <View style={{ flex: 1, paddingRight: 12 }}>
        <Text style={[styles.rowLabel, danger && { color: colors.err }]}>
          {label}
        </Text>
        {subtitle && <Text style={styles.rowSub}>{subtitle}</Text>}
      </View>

      {valueText && <Text style={styles.rowVal}>{valueText}</Text>}
      {showChevron && <MonoIcon name="right" size={15} color={colors.fg3} />}
      {rightSlot}
    </Pressable>
  );
}

/** Công tắc gạt trắng đen kiểu Mochy */
export function MochySwitch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (val: boolean) => void;
}) {
  const progress = useSharedValue(value ? 1 : 0);

  useEffect(() => {
    progress.value = withSpring(value ? 1 : 0, springs.indicator);
  }, [value, progress]);

  const trackStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      [colors.s4, colors.fg],
    ),
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: progress.value * 20 }],
    backgroundColor: interpolateColor(
      progress.value,
      [0, 1],
      ['#777777', '#000000'],
    ),
  }));

  return (
    <Pressable onPress={() => onValueChange(!value)} hitSlop={8}>
      <Animated.View style={[styles.swTrack, trackStyle]}>
        <Animated.View style={[styles.swThumb, thumbStyle]} />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  navWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 15,
  },
  navPill: {
    height: 64,
    paddingHorizontal: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tabBtn: {
    height: 48,
    minWidth: 48,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    position: 'relative',
  },
  tabBtnOn: {
    backgroundColor: colors.glassHi,
    paddingLeft: 14,
    paddingRight: 16,
  },
  tabLabel: {
    fontFamily: fontFamily.bold,
    fontSize: 14,
    letterSpacing: ls(14, -0.03),
    color: colors.fg,
  },
  tabBadge: {
    position: 'absolute',
    top: 6,
    right: 4,
    minWidth: 17,
    height: 17,
    paddingHorizontal: 4,
    borderRadius: 9,
    backgroundColor: colors.fg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontFamily: fontFamily.bold,
    fontSize: 10.5,
    color: '#000',
  },
  nowWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 14,
  },
  nowCard: {
    height: 66,
    paddingHorizontal: 9,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  nowAvatar: {
    width: 48,
    height: 48,
    backgroundColor: colors.s3,
  },
  nowName: {
    fontFamily: fontFamily.bold,
    fontSize: 14.5,
    letterSpacing: ls(14.5, -0.03),
    color: colors.fg,
  },
  nowSub: {
    ...typography.sm,
    fontSize: 12.5,
    marginTop: 1,
  },
  nowAct: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.glassHi,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 30,
  },
  statValue: {
    fontFamily: fontFamily.bold,
    fontSize: 40,
    lineHeight: 40,
    letterSpacing: ls(40, -0.06),
    fontVariant: ['tabular-nums'],
    color: colors.fg,
  },
  statLabel: {
    ...typography.sm,
    fontSize: 12.5,
    marginTop: 6,
  },
  hsec: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 26,
    marginBottom: 12,
  },
  hsecTitle: {
    fontFamily: fontFamily.bold,
    fontSize: 18,
    letterSpacing: ls(18, -0.045),
    color: colors.fg,
  },
  hsecMore: {
    marginLeft: 'auto',
    fontFamily: fontFamily.semiBold,
    fontSize: 13,
    letterSpacing: ls(13, -0.01),
    color: colors.fg3,
  },
  subLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 12.5,
    color: colors.fg3,
    marginTop: 22,
    marginBottom: 6,
  },
  group: {
    backgroundColor: colors.s1,
    borderWidth: 1,
    borderColor: colors.line,
    paddingHorizontal: 16,
  },
  groupLine: {
    height: 1,
    backgroundColor: colors.line,
  },
  groupRow: {
    minHeight: 52,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rowLabel: {
    fontFamily: fontFamily.semiBold,
    fontSize: 15,
    letterSpacing: ls(15, -0.025),
    color: colors.fg,
  },
  rowSub: {
    fontFamily: fontFamily.medium,
    fontSize: 12,
    letterSpacing: ls(12, -0.005),
    color: colors.fg3,
    marginTop: 2,
  },
  rowVal: {
    fontFamily: fontFamily.medium,
    fontSize: 14,
    color: colors.fg3,
  },
  swTrack: {
    width: 50,
    height: 30,
    borderRadius: radius.pill,
    padding: 3,
    justifyContent: 'center',
  },
  swThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
});