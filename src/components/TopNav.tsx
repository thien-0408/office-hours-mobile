import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { StyleSheet, Text, View } from 'react-native';
import { ChevronLeft } from 'lucide-react-native';
import { colors, fonts, ls, size as themeSize } from '../theme';
import { IconButton } from './IconButton';

export interface TopNavProps {
  title?: string | ReactNode;
  onBack?: () => void;
  left?: ReactNode;
  right?: ReactNode;
  backAccessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
}

export function TopNav({
  title,
  onBack,
  left,
  right,
  backAccessibilityLabel = 'Quay lại',
  style,
  titleStyle,
}: TopNavProps) {
  const renderLeft = () => {
    if (left) {
      return <View style={styles.sideSlot}>{left}</View>;
    }
    if (onBack) {
      return (
        <View style={styles.sideSlot}>
          <IconButton
            icon={ChevronLeft}
            accessibilityLabel={backAccessibilityLabel}
            onPress={onBack}
          />
        </View>
      );
    }
    return <View style={styles.sideSlot} />;
  };

  return (
    <View style={[styles.container, style]}>
      {renderLeft()}

      <View style={styles.centerSlot}>
        {title != null ? (
          typeof title === 'string' ? (
            <Text
              style={[styles.title, titleStyle]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {title}
            </Text>
          ) : (
            title
          )
        ) : null}
      </View>

      <View style={[styles.sideSlot, styles.rightAlign]}>
        {right ?? null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: themeSize.topNav, // 52
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sideSlot: {
    minWidth: themeSize.iconButton, // 40
    height: themeSize.iconButton,
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightAlign: {
    alignItems: 'flex-end',
  },
  centerSlot: {
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: fonts.bold,
    letterSpacing: ls(16, -0.03),
    color: colors.fg,
    textAlign: 'center',
  },
});
