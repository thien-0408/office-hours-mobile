import type { ReactNode } from 'react';
import type { ScrollViewProps, StyleProp, ViewProps, ViewStyle } from 'react-native';
import { ScrollView, StyleSheet, View } from 'react-native';
import { type Edge, SafeAreaView } from 'react-native-safe-area-context';
import { colors, space } from '../theme';

export interface ScreenProps extends ViewProps {
  children?: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  contentContainerStyle?: StyleProp<ViewStyle>;
  scrollViewProps?: Omit<ScrollViewProps, 'style' | 'contentContainerStyle' | 'children'>;
}

export function Screen({
  children,
  scroll = false,
  edges = ['top'],
  style,
  contentContainerStyle,
  scrollViewProps,
  ...rest
}: ScreenProps) {
  return (
    <SafeAreaView edges={edges} style={[styles.root, style]} {...rest}>
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
