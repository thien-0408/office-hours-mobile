import type { ReactNode } from 'react';
import type { ScrollViewProps, StyleProp, ViewProps, ViewStyle } from 'react-native';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '../theme';

export interface ScreenProps extends ViewProps {
  children?: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  /** Lift content above the keyboard (edge-to-edge Android does not resize). Default on. */
  avoidKeyboard?: boolean;
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollViewProps?: Omit<ScrollViewProps, 'style' | 'contentContainerStyle' | 'children'>;
}

export function Screen({
  children,
  scroll = false,
  edges = ['top'],
  avoidKeyboard = true,
  style,
  contentContainerStyle,
  scrollViewProps,
  ...rest
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, style]} {...rest}>
      <KeyboardAvoidingView
        style={styles.flexOne}
        behavior="padding"
        enabled={avoidKeyboard}
      >
        {scroll ? (
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.content, contentContainerStyle]}
            keyboardShouldPersistTaps="handled"
            {...scrollViewProps}
          >
            {children}
          </ScrollView>
        ) : (
          <View style={[styles.content, styles.flexOne, contentContainerStyle]}>
            {children}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: space.gutter,
  },
  flexOne: {
    flex: 1,
  },
});
