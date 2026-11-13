import type { ReactNode } from 'react';
import type { StyleProp, TextStyle, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { colors, fonts, ls } from '../../../theme';
import { Icon } from '../../../components';

export interface ProfileRowProps {
  label: string | ReactNode;
  description?: string | ReactNode;
  value?: string | ReactNode;
  trailing?: ReactNode;
  showChevron?: boolean;
  divider?: boolean;
  danger?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  labelStyle?: StyleProp<TextStyle>;
  valueStyle?: StyleProp<TextStyle>;
  testID?: string;
  accessibilityLabel?: string;
}

export function ProfileRow({
  label,
  description,
  value,
  trailing,
  showChevron = false,
  divider = false,
  danger = false,
  onPress,
  disabled = false,
  style,
  labelStyle,
  valueStyle,
  testID,
  accessibilityLabel,
}: ProfileRowProps) {
  const isInteractive = Boolean(onPress) && !disabled;

  const content = (
    <View
      style={[
        styles.row,
        divider && styles.divider,
        style,
      ]}
    >
      <View style={styles.leftCol}>
        {typeof label === 'string' ? (
          <Text
            style={[
              styles.label,
              danger && styles.dangerLabel,
              labelStyle,
            ]}
          >
            {label}
          </Text>
        ) : (
          label
        )}

        {description ? (
          typeof description === 'string' ? (
            <Text style={styles.description}>{description}</Text>
          ) : (
            description
          )
        ) : null}
      </View>

      <View style={styles.rightCol}>
        {value ? (
          typeof value === 'string' ? (
            <Text style={[styles.value, valueStyle]}>{value}</Text>
          ) : (
            value
          )
        ) : null}

        {trailing}

        {showChevron ? (
          <Icon as={ChevronRight} size={15} level="muted" />
        ) : null}
      </View>
    </View>
  );

  if (isInteractive) {
    return (
      <Pressable
        testID={testID}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        onPress={onPress}
        style={({ pressed }) => [pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return (
    <View testID={testID} accessibilityLabel={accessibilityLabel}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    minHeight: 52,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: colors.line,
  },
  leftCol: {
    flex: 1,
    justifyContent: 'center',
    gap: 2,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 'auto',
  },
  label: {
    fontSize: 15,
    fontFamily: fonts.semibold,
    color: colors.fg,
    letterSpacing: ls(15, -0.025),
  },
  dangerLabel: {
    color: colors.err,
  },
  description: {
    fontSize: 12,
    fontFamily: fonts.medium,
    color: colors.fg3,
    letterSpacing: ls(12, -0.005),
    lineHeight: 16,
    marginTop: 2,
  },
  value: {
    fontSize: 14,
    fontFamily: fonts.medium,
    color: colors.fg3,
    letterSpacing: ls(14, -0.01),
  },
  pressed: {
    opacity: 0.7,
  },
});
