import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare } from 'lucide-react-native';
import { colors, fonts, glass, ls } from '../../theme';
import { Avatar } from '../Avatar';
import { Icon } from '../Icon';
import { Glass } from './Glass';
import { NAV_PILL_TOP } from './NavPill';
import { NOW_CARD_GAP, NOW_CARD_HEIGHT } from './floatingSpace';

export type NowCardProps = {
  name: string;
  /** "Bắt đầu sau 12 phút · 306.B11" or "Đang diễn ra". */
  subtitle: string;
  avatarUri?: string | null;
  /** Id for the memoji fallback. */
  avatarId?: string;
  /** Tap the card. */
  onPress: () => void;
  /** Round trailing button (message icon). */
  onChat: () => void;
};

/**
 * `.nowcard`: floating "upcoming meeting" glass card that sits right above the NavPill
 * (the app's mini player). Absolutely positioned: mount it next to the NavPill. While it is
 * shown, report it with setNowCardVisible so screens add NOW_CARD_SPACE to their bottom padding.
 */
export function NowCard({
  name,
  subtitle,
  avatarUri,
  avatarId,
  onPress,
  onChat,
}: NowCardProps) {
  const insets = useSafeAreaInsets();
  return (
    <Glass
      style={[
        styles.card,
        { bottom: insets.bottom + NAV_PILL_TOP + NOW_CARD_GAP },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${name}. ${subtitle}`}
        onPress={onPress}
        style={styles.main}
      >
        <Avatar uri={avatarUri} id={avatarId} size={48} shape="squircle" />
        <View style={styles.text}>
          <Text style={styles.name} numberOfLines={1}>
            {name}
          </Text>
          <Text style={styles.sub} numberOfLines={1}>
            {subtitle}
          </Text>
        </View>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Nhắn tin"
        onPress={onChat}
        style={({ pressed }) => [styles.act, pressed && styles.pressed]}
      >
        <Icon as={MessageSquare} size={20} level="active" />
      </Pressable>
    </Glass>
  );
}

const styles = StyleSheet.create({
  card: {
    position: 'absolute',
    left: 16,
    right: 16,
    height: NOW_CARD_HEIGHT,
    paddingHorizontal: 9,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  main: {
    flex: 1,
    minWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  text: { flex: 1, minWidth: 0 },
  name: {
    fontSize: 14.5,
    fontFamily: fonts.bold,
    letterSpacing: ls(14.5, -0.03),
    color: colors.fg,
  },
  sub: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    letterSpacing: ls(12.5, -0.01),
    color: colors.fg2,
  },
  act: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: glass.highlight,
  },
  pressed: { opacity: 0.8 },
});
