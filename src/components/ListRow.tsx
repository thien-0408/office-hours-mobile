import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, fonts, ls, size as themeSize } from '../theme';
import { Avatar, type AvatarShape } from './Avatar';

export interface ListRowProps {
  title: string | ReactNode;
  subtitle?: string | ReactNode;
  avatarUri?: string | null;
  avatarId?: string;
  avatarShape?: AvatarShape;
  leading?: ReactNode;
  trailing?: ReactNode;
  divider?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  subtitleStyle?: StyleProp<TextStyle>;
}

export function ListRow({
  title,
  subtitle,
  avatarUri,
  avatarId,
  avatarShape = 'squircle',
  leading,
  trailing,
  divider = false,
  onPress,
  style,
  titleStyle,
  subtitleStyle,
}: ListRowProps) {
  const content = (
    <>
      {leading ? (
        leading
      ) : (
        <Avatar
          uri={avatarUri}
          id={avatarId}
          size={themeSize.rowImage} // 48
          shape={avatarShape}
        />
      )}

      <View style={styles.textCol}>
        {typeof title === 'string' ? (
          <Text
            style={[styles.title, titleStyle]}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {title}
          </Text>
        ) : (
          title
        )}

        {subtitle != null ? (
          typeof subtitle === 'string' ? (
            <Text
              style={[styles.subtitle, subtitleStyle]}
              numberOfLines={1}
              ellipsizeMode="tail"
            >
              {subtitle}
            </Text>
          ) : (
            subtitle
          )
        ) : null}
      </View>

      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
    </>
  );

  const containerStyles = [
    styles.container,
    divider && styles.divider,
    style,
  ];

  if (onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        onPress={onPress}
        style={({ pressed }) => [
          ...containerStyles,
          pressed && styles.pressed,
        ]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={containerStyles}>{content}</View>;
}

const styles = StyleSheet.create({
  container: {
    minHeight: themeSize.listRow, // 66
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  pressed: {
    opacity: 0.85,
  },
  textCol: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'center',
    gap: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: fonts.bold,
    letterSpacing: ls(15, -0.03),
    color: colors.fg,
  },
  subtitle: {
    fontSize: 12.5,
    fontFamily: fonts.medium,
    letterSpacing: ls(12.5, -0.01),
    color: colors.fg2,
  },
  trailing: {
    flexShrink: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
